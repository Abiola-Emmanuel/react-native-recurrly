import FullScreenLoader from '@/components/FullScreenLoader'
import { AUTH_ROUTES } from '@/lib/auth'
import { useAuth } from '@clerk/expo'
import { Link, Redirect, useLocalSearchParams } from 'expo-router'
import { styled } from 'nativewind'
import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'

const SafeAreaView = styled(RNSafeAreaView)


const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <FullScreenLoader label="Opening subscription details..." />
  }

  if (!isSignedIn) {
    return <Redirect href={AUTH_ROUTES.signIn} />
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <View className="rounded-3xl border border-border bg-card p-5">
        <Text className="text-2xl font-sans-bold text-primary">Subscription details</Text>
        <Text className="mt-3 text-base font-sans-medium text-muted-foreground">
          You&apos;re viewing the secure details page for {id}.
        </Text>
        <Link href={AUTH_ROUTES.subscriptions} className="mt-6 text-base font-sans-bold text-accent">
          Back to subscriptions
        </Link>
      </View>
    </SafeAreaView>
  )
}

export default SubscriptionDetails
