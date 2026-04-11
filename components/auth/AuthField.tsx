import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Text, TextInput, View } from 'react-native';

type AuthFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

const AuthField = ({ label, error, className, ...props }: AuthFieldProps) => {
  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <TextInput
        className={clsx('auth-input', error && 'auth-input-error', className)}
        placeholderTextColor="rgba(0, 0, 0, 0.45)"
        {...props}
      />
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
};

export default AuthField;
