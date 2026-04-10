export type AuthField = 'email' | 'password' | 'confirmPassword' | 'code';

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClerkErrorItem = {
  message?: string;
  longMessage?: string;
  code?: string;
  meta?: {
    paramName?: string;
    param_name?: string;
    name?: string;
  };
};

const AUTH_FALLBACK_ERROR = 'Something went wrong. Please try again.';

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const sanitizeVerificationCode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export const hasAuthErrors = (errors: AuthFieldErrors) =>
  Object.values(errors).some((value) => Boolean(value));

export const validateSignInValues = (values: {
  emailAddress: string;
  password: string;
}): AuthFieldErrors => {
  const errors: AuthFieldErrors = {};
  const emailAddress = normalizeEmail(values.emailAddress);

  if (!emailAddress) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(emailAddress)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password.trim()) {
    errors.password = 'Enter your password.';
  }

  return errors;
};

export const validateSignUpValues = (values: {
  emailAddress: string;
  password: string;
  confirmPassword: string;
}): AuthFieldErrors => {
  const errors = validateSignInValues(values);

  if (!values.password) {
    errors.password = 'Create a password.';
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const validateVerificationCode = (value: string): AuthFieldErrors => {
  const sanitizedCode = sanitizeVerificationCode(value);

  if (!sanitizedCode) {
    return { code: 'Enter the 6-digit code sent to your email.' };
  }

  if (sanitizedCode.length !== 6) {
    return { code: 'Enter the complete 6-digit code.' };
  }

  return {};
};

const getClerkErrorItems = (error: unknown): ClerkErrorItem[] => {
  if (Array.isArray(error)) {
    return error as ClerkErrorItem[];
  }

  if (error && typeof error === 'object' && 'errors' in error) {
    const nestedErrors = (error as { errors?: unknown }).errors;
    if (Array.isArray(nestedErrors)) {
      return nestedErrors as ClerkErrorItem[];
    }
  }

  return [];
};

const getFieldFromParam = (paramName: string | undefined): AuthField | null => {
  const normalizedParam = (paramName ?? '').toLowerCase();

  if (!normalizedParam) {
    return null;
  }

  if (normalizedParam.includes('identifier') || normalizedParam.includes('email')) {
    return 'email';
  }

  if (normalizedParam.includes('confirm')) {
    return 'confirmPassword';
  }

  if (normalizedParam.includes('password')) {
    return 'password';
  }

  if (normalizedParam.includes('code')) {
    return 'code';
  }

  return null;
};

export const mapClerkError = (error: unknown): {
  fieldErrors: AuthFieldErrors;
  formError: string | null;
} => {
  const fieldErrors: AuthFieldErrors = {};
  let formError: string | null = null;
  const errorItems = getClerkErrorItems(error);

  if (!errorItems.length) {
    return {
      fieldErrors,
      formError:
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message ?? AUTH_FALLBACK_ERROR)
          : AUTH_FALLBACK_ERROR,
    };
  }

  for (const item of errorItems) {
    const message = item.longMessage ?? item.message ?? AUTH_FALLBACK_ERROR;
    const paramName = item.meta?.paramName ?? item.meta?.param_name ?? item.meta?.name;
    const field = getFieldFromParam(paramName);

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = message;
      continue;
    }

    if (!formError) {
      formError = message;
    }
  }

  return {
    fieldErrors,
    formError,
  };
};
