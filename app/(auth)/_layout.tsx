import FullScreenLoader from '@/components/FullScreenLoader';
import { AUTH_ROUTES } from '@/lib/auth';
import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from "expo-router";

export default function RootLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <FullScreenLoader label="Preparing your secure sign-in..." />;
  }

  if (isSignedIn) {
    return <Redirect href={AUTH_ROUTES.home} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
