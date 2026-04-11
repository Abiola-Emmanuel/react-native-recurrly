import type { Href } from 'expo-router';
import { Linking } from 'react-native';

export const AUTH_ROUTES = {
  home: '/' as Href,
  signIn: '/(auth)/sign-in' as Href,
  signUp: '/(auth)/sign-up' as Href,
  subscriptions: '/(tabs)/subscriptions' as Href,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInFormValues = {
  emailAddress: string;
  password: string;
};

export type SignUpFormValues = SignInFormValues & {
  confirmPassword: string;
  code: string;
};

export type AuthFieldErrors<FieldName extends string> = Partial<Record<FieldName, string>>;

type AuthRouter = {
  replace: (href: Href) => void;
};

type FinalizableAuthResource = {
  finalize: (params?: {
    navigate?: (params: {
      session: { currentTask?: unknown };
      decorateUrl: (url: string) => string;
    }) => void | Promise<unknown>;
  }) => Promise<{ error: unknown | null }>;
};

type ClerkFieldError = { message?: string } | null | undefined;

type ClerkHookErrors<FieldName extends string> =
  | {
      fields?: Partial<Record<FieldName, ClerkFieldError>>;
      global?: Array<{ message?: string }> | null;
    }
  | null
  | undefined;

export const getTrimmedEmail = (value: string) => value.trim().toLowerCase();

export const validateEmailAddress = (emailAddress: string) =>
  EMAIL_PATTERN.test(getTrimmedEmail(emailAddress));

export const validateSignInValues = (
  values: SignInFormValues,
): AuthFieldErrors<keyof SignInFormValues> => {
  const errors: AuthFieldErrors<keyof SignInFormValues> = {};

  if (!getTrimmedEmail(values.emailAddress)) {
    errors.emailAddress = 'Enter your email address.';
  } else if (!validateEmailAddress(values.emailAddress)) {
    errors.emailAddress = 'Enter a valid email address.';
  }

  if (!values.password.trim()) {
    errors.password = 'Enter your password.';
  }

  return errors;
};

export const validateSignUpValues = (
  values: Pick<SignUpFormValues, 'emailAddress' | 'password' | 'confirmPassword'>,
): AuthFieldErrors<'emailAddress' | 'password' | 'confirmPassword'> => {
  const errors: AuthFieldErrors<'emailAddress' | 'password' | 'confirmPassword'> = {
    ...validateSignInValues(values),
  };

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const validateCode = (code: string) => {
  if (!code.trim()) {
    return 'Enter the verification code.';
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return 'Enter the 6-digit code we sent.';
  }

  return undefined;
};

export const hasValidationErrors = <FieldName extends string>(
  errors: AuthFieldErrors<FieldName>,
) => Object.values(errors).some(Boolean);

export const getFieldError = <FieldName extends string>(
  localError: string | undefined,
  hookErrors: ClerkHookErrors<FieldName>,
  fieldName: FieldName,
) => localError ?? hookErrors?.fields?.[fieldName]?.message ?? undefined;

export const getGlobalHookError = <FieldName extends string>(
  hookErrors: ClerkHookErrors<FieldName>,
) => hookErrors?.global?.[0]?.message ?? undefined;

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const record = error as {
      message?: string;
      longMessage?: string;
      long_message?: string;
      errors?: Array<{ message?: string; longMessage?: string; long_message?: string }>;
    };

    if (record.longMessage) {
      return record.longMessage;
    }

    if (record.long_message) {
      return record.long_message;
    }

    if (record.message) {
      return record.message;
    }

    const nestedError = record.errors?.[0];
    if (nestedError?.longMessage) {
      return nestedError.longMessage;
    }

    if (nestedError?.long_message) {
      return nestedError.long_message;
    }

    if (nestedError?.message) {
      return nestedError.message;
    }
  }

  return fallback;
};

export const finalizeAuthSession = async (
  resource: FinalizableAuthResource,
  router: AuthRouter,
  fallbackRoute: Href = AUTH_ROUTES.home,
) =>
  resource.finalize({
    navigate: async ({ decorateUrl }) => {
      const destination = decorateUrl(fallbackRoute.toString());

      if (destination.startsWith('http')) {
        await Linking.openURL(destination);
        return;
      }

      router.replace(destination as Href);
    },
  });
