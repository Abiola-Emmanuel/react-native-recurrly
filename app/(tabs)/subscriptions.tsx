import SubscriptionCard from "@/components/SubscriptionCard";
import "@/global.css";
import { useSubscriptions } from "@/lib/subscriptions";
import { styled } from "nativewind";
import React, { useEffect, useState } from 'react';
import { FlatList, Keyboard, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView)

const Subscriptions = () => {
  const [query, setQuery] = useState('')
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const insets = useSafeAreaInsets()
  const { subscriptions } = useSubscriptions()

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height)
    })

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredSubscriptions = !normalizedQuery
    ? subscriptions
    : subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.category,
        subscription.plan,
        subscription.billing,
        subscription.status,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    )

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id))
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={{
          paddingBottom: keyboardHeight + insets.bottom + 120,
        }}
        scrollIndicatorInsets={{
          bottom: keyboardHeight + insets.bottom,
        }}
        ListHeaderComponent={
          <View className="mb-6 gap-4">
            <View>
              <Text className="text-3xl font-sans-bold text-primary">Subscriptions</Text>
              <Text className="mt-2 text-base font-sans-medium text-muted-foreground">
                Search your recurring payments and open a card to see more details.
              </Text>
            </View>

            <View className="subscriptions-search-wrap">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search subscriptions"
                placeholderTextColor="rgba(0, 0, 0, 0.45)"
                className="subscriptions-search-input"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <Text className="text-sm font-sans-semibold text-muted-foreground">
              {filteredSubscriptions.length} subscription{filteredSubscriptions.length === 1 ? '' : 's'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="subscriptions-empty">
            <Text className="text-lg font-sans-bold text-primary">No subscriptions found</Text>
            <Text className="mt-2 text-center text-sm font-sans-medium text-muted-foreground">
              Try a different name, plan, or category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

export default Subscriptions
