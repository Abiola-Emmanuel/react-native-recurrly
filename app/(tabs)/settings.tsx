import FullScreenLoader from "@/components/FullScreenLoader";
import { AUTH_ROUTES } from "@/lib/auth";
import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView)

const Settings = () => {
  const router = useRouter()
  const { signOut } = useClerk()
  const { isLoaded, user } = useUser()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.replace(AUTH_ROUTES.signIn)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!isLoaded) {
    return <FullScreenLoader label="Loading your settings..." />
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-sans-bold text-primary">Settings</Text>

      <View className="mt-6 rounded-3xl border border-border bg-card p-5">
        <Text className="text-lg font-sans-semibold text-primary">Account</Text>
        <Text className="mt-4 text-base font-sans-bold text-primary">
          {user?.fullName?.trim() || user?.username || 'Recurly member'}
        </Text>
        <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress || 'No email available'}
        </Text>

        <Pressable
          className={`mt-6 items-center rounded-2xl bg-primary py-4 ${isSigningOut ? 'opacity-60' : ''}`}
          disabled={isSigningOut}
          onPress={handleSignOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#fff9e3" />
          ) : (
            <Text className="font-sans-bold text-background">Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

export default Settings
