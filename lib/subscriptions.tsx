import { HOME_SUBSCRIPTIONS } from '@/constants/data'
import React, { createContext, useContext, useMemo, useState } from 'react'

type SubscriptionsContextValue = {
  subscriptions: Subscription[]
  addSubscription: (subscription: Subscription) => void
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | undefined>(undefined)

export const SubscriptionsProvider = ({ children }: React.PropsWithChildren) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS)

  const value = useMemo<SubscriptionsContextValue>(() => ({
    subscriptions,
    addSubscription: (subscription) => {
      setSubscriptions((currentSubscriptions) => [subscription, ...currentSubscriptions])
    },
  }), [subscriptions])

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  )
}

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext)

  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionsProvider')
  }

  return context
}
