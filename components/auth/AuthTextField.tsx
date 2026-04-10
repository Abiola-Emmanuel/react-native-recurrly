import { colors } from '@/constants/theme';
import cx from 'clsx';
import type { ComponentProps } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type NativeTextInputProps = ComponentProps<typeof TextInput>;

interface AuthTextFieldProps extends NativeTextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onPasswordToggle?: () => void;
}

const AuthTextField = ({
  label,
  error,
  helperText,
  showPasswordToggle = false,
  passwordVisible = false,
  onPasswordToggle,
  ...inputProps
}: AuthTextFieldProps) => {
  const usesShell = showPasswordToggle;

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>

      {usesShell ? (
        <View className={cx('auth-input-shell', error && 'auth-input-shell-error')}>
          <TextInput
            {...inputProps}
            className="auth-input-control"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!passwordVisible}
            selectionColor={colors.accent}
          />

          <Pressable className="auth-input-toggle" onPress={onPasswordToggle}>
            <Text className="auth-input-toggle-text">{passwordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
      ) : (
        <TextInput
          {...inputProps}
          className={cx('auth-input', error && 'auth-input-error')}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.accent}
        />
      )}

      {error ? <Text className="auth-error">{error}</Text> : null}
      {!error && helperText ? <Text className="auth-helper">{helperText}</Text> : null}
    </View>
  );
};

export default AuthTextField;
