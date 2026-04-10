import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView)

const Settings = () => {
  const { signOut } = useClerk();
  const { isLoaded, user } = useUser();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Recurly member';

  const emailAddress =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? 'Signed in';

  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'R';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="self-start rounded-full border border-accent/20 bg-accent/10 px-4 py-2">
            <Text className="text-xs font-sans-bold uppercase tracking-[1px] text-accent">
              Account and security
            </Text>
          </View>

          <Text className="mt-4 text-4xl font-sans-extrabold text-primary">Settings</Text>
          <Text className="mt-3 max-w-[320px] text-base font-sans-medium leading-6 text-muted-foreground">
            Keep your billing workspace personal, secure, and easy to access across devices.
          </Text>
        </View>

        <View className="overflow-hidden rounded-[32px] border border-border bg-card">
          <View className="bg-accent px-5 pb-8 pt-6">
            <View className="flex-row items-start justify-between">
              <View className="max-w-[220px]">
                <Text className="text-sm font-sans-semibold uppercase tracking-[1px] text-primary/70">
                  Profile
                </Text>
                <Text className="mt-2 text-3xl font-sans-extrabold text-primary">{fullName}</Text>
                <Text className="mt-2 text-sm font-sans-medium leading-5 text-primary/75">
                  Your Recurly account is active and ready to manage renewals with confidence.
                </Text>
              </View>

              <View className="size-20 items-center justify-center overflow-hidden rounded-[28px] border border-white/30 bg-background/80">
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} className="size-full" />
                ) : (
                  <Text className="text-2xl font-sans-extrabold text-primary">{initials}</Text>
                )}
              </View>
            </View>
          </View>

          <View className="gap-4 px-5 py-5">
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-border bg-background px-4 py-4">
                <Text className="text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">
                  Session
                </Text>
                <Text className="mt-2 text-lg font-sans-bold text-primary">Active</Text>
              </View>

              <View className="flex-1 rounded-2xl border border-border bg-background px-4 py-4">
                <Text className="text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">
                  Protection
                </Text>
                <Text className="mt-2 text-lg font-sans-bold text-primary">Secured</Text>
              </View>
            </View>

            {isLoaded ? (
              <>
                <View className="rounded-3xl border border-border bg-background px-4 py-4">
                  <Text className="text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">
                    Email
                  </Text>
                  <Text className="mt-2 text-base font-sans-semibold text-primary">
                    {emailAddress}
                  </Text>
                </View>

                <View className="rounded-3xl border border-border bg-background px-4 py-4">
                  <Text className="text-xs font-sans-bold uppercase tracking-[1px] text-muted-foreground">
                    Member ID
                  </Text>
                  <Text className="mt-2 text-sm font-sans-semibold text-primary">{user?.id}</Text>
                </View>
              </>
            ) : (
              <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-background px-4 py-4">
                <ActivityIndicator color="#081126" />
                <Text className="text-sm font-sans-medium text-muted-foreground">
                  Loading your account details...
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-6 rounded-[28px] border border-border bg-primary px-5 py-5">
          <Text className="text-xl font-sans-bold text-background">Session control</Text>
          <Text className="mt-2 max-w-[300px] text-sm font-sans-medium leading-6 text-background/70">
            Signing out removes this active session from the device and sends you back to the secure entry flow.
          </Text>

          <Pressable
            className={[
              'mt-5 items-center rounded-2xl bg-background py-4',
              isSigningOut ? 'opacity-55' : '',
            ].join(' ')}
            disabled={isSigningOut}
            onPress={handleSignOut}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#081126" />
            ) : (
              <Text className="font-sans-bold text-primary">Sign out</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Settings
