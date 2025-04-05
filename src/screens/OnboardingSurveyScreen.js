import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";

export default function OnboardingSurveyScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Survey responses
  const [responses, setResponses] = useState({
    preferredCategories: [],
    experienceLevel: null,
    frequency: null,
    interests: [],
  });

  // Survey questions with multiple choice options
  const surveySteps = [
    {
      id: "preferredCategories",
      title: "What categories are you interested in?",
      subtitle: "Select all that apply",
      multiSelect: true,
      options: [
        { id: "technology", label: "Technology" },
        { id: "arts", label: "Arts & Crafts" },
        { id: "sports", label: "Sports & Fitness" },
        { id: "cooking", label: "Cooking" },
        { id: "travel", label: "Travel" },
        { id: "music", label: "Music" },
      ],
    },
    {
      id: "experienceLevel",
      title: "What's your experience level?",
      subtitle: "Select one option",
      multiSelect: false,
      options: [
        { id: "beginner", label: "Beginner" },
        { id: "intermediate", label: "Intermediate" },
        { id: "advanced", label: "Advanced" },
        { id: "expert", label: "Expert" },
      ],
    },
    {
      id: "frequency",
      title: "How often do you plan to use this app?",
      subtitle: "Select one option",
      multiSelect: false,
      options: [
        { id: "daily", label: "Daily" },
        { id: "weekly", label: "Weekly" },
        { id: "monthly", label: "Monthly" },
        { id: "occasionally", label: "Occasionally" },
      ],
    },
    {
      id: "interests",
      title: "Select your specific interests",
      subtitle: "Select all that apply",
      multiSelect: true,
      options: [
        { id: "development", label: "Software Development" },
        { id: "design", label: "Design" },
        { id: "photography", label: "Photography" },
        { id: "gaming", label: "Gaming" },
        { id: "reading", label: "Reading" },
        { id: "writing", label: "Writing" },
        { id: "hiking", label: "Hiking" },
        { id: "movies", label: "Movies & TV" },
      ],
    },
  ];

  const handleOptionSelect = (optionId) => {
    const currentStepData = surveySteps[currentStep];
    const { id, multiSelect } = currentStepData;

    if (multiSelect) {
      setResponses((prev) => {
        const currentSelections = [...prev[id]];

        // Toggle selection
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [id]: currentSelections.filter((item) => item !== optionId),
          };
        } else {
          return {
            ...prev,
            [id]: [...currentSelections, optionId],
          };
        }
      });
    } else {
      // Single select
      setResponses((prev) => ({
        ...prev,
        [id]: optionId,
      }));
    }
  };

  const isOptionSelected = (optionId) => {
    const currentStepData = surveySteps[currentStep];
    const { id, multiSelect } = currentStepData;

    if (multiSelect) {
      return responses[id].includes(optionId);
    } else {
      return responses[id] === optionId;
    }
  };

  const isStepValid = () => {
    const currentStepData = surveySteps[currentStep];
    const { id } = currentStepData;

    if (Array.isArray(responses[id])) {
      return responses[id].length > 0;
    }

    return responses[id] !== null;
  };

  const handleNext = () => {
    if (currentStep < surveySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All survey questions answered, proceed to account creation
      navigation.navigate("CreateAccount", { surveyResponses: responses });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderCurrentStep = () => {
    const step = surveySteps[currentStep];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

        {step.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              isOptionSelected(option.id) && styles.selectedOption,
            ]}
            onPress={() => handleOptionSelect(option.id)}
          >
            <Text
              style={[
                styles.optionText,
                isOptionSelected(option.id) && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Onboarding Survey</Text>

        <View style={styles.progressContainer}>
          {surveySteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {renderCurrentStep()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              !isStepValid() && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!isStepValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {currentStep === surveySteps.length - 1 ? "Next" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#007bff",
    width: 12,
    height: 12,
  },
  stepContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  optionItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: "#007bff",
    backgroundColor: "rgba(0, 123, 255, 0.1)",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    fontWeight: "500",
    color: "#007bff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    borderRadius: 5,
    padding: 15,
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: "#007bff",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
