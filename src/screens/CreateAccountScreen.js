import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useAuth } from "../context/AuthContext";

// Import the background image
const pixelSkyBackground = require('./pixel-sky.png');

export default function CreateAccountScreen({ route, navigation }) {
  const { plantMatch } = route.params || {};

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup, updateUserProfile } = useAuth();

  const validateInputs = () => {
    if (!username) {
      Alert.alert("Error", "Please enter a username");
      return false;
    }

    if (!email) {
      Alert.alert("Error", "Please enter an email address");
      return false;
    }

    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    // Password validation (at least 6 characters)
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateInputs()) return;
  
    setLoading(true);
    try {
      // Create Firebase account with the plantMatch included directly
      const user = await signup(email, password, {
        username,
        plantMatch,
        surveyCompleted: true,
      });
  
      // Navigation to home is handled by AppNavigator in App.js
      console.log("Account created with plant match:", plantMatch);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render a wooden button
  const renderWoodenButton = (text, onPress, isDisabled = false, isLoading = false) => (
    <View style={styles.buttonOuterContainer}>
      <View style={styles.buttonTopBorder} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonLeftBorder} />
        <TouchableOpacity
          style={[
            styles.button, 
            isDisabled && styles.disabledButton
          ]}
          onPress={onPress}
          disabled={isDisabled || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.buttonText}>{text}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.buttonRightBorder} />
      </View>
      <View style={styles.buttonBottomBorder} />
    </View>
  );

  return (
    <ImageBackground 
      source={pixelSkyBackground} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            One last step before meeting your plant companion!
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            {renderWoodenButton(
              "Create Account", 
              handleCreateAccount, 
              false, 
              loading
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  backButtonContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#4a2511', // Dark brown
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'monospace',
    color: '#000',
    // Pixelated text effect
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
    fontFamily: 'monospace',
    color: '#4a2511', // Dark brown
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 0,
    textShadowColor: 'rgba(255,255,255,0.7)',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 4,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
    fontFamily: 'monospace',
    color: '#4a2511', // Dark brown
  },
  input: {
    borderWidth: 3,
    borderColor: '#B87333', // Copper/lighter brown
    backgroundColor: '#F5DEB3', // Wheat (lighter wood color)
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#000',
  },
  // Outer container for the whole button assembly
  buttonOuterContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 15,
    // Add shadow for 3D effect
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  // Top wooden border
  buttonTopBorder: {
    height: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
    width: '100%', // Make sure it spans full width
  },
  // Container for the button and side borders
  buttonContainer: {
    flexDirection: 'row',
    width: '100%', // Make sure it takes full width of parent
    overflow: 'hidden', // Hide any overflowing elements
  },
  // Left wooden border
  buttonLeftBorder: {
    width: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
  },
  // The actual button with the light wood color
  button: {
    flex: 1,
    padding: 15,
    backgroundColor: '#90EE90', // Light green
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E8B57', // Sea green border
    borderStyle: 'solid',
  },
  disabledButton: {
    backgroundColor: '#D3D3D3', // Light gray
    opacity: 0.7,
  },
  // Right wooden border
  buttonRightBorder: {
    width: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
  },
  // Bottom wooden border
  buttonBottomBorder: {
    height: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});