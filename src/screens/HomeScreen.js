import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const { userProfile, logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled in App.js via auth state listener
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Home</Text>
          {userProfile?.name && (
            <Text style={styles.subtitle}>{userProfile.name}</Text>
          )}
        </View>

        <View style={styles.card}>
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

        <View style={styles.content}>
          <Text style={styles.paragraph}>
            Thank you for completing the onboarding survey. Your experience is
            now personalized based on your preferences.
          </Text>

          <Text style={styles.paragraph}>
            This is a sample home screen. In a real application, this would
            display content relevant to the user.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#007bff",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
  },
  card: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    width: 100,
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  content: {
    margin: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: "#444",
  },
  logoutButton: {
    margin: 20,
    backgroundColor: "#f44336",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
