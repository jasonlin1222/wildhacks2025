import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from "react-native";

// Import the image directly
const pixelSkyBackground = require('./pixel-sky.png');

export default function SelectionScreen({ navigation }) {
  return (
    <ImageBackground 
      source={pixelSkyBackground} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Choose an option to continue</Text>

          <View style={styles.buttonOuterContainer}>
            <View style={styles.buttonTopBorder} />
            <View style={styles.buttonContainer}>
              <View style={styles.buttonLeftBorder} />
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <View style={styles.buttonRightBorder} />
            </View>
            <View style={styles.buttonBottomBorder} />
          </View>

          <View style={styles.buttonOuterContainer}>
            <View style={styles.buttonTopBorder} />
            <View style={styles.buttonContainer}>
              <View style={styles.buttonLeftBorder} />
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate("OnboardingSurvey")}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
              <View style={styles.buttonRightBorder} />
            </View>
            <View style={styles.buttonBottomBorder} />
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
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
    textAlign: "center",
    color: '#000',
    marginBottom: 40,
    fontFamily: 'monospace',
  },
  // Outer container for the whole button assembly
  buttonOuterContainer: {
    width: 280,
    marginBottom: 20,
    // Add shadow for 3D effect
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 0,
  },
  // Top wooden border (darker)
  buttonTopBorder: {
    height: 6,
    backgroundColor: '#8B4513', // Saddle brown (dark wood)
    marginHorizontal: 6,
  },
  // Container for the button and side borders
  buttonContainer: {
    flexDirection: 'row',
  },
  // Left wooden border (darker)
  buttonLeftBorder: {
    width: 6,
    backgroundColor: '#8B4513', // Saddle brown (dark wood)
  },
  // The actual button with the light wood color
  button: {
    flex: 1,
    height: 60,
    backgroundColor: '#DEB887', // Burlywood (light wood color)
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#5E3A1C', // Dark brown inner border
    borderStyle: 'solid',
  },
  // Right wooden border (darker)
  buttonRightBorder: {
    width: 6,
    backgroundColor: '#8B4513', // Saddle brown (dark wood)
  },
  // Bottom wooden border (darker)
  buttonBottomBorder: {
    height: 6,
    backgroundColor: '#8B4513', // Saddle brown (dark wood)
    marginHorizontal: 6,
  },
  // Button text
  buttonText: {
    color: '#000',
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: 'monospace',
    // Pixelated text style
    textAlign: 'center',
  },
});