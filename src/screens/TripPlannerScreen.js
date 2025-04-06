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
} from "react-native";
import * as Location from "expo-location";
import { GoogleGenerativeAI } from "@google/generative-ai";
import MapView, { Marker } from "react-native-maps";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading trip plan...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Personalized Trip Plan</Text>

      {/* Location Navigation */}
      {mapLocations.length > 0 && (
        <View style={styles.navigationContainer}>
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
      )}

      {/* Map View */}
      {mapLocations.length > 0 && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude:
                mapLocations[currentLocationIndex]?.coordinate?.latitude ||
                37.78825,
              longitude:
                mapLocations[currentLocationIndex]?.coordinate?.longitude ||
                -122.4324,
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

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={openMapsForDirections}
          >
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>

          <Text style={styles.locationDescription}>
            {mapLocations[currentLocationIndex]?.locationDescription}
          </Text>
        </View>
      )}

      {/* Side Quest Deck */}
      {parsedTripPlan && parsedTripPlan.sideQuests && !allQuestsCompleted && (
        <View style={styles.sideQuestContainer}>
          <Text style={styles.sideQuestTitle}>Side Quests</Text>

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
                <Text style={styles.sideQuestText}>
                  Easy: {currentSideQuest.sideQuestDescriptionEasy}
                </Text>
                <Text style={styles.sideQuestText}>
                  Hard: {currentSideQuest.sideQuestDescriptionHard}
                </Text>
                <Text style={styles.sideQuestDiceText}>
                  Dice Check Value: {currentSideQuest.sideQuestD20CheckValue}
                </Text>

                <View style={styles.sideQuestButtonContainer}>
                  <TouchableOpacity
                    style={styles.sideQuestButton}
                    onPress={rollDice}
                  >
                    <Text style={styles.buttonText}>Roll</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sideQuestButton, styles.skipButton]}
                    onPress={skipQuest}
                  >
                    <Text style={styles.buttonText}>Skip</Text>
                  </TouchableOpacity>
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
                  You rolled:{" "}
                  {currentSideQuest.originalRoll +
                    (currentSideQuest.hasPersonalityBonus ? 2 : 0)}
                </Text>
                <Text style={styles.sideQuestSelectedText}>
                  {currentSideQuest.selectedQuest}
                </Text>
                <Text style={styles.sideQuestPointsText}>
                  Points: {currentSideQuest.pointValue}
                </Text>

                <View style={styles.sideQuestButtonContainer}>
                  <TouchableOpacity
                    style={styles.sideQuestButton}
                    onPress={completeQuest}
                  >
                    <Text style={styles.buttonText}>Complete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sideQuestButton, styles.skipButton]}
                    onPress={skipQuest}
                  >
                    <Text style={styles.buttonText}>Skip</Text>
                  </TouchableOpacity>
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
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Trip Complete!</Text>
          <Text style={styles.completionText}>
            You earned {sideQuestPoints} points from side quests.
          </Text>
          <Text style={styles.completionStatus}>
            {sideQuestPoints >= 5
              ? "Adventure Complete!"
              : "You need more side quests to complete the adventure!"}
          </Text>

          <TouchableOpacity style={styles.finishButton} onPress={finishTrip}>
            <Text style={styles.finishButtonText}>
              {groupId ? "Return to Group" : "Return to Home"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  navButton: {
    backgroundColor: "#4285F4",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
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
  },
  mapContainer: {
    height: 350,
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  directionsButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4285F4",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  directionsButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  locationDescription: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    fontSize: 14,
  },
  sideQuestContainer: {
    marginVertical: 20,
  },
  sideQuestTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  sideQuestCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sideQuestCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sideQuestAttributeText: {
    fontSize: 16,
    marginBottom: 10,
    fontStyle: "italic",
  },
  sideQuestText: {
    fontSize: 14,
    marginBottom: 8,
  },
  sideQuestDiceText: {
    fontSize: 14,
    marginVertical: 10,
    fontWeight: "bold",
  },
  sideQuestRollText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  sideQuestSelectedText: {
    fontSize: 16,
    marginBottom: 15,
    fontStyle: "italic",
  },
  sideQuestPointsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  sideQuestButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  sideQuestButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#9e9e9e",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  pointsCounter: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  completionContainer: {
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#4285F4",
  },
  completionText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  completionStatus: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#4CAF50",
  },
  finishButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  finishButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default TripPlannerScreen;
