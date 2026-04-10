import type { ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import { styled } from 'nativewind';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

interface AuthShellProps {
  title: string;
  subtitle: string;
  footerCopy: string;
  footerHref: Href;
  footerText: string;
  children: ReactNode;
}

const AuthShell = ({
  title,
  subtitle,
  footerCopy,
  footerHref,
  footerText,
  children,
}: AuthShellProps) => {
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>

                <View>
                  <Text className="auth-wordmark">Recurly</Text>
                  <Text className="auth-wordmark-sub">smart billing</Text>
                </View>
              </View>

              <Text className="auth-title">{title}</Text>
              <Text className="auth-subtitle">{subtitle}</Text>
            </View>

            <View className="auth-card">
              {children}

              <View className="auth-link-row">
                <Text className="auth-link-copy">{footerCopy}</Text>
                <Link href={footerHref}>
                  <Text className="auth-link">{footerText}</Text>
                </Link>
              </View>
            </View>

            <Text className="auth-footnote">Secure access to your billing workspace.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthShell;
