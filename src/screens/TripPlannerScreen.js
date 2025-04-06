import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
  Alert,
  Platform,
  ImageBackground,
  SafeAreaView,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { GoogleGenerativeAI } from "@google/generative-ai";
import MapView, { Marker } from "react-native-maps";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Import the background image
const pixelSkyBackground = require("./pixel-sky.png");
// Import all possible backgrounds
const backgroundImages = [
  pixelSkyBackground, // Default/fallback (index 0)
  require("./gardenbackground/1.png"), // Background 1
  require("./gardenbackground/2.png"), // Background 2
  require("./gardenbackground/3.png"), // Background 3
  require("./gardenbackground/4.png"), // Background 4
  require("./gardenbackground/5.png"), // Background 5
  require("./gardenbackground/6.png"), // Background 6
];
// Number of available garden backgrounds (should match CreateGroupScreen)
const TOTAL_BACKGROUNDS = 6;
const grassGif = require("./Grass.gif");

const TripPlannerScreen = ({ navigation, route }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripPlan, setTripPlan] = useState(null);
  const [parsedTripPlan, setParsedTripPlan] = useState(null);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [mapLocations, setMapLocations] = useState([]);
  const [currentSideQuestIndex, setCurrentSideQuestIndex] = useState(0);
  const [sideQuestState, setSideQuestState] = useState("initial"); // 'initial', 'rolled', 'completed'
  const [currentSideQuest, setCurrentSideQuest] = useState(null);
  const [sideQuestPoints, setSideQuestPoints] = useState(0);
  const [allQuestsCompleted, setAllQuestsCompleted] = useState(false);
  const [personalityCategory, setPersonalityCategory] = useState(null);
  const [groupBackground, setGroupBackground] = useState(pixelSkyBackground);
  // Get the group ID from route params
  const groupId = route.params?.groupId;

  // Fetch user's personality category from Firebase
  useEffect(() => {
    const fetchUserPersonality = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
          const db = getFirestore();
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.personalityCategories) {
              // Find the true personality category
              const userPersonality = Object.keys(
                userData.personalityCategories
              ).find(
                (category) => userData.personalityCategories[category] === true
              );

              if (userPersonality) {
                setPersonalityCategory(userPersonality);
                console.log("User personality category:", userPersonality);
              } else {
                console.log("No active personality categories found");
              }
            } else {
              console.log("User has no personality categories set");
            }
          } else {
            console.log("User document does not exist");
          }
        } else {
          console.log("No user is logged in");
        }
      } catch (error) {
        console.error("Error fetching user personality:", error);
      }
    };

    fetchUserPersonality();
  }, []);

  useEffect(() => {
    const fetchGroupBackground = async () => {
      // Only proceed if we have a groupId
      if (groupId) {
        try {
          const db = getFirestore();
          const groupDocRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupDocRef);
  
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            if (groupData.backgroundId && groupData.backgroundId >= 1 && 
                groupData.backgroundId <= TOTAL_BACKGROUNDS) {
              // Use the backgroundId to get the correct background
              // The array is 0-indexed, but backgroundId starts at 1
              setGroupBackground(backgroundImages[groupData.backgroundId]);
            }
          } else {
            console.log("Group document does not exist");
          }
        } catch (error) {
          console.error("Error fetching group data:", error);
        }
      }
    };
  
    fetchGroupBackground();
  }, [groupId]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await fetchPOIs(location);
    })();
  }, []);

  useEffect(() => {
    if (tripPlan) {
      try {
        // Clean up the response string to make it valid JSON
        let cleanedResponse = tripPlan;

        // If response contains markdown code blocks, extract the JSON
        if (tripPlan.includes("```json")) {
          cleanedResponse = tripPlan.split("```json")[1].split("```")[0].trim();
        } else if (tripPlan.includes("```")) {
          cleanedResponse = tripPlan.split("```")[1].split("```")[0].trim();
        }

        const parsedData = JSON.parse(cleanedResponse);
        setParsedTripPlan(parsedData);

        // Extract locations for the map
        const locations = [];

        // Process morning locations
        if (parsedData.morning) {
          if (Array.isArray(parsedData.morning)) {
            parsedData.morning.forEach((loc) => {
              if (
                loc.locationCoordinates &&
                typeof loc.locationCoordinates === "object"
              ) {
                locations.push({
                  ...loc,
                  time: "Morning",
                  coordinate: {
                    latitude: loc.locationCoordinates.latitude,
                    longitude: loc.locationCoordinates.longitude,
                  },
                });
              }
            });
          } else if (
            parsedData.morning.locationCoordinates &&
            typeof parsedData.morning.locationCoordinates === "object"
          ) {
            locations.push({
              ...parsedData.morning,
              time: "Morning",
              coordinate: {
                latitude: parsedData.morning.locationCoordinates.latitude,
                longitude: parsedData.morning.locationCoordinates.longitude,
              },
            });
          }
        }

        // Process afternoon locations
        if (parsedData.afternoon) {
          if (Array.isArray(parsedData.afternoon)) {
            parsedData.afternoon.forEach((loc) => {
              if (
                loc.locationCoordinates &&
                typeof loc.locationCoordinates === "object"
              ) {
                locations.push({
                  ...loc,
                  time: "Afternoon",
                  coordinate: {
                    latitude: loc.locationCoordinates.latitude,
                    longitude: loc.locationCoordinates.longitude,
                  },
                });
              }
            });
          } else if (
            parsedData.afternoon.locationCoordinates &&
            typeof parsedData.afternoon.locationCoordinates === "object"
          ) {
            locations.push({
              ...parsedData.afternoon,
              time: "Afternoon",
              coordinate: {
                latitude: parsedData.afternoon.locationCoordinates.latitude,
                longitude: parsedData.afternoon.locationCoordinates.longitude,
              },
            });
          }
        }

        // Process evening locations
        if (parsedData.evening) {
          if (Array.isArray(parsedData.evening)) {
            parsedData.evening.forEach((loc) => {
              if (
                loc.locationCoordinates &&
                typeof loc.locationCoordinates === "object"
              ) {
                locations.push({
                  ...loc,
                  time: "Evening",
                  coordinate: {
                    latitude: loc.locationCoordinates.latitude,
                    longitude: loc.locationCoordinates.longitude,
                  },
                });
              }
            });
          } else if (
            parsedData.evening.locationCoordinates &&
            typeof parsedData.evening.locationCoordinates === "object"
          ) {
            locations.push({
              ...parsedData.evening,
              time: "Evening",
              coordinate: {
                latitude: parsedData.evening.locationCoordinates.latitude,
                longitude: parsedData.evening.locationCoordinates.longitude,
              },
            });
          }
        }

        setMapLocations(locations);

        // Set up initial side quest
        if (parsedData.sideQuests && parsedData.sideQuests.length > 0) {
          setCurrentSideQuest(parsedData.sideQuests[0]);
        }
      } catch (error) {
        console.error("Error parsing trip plan:", error);
        setErrorMsg("Failed to parse trip plan. The format may be incorrect.");
      }
    }
  }, [tripPlan]);

  const fetchPOIs = async (location) => {
    try {
      // Define categories for different types of places
      const categories = [
        "entertainment",
        "catering",
        "commercial",
        "leisure",
        "natural",
        "tourism",
        "sport",
      ];

      const categoriesString = categories.join(",");

      const pois = [];

      // Fetch POIs for each category
      const response = await fetch(
        `https://api.geoapify.com/v2/places?categories=${categoriesString}&filter=circle:${location.coords.longitude},${location.coords.latitude},5000&limit=100&apiKey=${GEOAPIFY_API_KEY}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Transform Geoapify format to a simpler format for Gemini
        const transformedPOIs = data.features.map((feature) => ({
          name: feature.properties.name || "Unnamed place",
          description: feature.properties.place_type || "",
          address: feature.properties.formatted || "",
          rating: feature.properties.rating || "No rating",
          coordinates: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
          },
        }));

        pois.push(...transformedPOIs);
      } else {
        console.warn(`No POIs found`);
      }

      if (pois.length === 0) {
        setErrorMsg(
          "No points of interest found in your area. Try a different location."
        );
        setLoading(false);
        return;
      }

      console.log(pois);

      // Generate trip plan using Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Create a one-day trip plan using these points of interest: ${JSON.stringify(
        pois
      )}. 
      Include a morning, afternoon, and evening schedule. For each location, include the name, category, and a brief description.
      Make sure to include a mix of activities and locations to ensure a balanced and enjoyable trip, and include 5 or less locations excluding lunch and dinner. 
      Prioritize tourist attractions and recreational activities, try to include less supermarket or stores such as home depot or other hardware stores unless there are no other options. 
      Prioritize local restaurants and cafes over fast food chains.
      Prioritize activities that are fun for a group of people, such as hiking, biking, or kayaking.
      Plan as throughly as possible and only include locations that are attrative or fun. 
      Randomly add suprises side quests to the trip that promotes social interaction between the participants in the group, or between participants and the locals.
      Return the trip plan in a json format with the following keys: morning, afternoon, evening, sideQuests.
      for moring, afternoon, and evening, include location name, location description, and location coordinates in a json format.
      for sideQuests, imagine that it is for D&D and provide two routes, with one option being a harder challenge while the other is a easier option. there will be one d20 check per quest to see if the user gets a hard or a easy one. 
      Include around 6 side quests. do not include dice value in description, only include it in the slot for dice value.
      for each pair of easy and hart quests, have a single value for dice value ranging from 1 to 20 depending on the difficulty. The more difficult it is, the lower the dice value should be.
      For these quests, the content should not depend on other events that happens in the trip, but rather a proactive action they can take at these locations. 
      these side quests should be also in json format with the follow keys: 
      sidequest description, sidequest d20 check value, sidequest attribute modifier picking from (Adventurous, Artistic, Intellectual, Mysterious, Nurturing, Social)
      
      for example: the format should be like this:

      {
        "morning": {
          "locationName": "Location Name",
          "locationDescription": "Location Description",
          "locationCoordinates": "Location Coordinates"
        },
        "afternoon": {
          {
            locationName: "Location Name",
            locationDescription: "Location Description",
            locationCoordinates: "Location Coordinates"
          },
          {
            locationName: "Location Name",
            locationDescription: "Location Description",
            locationCoordinates: "Location Coordinates"
          }
        },
        "evening": {
          "locationName": "Location Name",
          "locationDescription": "Location Description",
          "locationCoordinates": "Location Coordinates"
        }
      },

      {
        "sideQuests": [
          {
            "sideQuestDescriptionEasy": "Side Quest Description",
            "sideQuestDescriptionHard": "Side Quest Description",
            "sideQuestD20CheckValue": "Side Quest D20 Check Value",
            "sideQuestAttributeModifier": "Side Quest Attribute Modifier (pick from Adventurous, Artistic, Intellectual, Mysterious, Nurturing, Social)"
          },
          {
            "sideQuestDescriptionEasy": "Side Quest Description",
            "sideQuestDescriptionHard": "Side Quest Description",
            "sideQuestD20CheckValue": "Side Quest D20 Check Value",
            "sideQuestAttributeModifier": "Side Quest Attribute Modifier (pick from Adventurous, Artistic, Intellectual, Mysterious, Nurturing, Social)"
          }
        ]
      }
      `;

      const result = await model.generateContent(prompt);
      const geminiResponse = await result.response;
      setTripPlan(geminiResponse.text());
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg(
        "Failed to fetch POIs or generate trip plan: " + error.message
      );
      setLoading(false);
    }
  };

  const goToNextLocation = () => {
    if (currentLocationIndex < mapLocations.length - 1) {
      setCurrentLocationIndex(currentLocationIndex + 1);
    }
  };

  const goToPreviousLocation = () => {
    if (currentLocationIndex > 0) {
      setCurrentLocationIndex(currentLocationIndex - 1);
    }
  };

  const openMapsForDirections = () => {
    if (mapLocations[currentLocationIndex]?.coordinate) {
      const { latitude, longitude } =
        mapLocations[currentLocationIndex].coordinate;
      const label = mapLocations[currentLocationIndex].locationName;
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}(${label})`,
      });

      Linking.openURL(url);
    }
  };

  const rollDice = () => {
    if (!currentSideQuest) return;

    const roll = Math.floor(Math.random() * 20) + 1; // Roll a d20
    const checkValue = parseInt(currentSideQuest.sideQuestD20CheckValue);

    // Check if user's personality matches the side quest attribute
    const hasPersonalityBonus =
      personalityCategory &&
      currentSideQuest.sideQuestAttributeModifier.toLowerCase() ===
        personalityCategory.toLowerCase();

    console.log(
      personalityCategory,
      currentSideQuest.sideQuestAttributeModifier,
      hasPersonalityBonus
    );

    // Apply +2 bonus if personality matches
    const finalRoll = hasPersonalityBonus ? roll + 2 : roll;

    let selectedQuest;
    let pointValue;

    if (finalRoll >= checkValue) {
      selectedQuest = currentSideQuest.sideQuestDescriptionEasy;
      pointValue = 1;

      // Update alert message to include bonus information
      const bonusMessage = hasPersonalityBonus
        ? ` (+2 bonus for ${personalityCategory} trait)`
        : "";
      Alert.alert(
        "Dice Roll",
        `You rolled ${roll}${bonusMessage}! Taking the easy path.`
      );
    } else {
      selectedQuest = currentSideQuest.sideQuestDescriptionHard;
      pointValue = 2;

      // Update alert message to include bonus information
      const bonusMessage = hasPersonalityBonus
        ? ` (+2 bonus for ${personalityCategory} trait)`
        : "";
      Alert.alert(
        "Dice Roll",
        `You rolled ${roll}${bonusMessage}! Taking the hard path.`
      );
    }

    setSideQuestState("rolled");
    setCurrentSideQuest({
      ...currentSideQuest,
      selectedQuest,
      pointValue,
      roll: finalRoll,
      originalRoll: roll,
      hasPersonalityBonus,
    });
  };

  const completeQuest = () => {
    setSideQuestPoints(sideQuestPoints + currentSideQuest.pointValue);
    nextSideQuest();
  };

  const skipQuest = () => {
    nextSideQuest();
  };

  const nextSideQuest = () => {
    if (parsedTripPlan && parsedTripPlan.sideQuests) {
      if (currentSideQuestIndex < parsedTripPlan.sideQuests.length - 1) {
        setCurrentSideQuestIndex(currentSideQuestIndex + 1);
        setCurrentSideQuest(
          parsedTripPlan.sideQuests[currentSideQuestIndex + 1]
        );
        setSideQuestState("initial");
      } else {
        setAllQuestsCompleted(true);
      }
    }
  };

  const finishTrip = () => {
    const isSuccessful = sideQuestPoints >= 5;

    if (groupId) {
      // Navigate directly to the GroupScreen with parameters
      navigation.navigate("GroupScreen", {
        groupId,
        tripCompleted: true,
        tripSuccess: isSuccessful,
        tripPoints: sideQuestPoints,
        timestamp: Date.now(), // Add timestamp to ensure params are seen as new
      });
    } else {
      navigation.navigate("Home");
    }
  };

  // Render a wooden button
  const renderWoodenButton = (text, onPress, isDisabled = false) => (
    <View style={styles.buttonOuterContainer}>
      <View style={styles.buttonTopBorder} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonLeftBorder} />
        <TouchableOpacity
          style={[styles.woodenButton, isDisabled && styles.disabledButton]}
          onPress={onPress}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <Text style={styles.woodenButtonText}>{text}</Text>
        </TouchableOpacity>
        <View style={styles.buttonRightBorder} />
      </View>
      <View style={styles.buttonBottomBorder} />
    </View>
  );

  // Create a specialized button render function for the roll button
  const renderRollButton = (onPress) => (
    <TouchableOpacity
      style={styles.rollButtonContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={grassGif} style={styles.grassBackground} />
      <Text style={styles.rollButtonText}>Roll Dice</Text>
    </TouchableOpacity>
  );

  // Create a smaller button for the skip function
  const renderSmallButton = (text, onPress) => (
    <View style={styles.smallButtonOuterContainer}>
      <View style={styles.buttonTopBorder} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttonLeftBorder} />
        <TouchableOpacity
          style={styles.smallWoodenButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.smallButtonText}>{text}</Text>
        </TouchableOpacity>
        <View style={styles.buttonRightBorder} />
      </View>
      <View style={styles.buttonBottomBorder} />
    </View>
  );

  if (loading) {
    return (
      <ImageBackground
        source={groupBackground}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B87333" />
            <Text style={styles.loadingText}>Loading trip plan...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (errorMsg) {
    return (
      <ImageBackground
        source={groupBackground}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{errorMsg}</Text>
            {renderWoodenButton("Go Back", () => navigation.goBack())}
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={groupBackground} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContent}>
          {/* Map View */}
          {mapLocations.length > 0 && (
            <View style={styles.cardContainer}>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={{
                    latitude:
                      mapLocations[currentLocationIndex]?.coordinate
                        ?.latitude || 37.78825,
                    longitude:
                      mapLocations[currentLocationIndex]?.coordinate
                        ?.longitude || -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  {mapLocations.map((location, index) => (
                    <Marker
                      key={index}
                      coordinate={location.coordinate}
                      title={location.locationName}
                      description={location.locationDescription}
                      pinColor={index === currentLocationIndex ? "red" : "blue"}
                    />
                  ))}
                </MapView>

                {/* Overlay navigation bar on top of the map */}
                <View style={styles.overlayNavigation}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentLocationIndex === 0 && styles.disabledButton,
                    ]}
                    onPress={goToPreviousLocation}
                    disabled={currentLocationIndex === 0}
                  >
                    <Text style={styles.navButtonText}>←</Text>
                  </TouchableOpacity>

                  <Text style={styles.locationTitle}>
                    {mapLocations[currentLocationIndex]?.time}:{" "}
                    {mapLocations[currentLocationIndex]?.locationName}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      currentLocationIndex === mapLocations.length - 1 &&
                        styles.disabledButton,
                    ]}
                    onPress={goToNextLocation}
                    disabled={currentLocationIndex === mapLocations.length - 1}
                  >
                    <Text style={styles.navButtonText}>→</Text>
                  </TouchableOpacity>
                </View>

                {/* Repositioned Get Directions button */}
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openMapsForDirections}
                >
                  <Text style={styles.directionsButtonText}>📍 Directions</Text>
                </TouchableOpacity>

                <Text style={styles.locationDescription}>
                  {mapLocations[currentLocationIndex]?.locationDescription}
                </Text>
              </View>
            </View>
          )}

          {/* Side Quest Deck */}
          {parsedTripPlan &&
            parsedTripPlan.sideQuests &&
            !allQuestsCompleted && (
              <View style={styles.cardContainer}>
                <View style={styles.sideQuestCard}>
                  {sideQuestState === "initial" && currentSideQuest && (
                    <>
                      <Text style={styles.sideQuestCardTitle}>
                        Side Quest {currentSideQuestIndex + 1}/
                        {parsedTripPlan.sideQuests.length}
                      </Text>
                      <Text style={styles.sideQuestAttributeText}>
                        Attribute: {currentSideQuest.sideQuestAttributeModifier}
                      </Text>
                      <View style={styles.questDescriptionContainer}>
                        <Text style={styles.questLabel}>Easy:</Text>
                        <Text style={styles.sideQuestText}>
                          {currentSideQuest.sideQuestDescriptionEasy}
                        </Text>
                      </View>
                      <View style={styles.questDescriptionContainer}>
                        <Text style={styles.questLabel}>Hard:</Text>
                        <Text style={styles.sideQuestText}>
                          {currentSideQuest.sideQuestDescriptionHard}
                        </Text>
                      </View>
                      <Text style={styles.sideQuestDiceText}>
                        Dice Check Value:{" "}
                        {currentSideQuest.sideQuestD20CheckValue}
                      </Text>

                      <View style={styles.verticalButtonContainer}>
                        {renderRollButton(rollDice)}
                        {renderSmallButton("Skip", skipQuest)}
                      </View>
                    </>
                  )}

                  {sideQuestState === "rolled" && currentSideQuest && (
                    <>
                      <Text style={styles.sideQuestCardTitle}>
                        Side Quest {currentSideQuestIndex + 1}/
                        {parsedTripPlan.sideQuests.length}
                      </Text>
                      <Text style={styles.sideQuestAttributeText}>
                        Attribute: {currentSideQuest.sideQuestAttributeModifier}
                      </Text>
                      <Text style={styles.sideQuestRollText}>
                        You rolled: {currentSideQuest.originalRoll}
                        {currentSideQuest.hasPersonalityBonus
                          ? ` (+2 for ${personalityCategory})`
                          : ""}
                      </Text>
                      <Text style={styles.sideQuestSelectedText}>
                        {currentSideQuest.selectedQuest}
                      </Text>
                      <Text style={styles.sideQuestPointsText}>
                        Points: {currentSideQuest.pointValue}
                      </Text>

                      <View style={styles.verticalButtonContainer}>
                        {renderWoodenButton("Complete", completeQuest, false)}
                        {renderSmallButton("Skip", skipQuest)}
                      </View>
                    </>
                  )}
                </View>

                <Text style={styles.pointsCounter}>
                  Total Points: {sideQuestPoints}
                </Text>
              </View>
            )}

          {/* Trip Completion */}
          {allQuestsCompleted && (
            <View style={styles.cardContainer}>
              <Text style={styles.sectionTitle}>Adventure Complete!</Text>
              <View style={styles.completionCard}>
                <Text style={styles.completionText}>
                  You earned {sideQuestPoints} points from side quests.
                </Text>
                <Text style={styles.completionStatus}>
                  {sideQuestPoints >= 5
                    ? "Adventure Successful!"
                    : "You need more points to complete the adventure!"}
                </Text>

                {renderWoodenButton(
                  groupId ? "Return to Group" : "Return to Home",
                  finishTrip,
                  false
                )}
              </View>
            </View>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    margin: 20,
    borderRadius: 10,
    padding: 20,
    borderWidth: 4,
    borderColor: "#B87333",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: "monospace",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  error: {
    color: "red",
    fontSize: 16,
    fontFamily: "monospace",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: "#B87333",
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "monospace",
    color: "#000",
  },
  cardContainer: {
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 4,
    borderColor: "#B87333",
    padding: 15,
  },
  mapContainer: {
    height: 280,
    marginBottom: 10,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    marginBottom: 60,
    height: 280,
  },
  locationDescription: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    fontSize: 14,
    marginTop: 280,
    fontFamily: "monospace",
    borderWidth: 3,
    borderColor: "#B87333",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "monospace",
    color: "#000",
  },
  sideQuestCard: {
    backgroundColor: "#F5DEB3", // Wheat color
    borderWidth: 3,
    borderColor: "#B87333",
    padding: 15,
    marginBottom: 15,
  },
  sideQuestCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "monospace",
  },
  sideQuestAttributeText: {
    fontSize: 16,
    marginBottom: 10,
    fontStyle: "italic",
    fontFamily: "monospace",
    color: "#4a2511", // Dark brown
  },
  questDescriptionContainer: {
    marginBottom: 8,
  },
  questLabel: {
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  sideQuestText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  sideQuestDiceText: {
    fontSize: 14,
    marginVertical: 10,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  sideQuestRollText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  sideQuestSelectedText: {
    fontSize: 16,
    marginBottom: 15,
    fontStyle: "italic",
    fontFamily: "monospace",
  },
  sideQuestPointsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginHorizontal: -5,
  },
  buttonWrapper: {
    flex: 1,
    maxWidth: "48%",
    marginHorizontal: 5,
  },
  pointsCounter: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    color: "#4a2511",
  },
  completionCard: {
    backgroundColor: "#F5DEB3",
    padding: 20,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#B87333",
  },
  completionText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "monospace",
  },
  completionStatus: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#4CAF50",
    fontFamily: "monospace",
  },
  // Wooden button styles
  buttonOuterContainer: {
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    minWidth: 120,
  },
  buttonTopBorder: {
    height: 5,
    backgroundColor: "#B87333", // Copper/lighter brown
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
  woodenButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#90EE90", // Light green
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2E8B57", // Sea green border
    height: 45,
  },
  woodenButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 15,
    fontFamily: "monospace",
    textAlign: "center",
  },
  buttonRightBorder: {
    width: 5,
    backgroundColor: "#B87333",
  },
  buttonBottomBorder: {
    height: 5,
    backgroundColor: "#B87333",
    width: "100%",
  },
  overlayNavigation: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: "#B87333",
  },
  directionsButton: {
    position: "absolute",
    bottom: 85, // Position above the description area
    left: "50%",
    transform: [{ translateX: -70 }], // Center the button (half of the width)
    backgroundColor: "#90EE90", // Light green to match other buttons
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#2E8B57",
    height: 40,
    width: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "monospace",
  },
  navButton: {
    backgroundColor: "#4285F4",
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2E8B57",
  },
  navButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: "monospace",
    color: "#000",
  },
  rollButtonContainer: {
    width: "90%",
    height: 100,
    marginVertical: 10,
    borderWidth: 3,
    borderColor: "#2E8B57",
    borderRadius: 0,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    position: "relative",
  },
  grassBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  rollButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 24,
    fontFamily: "monospace",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  verticalButtonContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  smallButtonOuterContainer: {
    width: "60%",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  smallWoodenButton: {
    flex: 1,
    padding: 8,
    backgroundColor: "#90EE90", // Light green
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2E8B57", // Sea green border
    height: 35,
  },
  smallButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
  },
});

export default TripPlannerScreen;
