import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Import the background image
const pixelSkyBackground = require("./pixel-sky.png");

export default function HomeScreen() {
  const { userProfile, logout, currentUser } = useAuth();
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const groupsCollection = collection(db, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
      const groupsList = groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupsList);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled in App.js via auth state listener
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate("CreateGroup");
  };

  const handleJoinGroup = (groupId) => {
    navigation.navigate("GroupScreen", { groupId });
  };

  const renderGroupItem = ({ item }) => (
    <View style={styles.buttonOuterContainer}>
      <View style={styles.buttonTopBorder} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonLeftBorder} />
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => handleJoinGroup(item.id)}
        >
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.members ? item.members.length : 0} members
          </Text>
        </TouchableOpacity>
        <View style={styles.buttonRightBorder} />
      </View>
      <View style={styles.buttonBottomBorder} />
    </View>
  );

  return (
    <ImageBackground source={pixelSkyBackground} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Groups</Text>
            <View style={styles.navButtonOuterContainer}>
              <View style={styles.buttonTopBorder} />
              <View style={styles.buttonContainer}>
                <View style={styles.buttonLeftBorder} />
                <TouchableOpacity onPress={handleLogout}>
                  <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
                <View style={styles.buttonRightBorder} />
              </View>
              <View style={styles.buttonBottomBorder} />
            </View>
          </View>

          {userProfile?.name && (
            <Text style={styles.subtitle}>Welcome, {userProfile.name}</Text>
          )}

          <View style={styles.contentContainer}>
            <View style={styles.questionContainer}>
              <Text style={styles.cardTitle}>Your Profile</Text>

              <View style={styles.profileItem}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>
                  {currentUser?.email || "Not provided"}
                </Text>
              </View>

              {userProfile?.age && (
                <View style={styles.profileItem}>
                  <Text style={styles.label}>Age:</Text>
                  <Text style={styles.value}>{userProfile.age}</Text>
                </View>
              )}

              {userProfile?.interests && (
                <View style={styles.profileItem}>
                  <Text style={styles.label}>Interests:</Text>
                  <Text style={styles.value}>{userProfile.interests}</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Available Groups</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#B87333" />
            ) : (
              <FlatList
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No groups available</Text>
                }
                scrollEnabled={false}
              />
            )}

            <View style={styles.navButtonOuterContainer}>
              <View style={styles.buttonTopBorder} />
              <View style={styles.buttonContainer}>
                <View style={styles.buttonLeftBorder} />
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.navButtonText}>Create New Group</Text>
                </TouchableOpacity>
                <View style={styles.buttonRightBorder} />
              </View>
              <View style={styles.buttonBottomBorder} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "monospace",
    // Pixelated text effe
  },
  subtitle: {
    fontSize: 20,
    color: "#000",
    opacity: 0.9,
    paddingHorizontal: 20,
    marginTop: 5,
    fontFamily: "monospace",
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 4,
    borderColor: "#B87333", // Copper/lighter brown
    borderStyle: "solid",
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: "monospace",
  },
  profileItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    width: 100,
    fontFamily: "monospace",
  },
  value: {
    fontSize: 16,
    flex: 1,
    fontFamily: "monospace",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: "monospace",
    color: "#000",
  },
  // Outer container for the whole button assembly
  buttonOuterContainer: {
    width: "100%",
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
    backgroundColor: "#B87333", // Copper/lighter brown
    width: "100%", // Make sure it spans full width
  },
  // Container for the button and side borders
  buttonContainer: {
    flexDirection: "row",
    width: "100%", // Make sure it takes full width of parent
    overflow: "hidden", // Hide any overflowing elements
  },
  // Left wooden border
  buttonLeftBorder: {
    width: 5,
    backgroundColor: "#B87333", // Copper/lighter brown
  },
  // Right wooden border
  buttonRightBorder: {
    width: 5,
    backgroundColor: "#B87333", // Copper/lighter brown
  },
  // Bottom wooden border
  buttonBottomBorder: {
    height: 5,
    backgroundColor: "#B87333", // Copper/lighter brown
  },
  groupButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#F5DEB3", // Wheat (lighter wood color)
  },
  groupName: {
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "monospace",
    color: "#000",
  },
  memberCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontFamily: "monospace",
  },
  emptyText: {
    textAlign: "center",
    color: "#333",
    marginTop: 20,
    fontFamily: "monospace",
  },
  // Navigation button containers
  navButtonOuterContainer: {
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  // Navigation buttons
  navButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#90EE90", // Light green
  },
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
    backgroundColor: "#F5DEB3",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});
