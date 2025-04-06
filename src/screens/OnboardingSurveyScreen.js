import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Import the background image
const pixelSkyBackground = require('./pixel-sky.png');

export default function OnboardingSurveyScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  
  // Plant personality quiz questions from the provided file
  const surveyQuestions = [
    {
      id: "q1",
      question: "Your friends are planning a night out. What's your ideal evening?",
      options: [
        { id: "A", text: "Cozy night in with tea and a good book or documentary" },
        { id: "B", text: "Small gathering with close friends where we can have deep conversations" },
        { id: "C", text: "Being the life of the party, meeting new people all night" },
        { id: "D", text: "Trying that new experimental art installation, then an underground jazz club" },
        { id: "E", text: "Spontaneous road trip to a place none of you have been before" },
        { id: "F", text: "Creating a themed dinner party experience for your friends" },
      ]
    },
    {
      id: "q2",
      question: "It's your first date and you get to pick the location. Where are you taking them?",
      options: [
        { id: "A", text: "A hidden speakeasy with vintage cocktails and mysterious ambiance" },
        { id: "B", text: "A museum or botanical garden where you can discuss what you see" },
        { id: "C", text: "A volunteer event where you can help others while getting to know each other" },
        { id: "D", text: "A festival or social event where you can introduce them to your friends" },
        { id: "E", text: "Rock climbing or an escape room - something active and exciting" },
        { id: "F", text: "A creative workshop where you make something together to remember the day" },
      ]
    },
    {
      id: "q3",
      question: "Which pick-up line would you most likely use (even ironically)?",
      options: [
        { id: "A", text: "\"Do you believe in fate? Because I think our meeting was written in the stars.\"" },
        { id: "B", text: "\"If you were a book in the library, I'd check you out for the maximum renewal period.\"" },
        { id: "C", text: "\"I've got a shoulder if you ever need one to lean on.\"" },
        { id: "D", text: "\"You must be a sunflower, because you just brightened my whole day!\"" },
        { id: "E", text: "\"Life's short - wanna go on an adventure with me?\"" },
        { id: "F", text: "\"If I could rearrange the alphabet, I'd put U and I together to make art.\"" },
      ]
    },
    {
      id: "q4",
      question: "Your plant crush just sent you a text. How long do you wait to respond?",
      options: [
        { id: "A", text: "I'll respond at midnight. Keep them guessing." },
        { id: "B", text: "I'll think carefully about my response and send a thoughtful message later." },
        { id: "C", text: "Immediately! And I'll ask how their day is going." },
        { id: "D", text: "Respond quickly and include a group selfie from the party I'm at." },
        { id: "E", text: "Whenever I get around to it - might be in the middle of climbing a mountain!" },
        { id: "F", text: "I'll send back a poem or drawing I created just for them." },
      ]
    },
    {
      id: "q5",
      question: "Which of these items would most likely be found in your home?",
      options: [
        { id: "A", text: "A collection of obscure vintage items with stories behind them" },
        { id: "B", text: "Wall-to-wall bookshelves and a dedicated meditation space" },
        { id: "C", text: "First aid kit and homemade cookies ready for visitors" },
        { id: "D", text: "A well-stocked bar cart and plenty of seating for spontaneous gatherings" },
        { id: "E", text: "Travel souvenirs and gear for your next expedition" },
        { id: "F", text: "Art supplies everywhere and walls covered in creative projects" },
      ]
    },
    {
      id: "q6",
      question: "How would you handle a disagreement with your plant partner?",
      options: [
        { id: "A", text: "Create some distance to process my feelings, then return with a new perspective" },
        { id: "B", text: "Analyze the root cause and propose a logical solution" },
        { id: "C", text: "Focus on how they're feeling and work to restore harmony" },
        { id: "D", text: "Talk it out immediately with friends to get multiple perspectives" },
        { id: "E", text: "Address it head-on, then suggest an activity to break the tension" },
        { id: "F", text: "Express my feelings through a creative outlet, then share it with them" },
      ]
    },
    {
      id: "q7",
      question: "What's your ideal weekend morning?",
      options: [
        { id: "A", text: "Sleeping in late, blinds drawn, enjoying the quiet darkness" },
        { id: "B", text: "Peaceful contemplation with coffee and a challenging puzzle" },
        { id: "C", text: "Making breakfast for someone you care about" },
        { id: "D", text: "Brunch with friends, sharing stories from the week" },
        { id: "E", text: "Up at dawn for a hike to catch the sunrise" },
        { id: "F", text: "Flowing with inspiration on a creative project in your pajamas" },
      ]
    },
    {
      id: "q8",
      question: "Choose a playlist name that best represents your vibe:",
      options: [
        { id: "A", text: "\"Shadows & Whispers: Music for Midnight\"" },
        { id: "B", text: "\"Contemplative Classics & Thoughtful Tunes\"" },
        { id: "C", text: "\"Comfort Sounds for Healing Hearts\"" },
        { id: "D", text: "\"Party Anthems & Social Soundtracks\"" },
        { id: "E", text: "\"Adventure Awaits: Music to Move You\"" },
        { id: "F", text: "\"Creative Flow: Inspiration Station\"" },
      ]
    },
    {
      id: "q9",
      question: "Your date shows up with a surprise gift. What are you hoping it is?",
      options: [
        { id: "A", text: "A mysterious antique with an intriguing story behind it" },
        { id: "B", text: "A book by your favorite philosopher or scientist" },
        { id: "C", text: "A homemade remedy for that cold you mentioned last week" },
        { id: "D", text: "Concert tickets to see your favorite band together" },
        { id: "E", text: "Gear for a spontaneous weekend adventure" },
        { id: "F", text: "Art supplies or something they created just for you" },
      ]
    },
    {
      id: "q10",
      question: "Which emoji do you use most frequently?",
      options: [
        { id: "A", text: "🖤, 🌙, ✨, 🔮" },
        { id: "B", text: "🤔, 📚, 💭, 🧠" },
        { id: "C", text: "💗, 🤗, 🌿, 🍵" },
        { id: "D", text: "🎉, 😂, 👯, 🌻" },
        { id: "E", text: "🔥, 🚀, 🌋, 💯" },
        { id: "F", text: "🎨, 🌈, 💫, 🦋" },
      ]
    },
  ];

  // Secondary questions based on personality type
  const secondaryQuestions = {
    "A": { // Mysterious/Intense
      id: "secondaryA",
      question: "Which sounds most like you?",
      options: [
        { id: "blueRose", text: "I'm passionate and unconventional in how I express my feelings" },
        { id: "moonflower", text: "I'm selective about who gets to know the real me" },
        { id: "blackDahlia", text: "I have a complex past that makes me who I am today" },
        { id: "hellebore", text: "I thrive during times when others struggle, offering unexpected beauty" },
      ]
    },
    "B": { // Intellectual/Thoughtful
      id: "secondaryB",
      question: "How do you approach personal growth?",
      options: [
        { id: "bonsai", text: "Through careful cultivation and mindful pruning of habits" },
        { id: "orchid", text: "By creating ideal conditions for my specific needs" },
        { id: "bamboo", text: "With flexibility while maintaining strong principles" },
        { id: "japaneseMaple", text: "By adapting my perspective as seasons of life change" },
        { id: "ginkgoTree", text: "By drawing on ancient wisdom and resilience" },
      ]
    },
    "C": { // Nurturing/Caring
      id: "secondaryC",
      question: "How do you typically support others?",
      options: [
        { id: "aloeVera", text: "Practical help and healing presence in difficult times" },
        { id: "lavender", text: "Creating calm environments and emotional safety" },
        { id: "rosemary", text: "Protecting others and preserving important memories" },
        { id: "chamomile", text: "Being reliably present during crises" },
      ]
    },
    "D": { // Social/Expressive
      id: "secondaryD",
      question: "At a gathering, you're most likely to:",
      options: [
        { id: "sunflower", text: "Brighten the mood and help everyone feel optimistic" },
        { id: "rosemary", text: "Connect people with shared interests and protect the vulnerable" },
        { id: "cherryBlossom", text: "Create memorable moments that everyone treasures" },
        { id: "hibiscus", text: "Bring warmth and vibrant energy to any conversation" },
      ]
    },
    "E": { // Adventurous/Bold
      id: "secondaryE",
      question: "Your approach to challenges is:",
      options: [
        { id: "marigold", text: "Meeting them with cheerful brightness and social support" },
        { id: "amaryllis", text: "Commanding attention with dramatic flair and confidence" },
        { id: "dandelion", text: "Fearlessly spreading your influence across new territories" },
        { id: "fireLily", text: "Rising from setbacks stronger than before" },
      ]
    },
    "F": { // Artistic/Creative
      id: "secondaryF",
      question: "Your creative expression typically:",
      options: [
        { id: "bleedingHeart", text: "Reveals your emotional vulnerability and authentic feelings" },
        { id: "birdOfParadise", text: "Makes a bold, exotic statement that can't be ignored" },
        { id: "wisteria", text: "Creates dramatic, romantic atmospheres that envelop others" },
        { id: "poppy", text: "Captures fleeting beauty that leaves lasting impressions" },
      ]
    }
  };

  // Determine primary personality type from answers
  const determinePrimaryType = (answers) => {
    // Count occurrences of each letter
    const counts = {
      A: 0, // Mysterious/Intense
      B: 0, // Intellectual/Thoughtful
      C: 0, // Nurturing/Caring
      D: 0, // Social/Expressive
      E: 0, // Adventurous/Bold
      F: 0, // Artistic/Creative
    };
    
    // Count each answer type - FIXED: removed the conditional check
    Object.values(answers).forEach(answer => {
      counts[answer]++; // This will increment even if it's currently 0
    });
    
    // Find the most common answer type
    let maxCount = 0;
    let primaryType = "";
    
    Object.entries(counts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryType = type;
      }
    });
    
    return primaryType;
  };

  // Handle option selection
  // Replace your current handleSelect function with this one
  const handleSelect = (optionId) => {
    // Get the current question (primary or secondary)
    const currentQuestion = getCurrentQuestion();
    
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionId
    });
  };

  // Check if the current step is a secondary question based on primary type
  const isSecondaryQuestion = () => {
    // Primary questions are the first 10
    if (currentStep < 10) return false;
    
    // If we're at step 10, we're at the secondary question
    return true;
  };

  // Get the current question to display
  const getCurrentQuestion = () => {
    if (isSecondaryQuestion()) {
      // Get the primary personality type to determine the secondary question
      const primaryType = determinePrimaryType(selectedAnswers);
      // Make sure we have a valid secondary question for this primary type
      if (primaryType && secondaryQuestions[primaryType]) {
        return secondaryQuestions[primaryType];
      }
      // Fallback to the last primary question if we don't have a valid secondary question
      return surveyQuestions[surveyQuestions.length - 1];
    }
    
    return surveyQuestions[currentStep];
  };

  // Handle next button click
  // Handle next button click
  const handleNext = async () => {
    // If we haven't completed all primary questions yet
    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // If we've completed primary questions but not the secondary
    if (!isSecondaryQuestion()) {
      // Determine primary type and move to secondary question
      const primaryType = determinePrimaryType(selectedAnswers);
      console.log("Moving to secondary question for type:", primaryType);
      setCurrentStep(10); // Set to secondary question
      return;
    }
    
    // We've completed both primary and secondary questions
    setLoading(true);
    
    try {
      // Determine the final plant match
      const primaryType = determinePrimaryType(selectedAnswers);
      console.log("Final primary type:", primaryType);
      
      // Make sure we have a valid secondary question response
      const secondaryQuestionId = secondaryQuestions[primaryType]?.id;
      if (!secondaryQuestionId || !selectedAnswers[secondaryQuestionId]) {
        console.error("Missing secondary answer for type:", primaryType);
        console.log("Current selected answers:", selectedAnswers);
        alert("Unable to complete survey. Please try again.");
        setLoading(false);
        return;
      }
      
      const secondaryAnswer = selectedAnswers[secondaryQuestionId];
      console.log("Secondary answer:", secondaryAnswer);
      const plantMatch = secondaryAnswer; // The ID of the selected secondary option is the plant match
  
      // Instead of saving to Firebase here, navigate to PlantAssignment
      navigation.navigate("PlantAssignment", { 
        plantMatch: plantMatch,
        surveyAnswers: selectedAnswers
      });
    } catch (error) {
      console.error("Error in handleNext:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Check if an option is selected for the current question
  const isOptionSelected = (optionId) => {
    const currentQuestion = getCurrentQuestion();
    return selectedAnswers[currentQuestion.id] === optionId;
  };

  // Check if the current step has a selection
  const hasSelection = () => {
    const currentQuestion = getCurrentQuestion();
    return selectedAnswers[currentQuestion.id] !== undefined;
  };

  // Render a wooden button option with the pixel style
  const renderOption = (option) => {
    const selected = isOptionSelected(option.id);
    
    return (
      <View style={styles.buttonOuterContainer} key={option.id}>
        <View style={styles.buttonTopBorder} />
        <View style={styles.buttonContainer}>
          <View style={styles.buttonLeftBorder} />
          <TouchableOpacity
            style={[styles.button, selected && styles.selectedButton]}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, selected && styles.selectedButtonText]}>
              {option.text}
            </Text>
          </TouchableOpacity>
          <View style={styles.buttonRightBorder} />
        </View>
        <View style={styles.buttonBottomBorder} />
      </View>
    );
  };

  // Get the current question to display
  const currentQuestion = getCurrentQuestion();

  return (
    <ImageBackground 
      source={pixelSkyBackground} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Plant Personality Quiz</Text>

          <View style={styles.progressContainer}>
            {surveyQuestions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.activeDot,
                  index < currentStep && styles.completedDot,
                ]}
              />
            ))}
            {/* Add an extra dot for the secondary question */}
            {isSecondaryQuestion() && (
              <View style={[styles.progressDot, styles.activeDot]} />
            )}
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            {currentQuestion.options.map((option) => renderOption(option))}
          </View>

          <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButtonComplete, styles.backButton]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButtonComplete, 
              styles.nextButton,
              !hasSelection() && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!hasSelection() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.navButtonText}>
                {isSecondaryQuestion() ? "Finish" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
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
    fontFamily: 'monospace',
    color: '#000',
    // Pixelated text effect
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    flexWrap: "wrap",
  },
  progressDot: {
    width: 10,
    height: 10,
    backgroundColor: "#ccc",
    margin: 5,
  },
  activeDot: {
    backgroundColor: "#FFD700", // Gold color for active dot
    width: 12,
    height: 12,
  },
  completedDot: {
    backgroundColor: "#228B22", // Forest green for completed
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 4,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: 'monospace',
    color: '#000',
  },
  // Outer container for the whole button assembly
  buttonOuterContainer: {
    width: '100%',
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
    backgroundColor: '#B87333', // Copper/lighter brown
    width: '100%', // Make sure it spans full width
  },
  // Container for the button and side borders
  buttonContainer: {
    flexDirection: 'row',
    width: '100%', // Make sure it takes full width of parent
    overflow: 'hidden', // Hide any overflowing elements
  },
  // Left wooden border
  buttonLeftBorder: {
    width: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
  },
  // The actual button with the light wood color
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5DEB3', // Wheat (lighter wood color)
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D2B48C', // Tan (lighter inner border)
    borderStyle: 'solid',
  },
  selectedButton: {
    backgroundColor: '#FFD700', // Gold for selected
    borderColor: '#B8860B', // DarkGoldenrod
  },
  // Right wooden border
  buttonRightBorder: {
    width: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
  },
  // Bottom wooden border
  buttonBottomBorder: {
    height: 5,
    backgroundColor: '#B87333', // Copper/lighter brown
    marginHorizontal: 5,
  },
  // Button text
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'monospace',
    padding: 5,
  },
  selectedButtonText: {
    fontWeight: 'bold',
  },
  // Navigation container
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
    marginBottom: 30,
    gap: 20,
  },
  // Navigation buttons
  navButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    backgroundColor: '#F5DEB3', // Wheat (lighter wood color)
    borderWidth: 2,
    borderColor: '#D2B48C', // Tan (lighter inner border)
  },
  backButton: {
    backgroundColor: '#F5DEB3', // Wheat color
  },
  nextButton: {
    backgroundColor: '#90EE90', // Light green
  },
  disabledButton: {
    backgroundColor: '#D3D3D3', // Light gray
    opacity: 0.7,
  },
  navButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  // Add this to your StyleSheet
  navButtonOuterContainer: {
    width: '40%', // Make them a bit smaller 
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  navButtonComplete: {
    width: '40%',
    backgroundColor: '#F5DEB3', // Wheat (lighter wood color)
    borderWidth: 5,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    shadowColor: "#000",
    shadowOffset: {
      width: 2, 
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    marginBottom: 15,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5DEB3', // Wheat color
  },
  
  nextButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#90EE90', // Light green
  },
});