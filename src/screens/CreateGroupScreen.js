import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Import background
const pixelSkyBackground = require("./pixel-sky.png");

// Number of available garden backgrounds
const TOTAL_BACKGROUNDS = 6;

// Helper for rendering wooden-bordered containers (inputs and buttons)
const WoodenContainer = ({ children, style }) => (
  <View style={[styles.buttonOuterContainer, style]}>
    <View style={styles.buttonTopBorder} />
    <View style={styles.buttonContainer}>
      <View style={styles.buttonLeftBorder} />
      {children}
      <View style={styles.buttonRightBorder} />
    </View>
    <View style={styles.buttonBottomBorder} />
  </View>
);

const CreateGroupScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      setLoading(true);

      // Randomly select a garden background (1-6)
      const randomBackgroundId =
        Math.floor(Math.random() * TOTAL_BACKGROUNDS) + 1;

      // Create a new group document
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        members: [currentUser.uid],
        createdBy: currentUser.uid,
        createdAt: new Date(),
        progress: 0,
        backgroundId: randomBackgroundId,
      };

      const groupRef = await addDoc(collection(db, "groups"), groupData);

      setLoading(false);
      Alert.alert("Success", "Group created successfully!", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("GroupScreen", { groupId: groupRef.id }),
        },
      ]);
    } catch (error) {
      setLoading(false);
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group");
    }
  };

  return (
    <ImageBackground source={pixelSkyBackground} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Create New Group</Text>

            <View style={styles.questionContainer}>
              <Text style={styles.label}>Group Name*</Text>
              <WoodenContainer>
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Enter group name"
                  placeholderTextColor="#999"
                />
              </WoodenContainer>

              <Text style={styles.label}>Description</Text>
              <WoodenContainer>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter group description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </WoodenContainer>

              <WoodenContainer style={styles.buttonMargin}>
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={handleCreateGroup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.navButtonText}>Create Group</Text>
                  )}
                </TouchableOpacity>
              </WoodenContainer>

              <WoodenContainer>
                <TouchableOpacity
                  style={[styles.navButton, styles.backButton]}
                  onPress={() => navigation.goBack()}
                  disabled={loading}
                >
                  <Text style={styles.navButtonText}>Cancel</Text>
                </TouchableOpacity>
              </WoodenContainer>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "monospace",
    color: "#000",
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 4,
    borderColor: "#B87333",
    borderStyle: "solid",
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "monospace",
    color: "#333",
  },
  // Wooden border styles
  buttonOuterContainer: {
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  buttonTopBorder: {
    height: 5,
    backgroundColor: "#B87333",
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    overflow: "hidden",
  },
  buttonLeftBorder: {
    width: 5,
    backgroundColor: "#B87333",
  },
  buttonRightBorder: {
    width: 5,
    backgroundColor: "#B87333",
  },
  buttonBottomBorder: {
    height: 5,
    backgroundColor: "#B87333",
  },
  buttonMargin: {
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: "#F5DEB3",
    fontSize: 16,
    fontFamily: "monospace",
    color: "#000",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  navButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    backgroundColor: "#90EE90", // Light green
  },
  backButton: {
    backgroundColor: "#F5DEB3", // Wheat color
  },
  navButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});

export default CreateGroupScreen;
