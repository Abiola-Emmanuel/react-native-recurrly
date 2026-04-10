import AuthShell from '@/components/auth/AuthShell';
import AuthTextField from '@/components/auth/AuthTextField';
import {
  hasAuthErrors,
  mapClerkError,
  normalizeEmail,
  sanitizeVerificationCode,
  validateSignUpValues,
  validateVerificationCode,
  type AuthFieldErrors,
} from '@/lib/auth';
import { useSignUp } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

const DEFAULT_SIGN_UP_ERROR =
  'We could not create your account yet. Please review your details and try again.';

const SignUp = () => {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<AuthFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const isFetching = fetchStatus === 'fetching';
  const isVerifying =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

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
    const { error } = await signUp.finalize({
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
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_UP_ERROR);
      return false;
    }

    return true;
  }, [router, setMergedErrors, signUp]);

  const handleSubmit = async () => {
    const nextFieldErrors = validateSignUpValues({
      emailAddress,
      password,
      confirmPassword,
    });

    if (hasAuthErrors(nextFieldErrors)) {
      setMergedErrors(nextFieldErrors);
      return;
    }

    const normalizedEmail = normalizeEmail(emailAddress);
    setEmailAddress(normalizedEmail);
    setMergedErrors({});

    const { error } = await signUp.password({
      emailAddress: normalizedEmail,
      password,
    });

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_UP_ERROR);
      return;
    }

    const verificationResult = await signUp.verifications.sendEmailCode();

    if (verificationResult.error) {
      const mappedError = mapClerkError(verificationResult.error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_UP_ERROR);
    }
  };

  const handleVerify = async () => {
    const nextFieldErrors = validateVerificationCode(code);
    if (hasAuthErrors(nextFieldErrors)) {
      setMergedErrors(nextFieldErrors);
      return;
    }

    setMergedErrors({});

    const { error } = await signUp.verifications.verifyEmailCode({
      code: sanitizeVerificationCode(code),
    });

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_UP_ERROR);
      return;
    }

    if (signUp.status === 'complete') {
      await finishSession();
      return;
    }

    setMergedErrors({}, DEFAULT_SIGN_UP_ERROR);
  };

  const handleResendCode = async () => {
    setMergedErrors({});

    const { error } = await signUp.verifications.sendEmailCode();

    if (error) {
      const mappedError = mapClerkError(error);
      setMergedErrors(mappedError.fieldErrors, mappedError.formError ?? DEFAULT_SIGN_UP_ERROR);
    }
  };

  const handleUseDifferentEmail = async () => {
    await signUp.reset();
    setPassword('');
    setConfirmPassword('');
    setCode('');
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    setMergedErrors({});
  };

  const primaryLabel = isFetching
    ? isVerifying
      ? 'Verifying...'
      : 'Creating account...'
    : isVerifying
      ? 'Verify email'
      : 'Create account';

  return (
    <AuthShell
      title={isVerifying ? 'Verify your email' : 'Create your account'}
      subtitle={
        isVerifying
          ? 'Enter the 6-digit code we sent to confirm your email and secure your workspace.'
          : 'Start tracking every renewal with one secure sign up.'
      }
      footerCopy="Already have an account?"
      footerHref="/(auth)/sign-in"
      footerText="Sign in"
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
              helperText={`Sent to ${emailAddress}`}
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
              onPress={handleUseDifferentEmail}
            >
              <Text className="auth-secondary-button-text">Use a different email</Text>
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
              placeholder="Create a password"
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="next"
              error={fieldErrors.password}
              helperText="Use at least 8 characters."
              showPasswordToggle
              passwordVisible={passwordVisible}
              onPasswordToggle={() => setPasswordVisible((current) => !current)}
              onChangeText={(value) => {
                clearError('password');
                setPassword(value);
              }}
            />

            <AuthTextField
              label="Confirm password"
              value={confirmPassword}
              placeholder="Re-enter your password"
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              error={fieldErrors.confirmPassword}
              showPasswordToggle
              passwordVisible={confirmPasswordVisible}
              onPasswordToggle={() => setConfirmPasswordVisible((current) => !current)}
              onChangeText={(value) => {
                clearError('confirmPassword');
                setConfirmPassword(value);
              }}
            />

            <Pressable
              className={[
                'auth-button',
                !emailAddress.trim() || !password || !confirmPassword || isFetching
                  ? 'auth-button-disabled'
                  : '',
              ].join(' ')}
              disabled={!emailAddress.trim() || !password || !confirmPassword || isFetching}
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

      <View nativeID="clerk-captcha" />
    </AuthShell>
  );
};

export default SignUp;
