import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";

const GroupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;
  const { currentUser, userProfile } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);

  // Handle trip completion parameters
  useEffect(() => {
    const handleTripCompletion = async () => {
      if (route.params?.tripCompleted) {
        const { tripSuccess, tripPoints } = route.params;
        console.log("Trip completed params received:", {
          tripSuccess,
          tripPoints,
          groupId,
        });

        if (tripSuccess) {
          // Directly call updateGroupProgress (no setTimeout)
          await updateGroupProgress();
          Alert.alert(
            "Adventure Completed!",
            `You completed the adventure with ${tripPoints} points!`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Adventure Failed",
            `You only earned ${tripPoints} points, not enough to progress.`,
            [{ text: "OK" }]
          );
        }

        // Clear the params after handling them to prevent duplicate processing
        navigation.setParams({
          tripCompleted: undefined,
          tripSuccess: undefined,
          tripPoints: undefined,
        });
      }
    };

    handleTripCompletion();
  }, [route.params?.tripCompleted]);

  // Set up listener for group data
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "groups", groupId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const groupData = docSnapshot.data();
          console.log("Group data loaded:", groupData);
          setGroup(groupData);

          // Check if current user is a member
          const memberIds = groupData.members || [];
          setIsMember(memberIds.includes(currentUser.uid));

          // Fetch members' profiles
          fetchMembersProfiles(memberIds);
        } else {
          Alert.alert("Error", "Group not found");
          navigation.navigate("Home");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching group:", error);
        setLoading(false);
        Alert.alert("Error", "Failed to load group data");
        navigation.navigate("Home");
      }
    );

    return () => unsubscribe();
  }, [groupId, currentUser?.uid]);

  const fetchMembersProfiles = async (memberIds) => {
    if (!memberIds || memberIds.length === 0) return;

    try {
      console.log("Fetching member profiles for:", memberIds);

      const memberProfiles = await Promise.all(
        memberIds.map(async (userId) => {
          try {
            // Check if this user is the current user, use userProfile data directly
            if (userId === currentUser.uid && userProfile) {
              console.log("Current user profile:", userProfile);
              return {
                id: userId,
                name: userProfile.username,
                ...userProfile,
              };
            }

            // Fetch profile from Firestore
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data for", userId, ":", userData);

              // Try different properties to find a display name
              const displayName =
                userData.username || `User ${userId.slice(0, 5)}`;

              return {
                id: userId,
                name: displayName,
                ...userData,
              };
            }
            return { id: userId, name: `User ${userId.slice(0, 5)}` };
          } catch (error) {
            console.error("Error fetching user profile:", userId, error);
            return { id: userId, name: `User ${userId.slice(0, 5)}` };
          }
        })
      );

      console.log("Member profiles after fetch:", memberProfiles);
      setMembers(memberProfiles);
    } catch (error) {
      console.error("Error in fetchMembersProfiles:", error);
    }
  };

  const joinGroup = async () => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(currentUser.uid),
      });
      setIsMember(true);
      Alert.alert("Success", "You have joined the group!");
    } catch (error) {
      console.error("Error joining group:", error);
      Alert.alert("Error", "Failed to join group");
    }
  };

  const startAdventure = () => {
    navigation.navigate("TripPlanner", { groupId });
  };

  const updateGroupProgress = async () => {
    try {
      // Get the latest group data directly from Firestore
      const groupRef = doc(db, "groups", groupId);
      const groupSnapshot = await getDoc(groupRef);

      if (!groupSnapshot.exists()) {
        console.error("Group document does not exist");
        return;
      }

      const groupData = groupSnapshot.data();
      console.log("Current group data from Firestore:", groupData);

      // Get current progress with fallback to 0
      const currentProgress = groupData.progress || 0;
      console.log("Current progress:", currentProgress);

      // Only update if progress is less than 5
      if (currentProgress < 5) {
        const newProgress = currentProgress + 1;
        console.log("Setting new progress to:", newProgress);

        // Update Firestore
        await updateDoc(groupRef, {
          progress: newProgress,
        });

        console.log("Progress updated in Firestore successfully");

        // Update local state immediately to reflect change
        setGroup((prevGroup) => {
          console.log(
            "Updating local state from:",
            prevGroup?.progress,
            "to:",
            newProgress
          );
          return {
            ...(prevGroup || {}),
            progress: newProgress,
          };
        });
      } else {
        console.log("Max progress already reached");
      }
    } catch (error) {
      console.error("Error updating group progress:", error.message);
      Alert.alert(
        "Error",
        "Failed to update group progress. Please try again."
      );
    }
  };

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberName}>{item.name}</Text>
      {item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group?.name || "Group"}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressTracker}>
          {[...Array(5)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < (group?.progress || 0) && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {group?.progress || 0}/5 Adventures Completed
        </Text>
      </View>

      <View style={styles.membersContainer}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No members in this group</Text>
          }
        />
      </View>

      {!isMember ? (
        <TouchableOpacity style={styles.joinButton} onPress={joinGroup}>
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.adventureButton}
          onPress={startAdventure}
        >
          <Text style={styles.buttonText}>Start Adventure</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.backButtonText}>Back to Groups</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "ios" ? 0 : 0,
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
  },
  progressContainer: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  progressTracker: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginVertical: 10,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  progressDotCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  membersContainer: {
    margin: 20,
    flex: 1,
  },
  memberItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  memberEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  joinButton: {
    margin: 20,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  adventureButton: {
    margin: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  backButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default GroupScreen;
