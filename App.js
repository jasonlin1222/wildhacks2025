import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "react-native";
import { LogBox } from "react-native";

// Import screens
import SelectionScreen from "./src/screens/SelectionScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingSurveyScreen from "./src/screens/OnboardingSurveyScreen";
import CreateAccountScreen from "./src/screens/CreateAccountScreen";
import HomeScreen from "./src/screens/HomeScreen";

// Import auth context
import { AuthProvider, useAuth } from "./src/context/AuthContext";

// Firebase sets some timers for a long period, which will trigger some warnings
LogBox.ignoreLogs([`Setting a timer for a long period`]);

const Stack = createStackNavigator();

// Public stack navigator - visible to unauthenticated users
function PublicStack() {
  return (
    <Stack.Navigator
      initialRouteName="Selection"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Selection" component={SelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="OnboardingSurvey"
        component={OnboardingSurveyScreen}
      />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
    </Stack.Navigator>
  );
}

// Private stack navigator - visible only to authenticated users
function PrivateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// Root navigator that handles authentication state
function RootNavigator() {
  const { currentUser, loading } = useAuth();

  // Don't render anything while determining auth state
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {currentUser ? <PrivateStack /> : <PublicStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AuthProvider>
  );
}
