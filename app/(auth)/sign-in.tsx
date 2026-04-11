import AuthField from '@/components/auth/AuthField';
import AuthScaffold from '@/components/auth/AuthScaffold';
import FullScreenLoader from '@/components/FullScreenLoader';
import {
  AUTH_ROUTES,
  finalizeAuthSession,
  getErrorMessage,
  getFieldError,
  getGlobalHookError,
  getTrimmedEmail,
  hasValidationErrors,
  validateCode,
  validateSignInValues,
} from '@/lib/auth';
import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const SignIn = () => {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'emailAddress' | 'password' | 'code', string>>
  >({});
  const [formError, setFormError] = useState<string | undefined>();

  if (!signIn) {
    return <FullScreenLoader label="Preparing sign-in..." />;
  }

  const isSubmitting = fetchStatus === 'fetching';
  const identifierError = getFieldError(localErrors.emailAddress, errors, 'identifier');
  const passwordError = getFieldError(localErrors.password, errors, 'password');
  const codeError = getFieldError(localErrors.code, errors, 'code');
  const globalError = formError ?? getGlobalHookError(errors) ?? undefined;

  const clearFieldError = (field: 'emailAddress' | 'password' | 'code') => {
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  };

  const handleFinalize = async () => {
    const { error } = await finalizeAuthSession(signIn, router);

    if (error) {
      setFormError(
        getErrorMessage(error, 'We signed you in, but could not finish navigation. Please try again.'),
      );
    }
  };

  const handleSubmit = async () => {
    const nextLocalErrors = validateSignInValues({ emailAddress, password });
    setLocalErrors(nextLocalErrors);
    setFormError(undefined);

    if (hasValidationErrors(nextLocalErrors)) {
      return;
    }

    const { error } = await signIn.password({
      emailAddress: getTrimmedEmail(emailAddress),
      password,
    });

    if (error) {
      setFormError(
        getErrorMessage(error, 'We could not sign you in. Please check your details and try again.'),
      );
      return;
    }

    if (signIn.status === 'complete') {
      await handleFinalize();
      return;
    }

    if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );

      if (emailCodeFactor) {
        const { error: emailCodeError } = await signIn.mfa.sendEmailCode();

        if (emailCodeError) {
          setFormError(
            getErrorMessage(emailCodeError, 'We could not send a verification code right now.'),
          );
        }
      }

      return;
    }

    setFormError('We need one more verification step before we can finish signing you in.');
  };

  const handleVerify = async () => {
    const nextCodeError = validateCode(code);
    setLocalErrors((current) => ({ ...current, code: nextCodeError }));
    setFormError(undefined);

    if (nextCodeError) {
      return;
    }

    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });

    if (error) {
      setFormError(getErrorMessage(error, 'That verification code did not work. Please try again.'));
      return;
    }

    if (signIn.status === 'complete') {
      await handleFinalize();
      return;
    }

    setFormError('We still could not confirm your device. Please request a new code and try again.');
  };

  const handleReset = async () => {
    await signIn.reset();
    setCode('');
    setPassword('');
    setLocalErrors({});
    setFormError(undefined);
  };

  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthScaffold
        title="Check your inbox"
        subtitle="Enter the 6-digit code we sent to confirm this device and keep your account secure."
        footer={
          <View className="mt-5 gap-3">
            <Pressable
              className={`auth-secondary-button ${isSubmitting ? 'opacity-60' : ''}`}
              disabled={isSubmitting}
              onPress={() => {
                setFormError(undefined);
                void signIn.mfa.sendEmailCode();
              }}
            >
              <Text className="auth-secondary-button-text">Send a new code</Text>
            </Pressable>
            <Pressable
              className="items-center py-1"
              disabled={isSubmitting}
              onPress={() => {
                void handleReset();
              }}
            >
              <Text className="text-sm font-sans-semibold text-muted-foreground">Start over</Text>
            </Pressable>
          </View>
        }
      >
        <View className="auth-form">
          <AuthField
            label="Verification code"
            value={code}
            error={codeError}
            keyboardType="number-pad"
            placeholder="Enter the 6-digit code"
            textContentType="oneTimeCode"
            autoCapitalize="none"
            onChangeText={(value) => {
              setCode(value);
              clearFieldError('code');
            }}
          />

          {globalError ? <Text className="auth-error">{globalError}</Text> : null}

          <Pressable
            className={`auth-button ${isSubmitting ? 'auth-button-disabled' : ''}`}
            disabled={isSubmitting}
            onPress={() => {
              void handleVerify();
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#081126" />
            ) : (
              <Text className="auth-button-text">Verify and continue</Text>
            )}
          </Pressable>
        </View>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to stay on top of your subscriptions, renewals, and billing moments."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">New to Recurly?</Text>
          <Link href={AUTH_ROUTES.signUp} asChild>
            <Text className="auth-link">Create an account</Text>
          </Link>
        </View>
      }
    >
      <View className="auth-form">
        <AuthField
          label="Email"
          value={emailAddress}
          error={identifierError}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Enter your email"
          textContentType="emailAddress"
          onChangeText={(value) => {
            setEmailAddress(value);
            clearFieldError('emailAddress');
          }}
        />

        <AuthField
          label="Password"
          value={password}
          error={passwordError}
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Enter your password"
          secureTextEntry
          textContentType="password"
          onChangeText={(value) => {
            setPassword(value);
            clearFieldError('password');
          }}
        />

        {globalError ? <Text className="auth-error">{globalError}</Text> : null}

        <Pressable
          className={`auth-button ${isSubmitting ? 'auth-button-disabled' : ''}`}
          disabled={isSubmitting}
          onPress={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#081126" />
          ) : (
            <Text className="auth-button-text">Sign in</Text>
          )}
        </Pressable>
      </View>
    </AuthScaffold>
  );
};

export default SignIn;
