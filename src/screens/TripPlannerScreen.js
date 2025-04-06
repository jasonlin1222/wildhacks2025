import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TripPlannerScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripPlan, setTripPlan] = useState(null);

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
        `https://api.geoapify.com/v2/places?categories=${categoriesString}&filter=circle:${location.coords.longitude},${location.coords.latitude},5000&limit=10&apiKey=${GEOAPIFY_API_KEY}`,
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
      Make sure to include a mix of activities and locations to ensure a balanced and enjoyable trip.
      Randomly add suprises side quests to the trip that promotes social interaction between the participants in the group, or between participants and the locals.`;

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
      {tripPlan && <Text style={styles.plan}>{tripPlan}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  plan: {
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    color: "red",
    fontSize: 16,
  },
});

export default TripPlannerScreen;
