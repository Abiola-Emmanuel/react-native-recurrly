import AuthShell from '@/components/auth/AuthShell';
import AuthTextField from '@/components/auth/AuthTextField';
import {
  hasAuthErrors,
  mapClerkError,
  normalizeEmail,
  sanitizeVerificationCode,
  validateSignInValues,
  validateVerificationCode,
  type AuthFieldErrors,
} from '@/lib/auth';
import { useSignIn } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

const DEFAULT_SIGN_IN_ERROR =
  'We could not finish signing you in. Please check your details and try again.';
const UNSUPPORTED_SECOND_FACTOR_ERROR =
  'This account needs an additional security step that is not available in this release yet.';

const SignIn = () => {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<AuthFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const isFetching = fetchStatus === 'fetching';
  const isVerifying = signIn.status === 'needs_client_trust';

  const setMergedErrors = React.useCallback(
    (nextFieldErrors: AuthFieldErrors, nextFormError: string | null = null) => {
      setFieldErrors(nextFieldErrors);
      setFormError(nextFormError);
    },
    [],
  );

  const clearError = React.useCallback((field: keyof AuthFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return { ...current, [field]: undefined };
    });
    setFormError(null);
  }, []);

  const finishSession = React.useCallback(async () => {
    const { error } = await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setFormError('One more security step is required before entering the app.');
          return;
        }

        const url = decorateUrl('/');

        if (Platform.OS === 'web' && url.startsWith('http')) {
          window.location.href = url;
          return;
        }

        router.replace(url as Href);
      },
    });

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_IN_ERROR);
      return false;
    }

    return true;
  }, [router, setMergedErrors, signIn]);

  const handleSubmit = async () => {
    const nextFieldErrors = validateSignInValues({ emailAddress, password });
    if (hasAuthErrors(nextFieldErrors)) {
      setMergedErrors(nextFieldErrors);
      return;
    }

    const normalizedEmail = normalizeEmail(emailAddress);
    setEmailAddress(normalizedEmail);
    setMergedErrors({});

    const { error } = await signIn.password({
      emailAddress: normalizedEmail,
      password,
    });

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_IN_ERROR);
      return;
    }

    if (signIn.status === 'complete') {
      await finishSession();
      return;
    }

    if (signIn.status === 'needs_client_trust') {
      const canUseEmailCode = signIn.supportedSecondFactors.some(
        (factor) => factor.strategy === 'email_code',
      );

      if (!canUseEmailCode) {
        setMergedErrors({}, UNSUPPORTED_SECOND_FACTOR_ERROR);
        return;
      }

      const mfaResult = await signIn.mfa.sendEmailCode();

      if (mfaResult.error) {
        const mappedError = mapClerkError(mfaResult.error);
        setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_IN_ERROR);
      }

      return;
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
      setMergedErrors({}, UNSUPPORTED_SECOND_FACTOR_ERROR);
      return;
    }

    setMergedErrors({}, DEFAULT_SIGN_IN_ERROR);
  };

  const handleVerify = async () => {
    const nextFieldErrors = validateVerificationCode(code);
    if (hasAuthErrors(nextFieldErrors)) {
      setMergedErrors(nextFieldErrors);
      return;
    }

    setMergedErrors({});

    const { error } = await signIn.mfa.verifyEmailCode({
      code: sanitizeVerificationCode(code),
    });

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_IN_ERROR);
      return;
    }

    if (signIn.status === 'complete') {
      await finishSession();
      return;
    }

    setMergedErrors({}, DEFAULT_SIGN_IN_ERROR);
  };

  const handleResendCode = async () => {
    setMergedErrors({});

    const { error } = await signIn.mfa.sendEmailCode();

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_IN_ERROR);
    }
  };

  const handleStartOver = async () => {
    await signIn.reset();
    setPassword('');
    setCode('');
    setPasswordVisible(false);
    setMergedErrors({});
  };

  const primaryLabel = isFetching
    ? isVerifying
      ? 'Verifying...'
      : 'Signing in...'
    : isVerifying
      ? 'Verify access'
      : 'Sign in';

  return (
    <AuthShell
      title={isVerifying ? 'Check your email' : 'Welcome back'}
      subtitle={
        isVerifying
          ? 'Enter the 6-digit security code we sent to keep your workspace protected.'
          : 'Sign in to continue managing your subscriptions.'
      }
      footerCopy="New to Recurly?"
      footerHref="/(auth)/sign-up"
      footerText="Create account"
    >
      <View className="auth-form">
        {formError ? (
          <View className="auth-form-notice">
            <Text className="auth-form-notice-text">{formError}</Text>
          </View>
        ) : null}

        {isVerifying ? (
          <>
            <AuthTextField
              label="Verification code"
              value={code}
              placeholder="Enter the 6-digit code"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              returnKeyType="done"
              maxLength={6}
              error={fieldErrors.code}
              onChangeText={(value) => {
                clearError('code');
                setCode(sanitizeVerificationCode(value));
              }}
            />

            <Pressable
              className={['auth-button', isFetching ? 'auth-button-disabled' : ''].join(' ')}
              disabled={isFetching}
              onPress={handleVerify}
            >
              {isFetching ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">{primaryLabel}</Text>
              )}
            </Pressable>

            <Pressable
              className="auth-secondary-button"
              disabled={isFetching}
              onPress={handleResendCode}
            >
              <Text className="auth-secondary-button-text">Send a new code</Text>
            </Pressable>

            <Pressable
              className="auth-secondary-button"
              disabled={isFetching}
              onPress={handleStartOver}
            >
              <Text className="auth-secondary-button-text">Start over</Text>
            </Pressable>
          </>
        ) : (
          <>
            <AuthTextField
              label="Email"
              value={emailAddress}
              placeholder="Enter your email"
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              autoCapitalize="none"
              returnKeyType="next"
              error={fieldErrors.email}
              onChangeText={(value) => {
                clearError('email');
                setEmailAddress(value);
              }}
            />

            <AuthTextField
              label="Password"
              value={password}
              placeholder="Enter your password"
              textContentType="password"
              autoComplete="password"
              returnKeyType="done"
              error={fieldErrors.password}
              showPasswordToggle
              passwordVisible={passwordVisible}
              onPasswordToggle={() => setPasswordVisible((current) => !current)}
              onChangeText={(value) => {
                clearError('password');
                setPassword(value);
              }}
            />

            <Pressable
              className={[
                'auth-button',
                !emailAddress.trim() || !password.trim() || isFetching ? 'auth-button-disabled' : '',
              ].join(' ')}
              disabled={!emailAddress.trim() || !password.trim() || isFetching}
              onPress={handleSubmit}
            >
              {isFetching ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">{primaryLabel}</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </AuthShell>
  );
};

export default SignIn;
