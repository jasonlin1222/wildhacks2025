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
  ImageBackground,
  Image,
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

// Import shared assets
const pixelSkyBackground = require("./pixel-sky.png");

// Import garden backgrounds with numbered keys for easier mapping
const gardenBackgrounds = {
  1: require("./gardenbackground/1.png"),
  2: require("./gardenbackground/2.png"),
  3: require("./gardenbackground/3.png"),
  4: require("./gardenbackground/4.png"),
  5: require("./gardenbackground/5.png"),
  6: require("./gardenbackground/6.png"),
};

// Import garden sprout GIFs for progress visualization
const gardenSprouts = {
  1: require("./gardensprout/1.gif"),
  2: require("./gardensprout/2.gif"),
  3: require("./gardensprout/3.gif"),
  4: require("./gardensprout/4.gif"),
  5: require("./gardensprout/5.gif"),
  6: require("./gardensprout/6.gif"),
};

// Import all plant GIFs
const plants = {
  // Mysterious/Intense plants
  blueRose: require("./plants/blue-rose.gif"),
  moonflower: require("./plants/moonflower.gif"),
  blackDahlia: require("./plants/black-dahlia.gif"),
  hellebore: require("./plants/hellebore.gif"),
  // Intellectual/Thoughtful plants
  bonsai: require("./plants/bonsai.gif"),
  orchid: require("./plants/orchid.gif"),
  bamboo: require("./plants/bamboo.gif"),
  japaneseMaple: require("./plants/japanese-maple.gif"),
  ginkgoTree: require("./plants/ginkgo-tree.gif"),
  // Nurturing/Caring plants
  aloeVera: require("./plants/aloe-vera.gif"),
  lavender: require("./plants/lavender.gif"),
  rosemary: require("./plants/rosemary.gif"),
  chamomile: require("./plants/chamomile.gif"),
  // Social/Expressive plants
  sunflower: require("./plants/sunflower.gif"),
  cherryBlossom: require("./plants/cherry-blossom.gif"),
  hibiscus: require("./plants/hibiscus.gif"),
  // Adventurous/Bold plants
  marigold: require("./plants/marigold.gif"),
  amaryllis: require("./plants/amaryllis.gif"),
  dandelion: require("./plants/dandelion.gif"),
  fireLily: require("./plants/fire-lily.gif"),
  // Artistic/Creative plants
  bleedingHeart: require("./plants/bleeding-heart.gif"),
  birdOfParadise: require("./plants/bird-of-paradise.gif"),
  wisteria: require("./plants/wisteria.gif"),
  poppy: require("./plants/poppy.gif"),
  // Default plant
  default: require("./plants/default-plant.gif"),
};

// Helper for rendering the wooden-bordered buttons
const WoodenButton = ({ onPress, style, disabled, children }) => (
  <View style={styles.buttonOuterContainer}>
    <View style={styles.buttonTopBorder} />
    <View style={styles.buttonContainer}>
      <View style={styles.buttonLeftBorder} />
      <TouchableOpacity
        style={[styles.navButton, style]}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
      <View style={styles.buttonRightBorder} />
    </View>
    <View style={styles.buttonBottomBorder} />
  </View>
);

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

        // Clear the params after handling them
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

          // If group doesn't have a background ID, assign one
          if (!groupData.backgroundId) {
            assignBackgroundToGroup(docSnapshot.id);
          }

          setGroup(groupData);
          setIsMember((groupData.members || []).includes(currentUser.uid));
          fetchMembersProfiles(groupData.members || []);
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
      const memberProfiles = await Promise.all(
        memberIds.map(async (userId) => {
          try {
            // Use current user profile data if available
            if (userId === currentUser.uid && userProfile) {
              return {
                id: userId,
                name: userProfile.username,
                ...userProfile,
              };
            }

            // Otherwise fetch from Firestore
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                name: userData.username || `User ${userId.slice(0, 5)}`,
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
      // Get latest group data from Firestore
      const groupRef = doc(db, "groups", groupId);
      const groupSnapshot = await getDoc(groupRef);

      if (!groupSnapshot.exists()) return;

      const groupData = groupSnapshot.data();
      const currentProgress = groupData.progress || 0;

      // Only update if progress is less than 5
      if (currentProgress < 5) {
        const newProgress = currentProgress + 1;

        // Update Firestore
        await updateDoc(groupRef, { progress: newProgress });

        // Update local state
        setGroup((prevGroup) => ({
          ...(prevGroup || {}),
          progress: newProgress,
        }));
      }
    } catch (error) {
      console.error("Error updating group progress:", error.message);
      Alert.alert(
        "Error",
        "Failed to update group progress. Please try again."
      );
    }
  };

  // Assign a background to a group
  const assignBackgroundToGroup = async (groupId) => {
    try {
      const randomBackgroundId = Math.floor(Math.random() * 6) + 1;
      await updateDoc(doc(db, "groups", groupId), {
        backgroundId: randomBackgroundId,
      });
    } catch (error) {
      console.error("Error assigning background:", error);
    }
  };

  // Get the background image for this group
  const getGroupBackground = () => {
    // Check for backgroundId (new format)
    if (group?.backgroundId && gardenBackgrounds[group.backgroundId]) {
      return gardenBackgrounds[group.backgroundId];
    }

    // Check for gardenBackground (old format)
    if (group?.gardenBackground) {
      const match = group.gardenBackground.match(/(\d+)\.png$/);
      if (match && match[1] && gardenBackgrounds[parseInt(match[1])]) {
        return gardenBackgrounds[parseInt(match[1])];
      }
    }

    return pixelSkyBackground; // Fallback
  };

  // Get the sprout image based on progress
  const getSproutImageForProgress = (progress) => {
    // Get background ID with fallback to 1
    let backgroundId = 1;

    if (group?.backgroundId) {
      backgroundId = group.backgroundId;
    } else if (group?.gardenBackground) {
      const match = group.gardenBackground.match(/(\d+)\.png$/);
      if (match && match[1]) {
        backgroundId = parseInt(match[1]);
      }
    }

    // Ensure valid range
    backgroundId = Math.min(Math.max(backgroundId, 1), 6);

    // Map progress to growth stage
    const stage = Math.min(Math.max(progress + 1, 1), 6);

    // At final stage, return tree matching background
    if (stage === 6) {
      return gardenSprouts[backgroundId];
    }

    // Otherwise return growth stage
    return gardenSprouts[stage];
  };

  const renderMemberItem = ({ item }) => {
    // Get plant image with fallback to default
    const plantImage =
      item.plantMatch && plants[item.plantMatch]
        ? plants[item.plantMatch]
        : plants.default;

    return (
      <View style={styles.memberBox}>
        <View style={styles.plantImageContainer}>
          <Image
            source={plantImage}
            style={styles.plantImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={pixelSkyBackground}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B87333" />
            <Text style={styles.loadingText}>Loading group data...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={getGroupBackground()}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{group?.name || "Group"}</Text>

        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>Progress</Text>

          <View style={styles.progressContainer}>
            {/* Tree growth visualization */}
            <View style={styles.treeFrameContainer}>
              <View style={styles.treeFrame}>
                <Image
                  source={getSproutImageForProgress(group?.progress || 0)}
                  style={styles.treeImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.gardenText}>Group Garden</Text>
            </View>

            {/* Dot progress tracker */}
            <View style={styles.progressTrackerContainer}>
              <Text style={styles.progressLabel}>Adventure Progress:</Text>
              <View style={styles.progressTracker}>
                {[...Array(5)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index < (group?.progress || 0) &&
                        styles.progressDotCompleted,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.progressText}>
                {group?.progress || 0}/5 Adventures Completed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.centeredSectionTitle}>Members ({members.length})</Text>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.memberRow}
            contentContainerStyle={styles.memberGrid}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members in this group</Text>
            }
          />
        </View>

        {!isMember ? (
          <WoodenButton onPress={joinGroup} style={styles.joinButton}>
            <Text style={styles.navButtonText}>Join Group</Text>
          </WoodenButton>
        ) : (
          <WoodenButton onPress={startAdventure} style={styles.adventureButton}>
            <Text style={styles.navButtonText}>Start Adventure</Text>
          </WoodenButton>
        )}

        <WoodenButton
          onPress={() => navigation.navigate("Home")}
          style={styles.backButton}
        >
          <Text style={styles.navButtonText}>Back to Groups</Text>
        </WoodenButton>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "monospace",
    color: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    fontFamily: "monospace",
    color: "#000",
    backgroundColor: "rgba(245, 222, 179, 0.9)",
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignSelf: "center",
    borderWidth: 3,
    borderColor: "#B87333",
  },
  questionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 4,
    borderColor: "#B87333",
    borderStyle: "solid",
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: "monospace",
    color: "#000",
    backgroundColor: "rgba(245, 222, 179, 0.9)", // Wheat color with opacity
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-start", // Default alignment
    borderWidth: 2,
    borderColor: "#B87333", // Bronze border to match other elements
  },
  centeredSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: "monospace",
    color: "#000",
    backgroundColor: "rgba(245, 222, 179, 0.9)",
    paddingVertical: 5, 
    paddingHorizontal: 10,
    alignSelf: "center", // Center in the screen
    borderWidth: 2,
    borderColor: "#B87333",
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  treeFrameContainer: {
    width: 140,
    alignItems: "center",
  },
  treeFrame: {
    width: 120,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    borderWidth: 4,
    borderColor: "#B87333",
    padding: 5,
    marginBottom: 5,
  },
  treeImage: {
    width: "100%",
    height: "100%",
  },
  gardenText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  progressTrackerContainer: {
    flex: 1,
    alignItems: "center",
    marginLeft: 15,
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
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#B87333",
  },
  progressDotCompleted: {
    backgroundColor: "#90EE90", // Light green
    borderColor: "#B87333",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
    fontFamily: "monospace",
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  // Button styles
  buttonOuterContainer: {
    width: "100%",
    marginBottom: 15,
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
  navButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5DEB3",
  },
  joinButton: {
    backgroundColor: "#87CEFA", // Light sky blue
  },
  adventureButton: {
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
  // Member list styles
  membersSection: {
    flex: 1,
    marginBottom: 20,
  },
  memberRow: {
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  memberGrid: {
    paddingVertical: 10,
  },
  memberBox: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#F5DEB3",
    borderWidth: 3,
    borderColor: "#B87333",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  plantImageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  plantImage: {
    width: "80%",
    height: "80%",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
    color: "#000",
    textAlign: "center",
    paddingTop: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#333",
    marginTop: 20,
    fontFamily: "monospace",
  },
});

export default GroupScreen;
