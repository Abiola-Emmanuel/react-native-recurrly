import { tabs } from "@/constants/data";
import { colors, components } from "@/constants/theme";
import FullScreenLoader from "@/components/FullScreenLoader";
import { SubscriptionsProvider } from "@/lib/subscriptions";
import { AUTH_ROUTES } from "@/lib/auth";
import { useAuth } from "@clerk/expo";
import { clsx } from "clsx";
import { Redirect, Tabs } from "expo-router";
import { Image, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabBar = components.tabBar

const TabLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  if (!isLoaded) {
    return <FullScreenLoader label="Loading your subscriptions..." />;
  }

  if (!isSignedIn) {
    return <Redirect href={AUTH_ROUTES.signIn} />;
  }

  const TabIcon = ({ focused, icon }: TabIconProps) => {
    return (
      <View className="tabs-icon">
        <View className={clsx('tabs-pill', focused && 'tabs-active')}>
          <Image
            source={icon}
            className="tabs-glyph"
          />
        </View>
      </View>
    )
  }

  return (
    <SubscriptionsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            'position': 'absolute',
            bottom: Math.max(insets.bottom, tabBar.horizontalInset),
            height: tabBar.height,
            marginHorizontal: tabBar.horizontalInset,
            borderRadius: tabBar.radius,
            backgroundColor: colors.primary,
            borderTopWidth: 0,
            elevation: 0
          },
          tabBarItemStyle: {
            paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
          },
          tabBarIconStyle: {
            width: tabBar.iconFrame,
            height: tabBar.iconFrame,
            alignItems: 'center'
          }
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title, tabBarIcon: ({ focused }) => (
                <TabIcon
                  focused={focused}
                  icon={tab.icon}
                />
              )
            }} />
        ))}
      </Tabs>
    </SubscriptionsProvider>
  )

}


export default TabLayout;
