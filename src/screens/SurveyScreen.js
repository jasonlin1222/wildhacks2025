import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function SurveyScreen({ navigation }) {
  const { updateUserProfile, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Survey state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Personal Information",
      fields: [
        {
          label: "Full Name",
          value: name,
          setter: setName,
          keyboardType: "default",
          placeholder: "Enter your full name",
        },
        {
          label: "Age",
          value: age,
          setter: setAge,
          keyboardType: "numeric",
          placeholder: "Enter your age",
        },
      ],
    },
    {
      title: "Interests",
      fields: [
        {
          label: "What are your interests?",
          value: interests,
          setter: setInterests,
          keyboardType: "default",
          placeholder: "E.g. technology, sports, cooking",
          multiline: true,
        },
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    const currentFields = steps[currentStep].fields;
    for (const field of currentFields) {
      if (!field.value) {
        Alert.alert("Error", `Please fill in ${field.label}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      await updateUserProfile({
        name,
        age: parseInt(age),
        interests,
        surveyCompleted: true,
      });

      // The user will be redirected to the home screen by the route guard in App.js
    } catch (error) {
      Alert.alert("Error", "Failed to save survey data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{step.title}</Text>

        {step.fields.map((field, index) => (
          <View key={index} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, field.multiline && styles.multilineInput]}
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.setter}
              keyboardType={field.keyboardType}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : 1}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to the App</Text>
      <Text style={styles.subtitle}>
        Please complete this survey to get started
      </Text>

      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
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
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 30,
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
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
