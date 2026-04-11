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
  validateSignUpValues,
} from '@/lib/auth';
import { useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const SignUp = () => {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | undefined>();
  const [formSuccess, setFormSuccess] = useState<string | undefined>();
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'emailAddress' | 'password' | 'confirmPassword' | 'code', string>>
  >({});

  if (!signUp) {
    return <FullScreenLoader label="Preparing account creation..." />;
  }

  const isSubmitting = fetchStatus === 'fetching';
  const emailError = getFieldError(localErrors.emailAddress, errors, 'emailAddress');
  const passwordError = getFieldError(localErrors.password, errors, 'password');
  const codeError = getFieldError(localErrors.code, errors, 'code');
  const confirmPasswordError = localErrors.confirmPassword;
  const globalError = formError ?? getGlobalHookError(errors) ?? undefined;

  const isVerifyingEmail =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const clearFieldError = (
    field: 'emailAddress' | 'password' | 'confirmPassword' | 'code',
  ) => {
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
    setFormSuccess(undefined);
  };

  const handleFinalize = async () => {
    const { error } = await finalizeAuthSession(signUp, router);

    if (error) {
      setFormError(
        getErrorMessage(error, 'Your account is ready, but we could not finish navigation. Please try again.'),
      );
    }
  };

  const handleSubmit = async () => {
    const nextLocalErrors = validateSignUpValues({
      emailAddress,
      password,
      confirmPassword,
    });

    setLocalErrors(nextLocalErrors);
    setFormError(undefined);
    setFormSuccess(undefined);

    if (hasValidationErrors(nextLocalErrors)) {
      return;
    }

    const { error } = await signUp.password({
      emailAddress: getTrimmedEmail(emailAddress),
      password,
    });

    if (error) {
      setFormError(getErrorMessage(error, 'We could not create your account right now. Please try again.'));
      return;
    }

    const { error: verificationError } = await signUp.verifications.sendEmailCode();

    if (verificationError) {
      setFormError(
        getErrorMessage(
          verificationError,
          'We created your account, but could not send the verification code.',
        ),
      );
      return;
    }

    setFormSuccess(`We sent a 6-digit code to ${getTrimmedEmail(emailAddress)}.`);
  };

  const handleVerify = async () => {
    const nextCodeError = validateCode(code);
    setLocalErrors((current) => ({ ...current, code: nextCodeError }));
    setFormError(undefined);

    if (nextCodeError) {
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });

    if (error) {
      setFormError(getErrorMessage(error, 'That code did not match. Please try again.'));
      return;
    }

    if (signUp.status === 'complete') {
      await handleFinalize();
      return;
    }

    setFormError('We still need to verify your email before your account can continue.');
  };

  const handleResendCode = async () => {
    setFormError(undefined);
    setFormSuccess(undefined);

    const { error } = await signUp.verifications.sendEmailCode();

    if (error) {
      setFormError(getErrorMessage(error, 'We could not send a new code right now.'));
      return;
    }

    setFormSuccess(`A new verification code is on its way to ${getTrimmedEmail(emailAddress)}.`);
  };

  if (isVerifyingEmail) {
    return (
      <AuthScaffold
        title="Verify your email"
        subtitle="Confirm your email to unlock your billing dashboard and keep your account protected."
        footer={
          <View className="mt-5 gap-3">
            <Pressable
              className={`auth-secondary-button ${isSubmitting ? 'opacity-60' : ''}`}
              disabled={isSubmitting}
              onPress={() => {
                void handleResendCode();
              }}
            >
              <Text className="auth-secondary-button-text">Send a new code</Text>
            </Pressable>
          </View>
        }
      >
        <View className="auth-form">
          <AuthField
            label="Verification code"
            value={code}
            error={codeError}
            autoCapitalize="none"
            keyboardType="number-pad"
            placeholder="Enter the 6-digit code"
            textContentType="oneTimeCode"
            onChangeText={(value) => {
              setCode(value);
              clearFieldError('code');
            }}
          />

          {formSuccess ? <Text className="text-sm font-sans-medium text-success">{formSuccess}</Text> : null}
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
      title="Create your account"
      subtitle="Set up your Recurly account to track every subscription with clarity, confidence, and control."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">Already have an account?</Text>
          <Link href={AUTH_ROUTES.signIn} asChild>
            <Text className="auth-link">Sign in</Text>
          </Link>
        </View>
      }
    >
      <View className="auth-form">
        <AuthField
          label="Email"
          value={emailAddress}
          error={emailError}
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
          autoComplete="new-password"
          placeholder="Create a password"
          secureTextEntry
          textContentType="newPassword"
          onChangeText={(value) => {
            setPassword(value);
            clearFieldError('password');
          }}
        />

        <AuthField
          label="Confirm password"
          value={confirmPassword}
          error={confirmPasswordError}
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          secureTextEntry
          textContentType="password"
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearFieldError('confirmPassword');
          }}
        />

        {formSuccess ? <Text className="text-sm font-sans-medium text-success">{formSuccess}</Text> : null}
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
            <Text className="auth-button-text">Create account</Text>
          )}
        </Pressable>

        <Text className="auth-helper">
          Your subscription data stays private and secure across every session.
        </Text>
      </View>

      <View nativeID="clerk-captcha" />
    </AuthScaffold>
  );
};

export default SignUp;
