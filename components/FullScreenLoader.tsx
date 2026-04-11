import { ActivityIndicator, Text, View } from 'react-native';

type FullScreenLoaderProps = {
  label?: string;
};

const FullScreenLoader = ({ label = 'Loading your workspace...' }: FullScreenLoaderProps) => {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <ActivityIndicator size="large" color="#ea7a53" />
      <Text className="mt-4 text-center font-sans-medium text-sm text-muted-foreground">
        {label}
      </Text>
    </View>
  );
};

export default FullScreenLoader;
