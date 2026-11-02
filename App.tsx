import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { VerifyScreen } from './src/screens/VerifyScreen';
import { SettingsProvider } from './src/settings';
import { colors } from './src/theme';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, text: colors.ink, border: colors.line, primary: colors.ink },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerShadowVisible: false,
              headerTitle: '',
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.ink,
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Verify" component={VerifyScreen} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ headerBackVisible: false, gestureEnabled: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
