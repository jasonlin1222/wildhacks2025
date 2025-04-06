import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  Image,
} from "react-native";

// Import the background image
const pixelSkyBackground = require('./pixel-sky.png');

// Plant data with descriptions
const plantData = {
  // blueRose: {
  //   name: "Blue Rose",
  //   image: require('./plants/blue-rose.gif'), // Update with actual path
  //   description: "The mystical Blue Rose represents the impossible made possible. You are passionate and unconventional in how you express your feelings. Others are drawn to your unique perspective and the depth of your emotional world.",
  // },
  // moonflower: {
  //   name: "Moonflower",
  //   image: require('./plants/moonflower.gif'), // Update with actual path
  //   description: "Like the Moonflower that blooms only at night, you reveal your true self selectively. You're thoughtful, mysterious, and have depths that few get to witness. Those who earn your trust discover a rare and beautiful soul.",
  // },
  // blackDahlia: {
  //   name: "Black Dahlia",
  //   image: require('./plants/black-dahlia.gif'), // Update with actual path
  //   description: "The Black Dahlia symbolizes dark elegance and inner complexity. Your past experiences have shaped your rich emotional landscape. You have the rare ability to find beauty in the shadows and transform challenges into strength.",
  // },
  // hellebore: {
  //   name: "Hellebore",
  //   image: require('./plants/hellebore.gif'), // Update with actual path
  //   description: "The Hellebore, or Winter Rose, blooms when other plants lie dormant. You thrive in conditions where others might falter, offering unexpected beauty and resilience. Your quiet strength emerges most powerfully during difficult times.",
  // },
  // bonsai: {
  //   name: "Bonsai",
  //   image: require('./plants/bonsai.gif'), // Update with actual path
  //   description: "The Bonsai represents mindful cultivation and patient wisdom. You approach personal growth with careful intention, understanding that meaningful change takes time and consistency. Your thoughtful presence creates calm in any environment.",
  // },
  // // Add descriptions for all other plants...
  // // Intellectual/Thoughtful plants
  // orchid: {
  //   name: "Orchid",
  //   image: require('./plants/orchid.gif'),
  //   description: "The Orchid is particular about its environment but magnificent when it thrives. You understand your own needs deeply and create specific conditions for your own growth. Your analytical mind helps you flourish in specialized niches."
  // },
  bamboo: {
    name: "Bamboo",
    image: require('./plants/bamboo.gif'),
    description: "Bamboo is both flexible and incredibly strong. You adapt to changing circumstances while maintaining your core principles. Your measured responses and ability to bend without breaking make you resilient in any situation."
  },
  // japaneseMaple: {
  //   name: "Japanese Maple",
  //   image: require('./plants/japanese-maple.gif'),
  //   description: "The Japanese Maple transforms beautifully with the seasons. You embrace life's changing phases with grace and wisdom, finding beauty in transitions and adapting your perspective as you grow."
  // },
  // ginkgoTree: {
  //   name: "Ginkgo Tree",
  //   image: require('./plants/ginkgo-tree.gif'),
  //   description: "The ancient Ginkgo tree has survived for millennia. You draw on timeless wisdom and careful observation to navigate life. Your patience and long-term thinking set you apart in a world focused on immediate results."
  // },
  // // Nurturing/Caring plants
  // aloeVera: {
  //   name: "Aloe Vera",
  //   image: require('./plants/aloe-vera.gif'),
  //   description: "Aloe Vera offers practical healing and soothing comfort. You provide tangible support to those around you, especially in difficult times. Your practical compassion and reliable presence make you a trusted confidant."
  // },
  // lavender: {
  //   name: "Lavender",
  //   image: require('./plants/lavender.gif'),
  //   description: "Lavender creates an atmosphere of calm and healing. You naturally foster emotional safety in your relationships and help others find peace in difficult times. Your gentle presence soothes troubled hearts."
  // },
  // rosemary: {
  //   name: "Rosemary",
  //   image: require('./plants/rosemary.gif'),
  //   description: "Rosemary symbolizes remembrance and protection. You honor important memories and safeguard those you care about. Your loyal nature and protective instincts make others feel secure in your presence."
  // },
  // chamomile: {
  //   name: "Chamomile",
  //   image: require('./plants/chamomile.gif'),
  //   description: "Chamomile is gentle yet surprisingly resilient. You remain calm during crises and offer consistent support to others. Your steady presence and reliability make you someone others turn to in difficult times."
  // },
  // // Social/Expressive plants
  // sunflower: {
  //   name: "Sunflower",
  //   image: require('./plants/sunflower.gif'),
  //   description: "The Sunflower radiates warmth and optimism. You naturally lift others' spirits and help everyone see the bright side of life. Your cheerful energy and open-hearted approach draw people to you like bees to nectar."
  // },
  // cherryBlossom: {
  //   name: "Cherry Blossom",
  //   image: require('./plants/cherry-blossom.gif'),
  //   description: "Cherry Blossoms represent the beauty of fleeting moments. You create memorable experiences that others treasure long after they've passed. Your appreciation for life's simple joys makes every gathering special."
  // },
  // hibiscus: {
  //   name: "Hibiscus",
  //   image: require('./plants/hibiscus.gif'),
  //   description: "The vibrant Hibiscus makes a bold, colorful statement. You bring warmth and passion to every conversation. Your expressive nature and authenticity create deep connections with those around you."
  // },
  // // Adventurous/Bold plants
  // marigold: {
  //   name: "Marigold",
  //   image: require('./plants/marigold.gif'),
  //   description: "Marigolds are bright, hardy flowers that thrive in many environments. You face challenges with cheerful resilience and draw on social connections for support. Your adaptability and optimism make you unstoppable."
  // },
  // amaryllis: {
  //   name: "Amaryllis",
  //   image: require('./plants/amaryllis.gif'),
  //   description: "The dramatic Amaryllis commands attention with its tall stem and vibrant blooms. You approach life with confidence and bold flair. Your strength, determination, and striking presence make you naturally influential."
  // },
  // dandelion: {
  //   name: "Dandelion",
  //   image: require('./plants/dandelion.gif'),
  //   description: "The Dandelion is adaptable and spreads its influence far and wide. You fearlessly explore new territories and thrive in any environment. Your resilience and pioneering spirit make you unstoppable."
  // },
  // fireLily: {
  //   name: "Fire Lily",
  //   image: require('./plants/fire-lily.gif'),
  //   description: "The Fire Lily blooms brilliantly after forest fires, representing renewal and perseverance. You transform setbacks into opportunities for growth and emerge stronger from challenges. Your phoenix-like resilience inspires others."
  // },
  // // Artistic/Creative plants
  // bleedingHeart: {
  //   name: "Bleeding Heart",
  //   image: require('./plants/bleeding-heart.gif'),
  //   description: "The distinctive Bleeding Heart flower wears its emotions openly. You express your authentic feelings through your creative work. Your emotional vulnerability and honesty create art that resonates deeply with others."
  // },
  // birdOfParadise: {
  //   name: "Bird of Paradise",
  //   image: require('./plants/bird-of-paradise.gif'),
  //   description: "The exotic Bird of Paradise makes a dramatic statement. Your creative expression is bold, unique, and impossible to ignore. You thrive on making distinctive artistic choices that challenge conventions."
  // },
  // wisteria: {
  //   name: "Wisteria",
  //   image: require('./plants/wisteria.gif'),
  //   description: "Wisteria creates dramatic, romantic atmospheres with its cascading blooms. Your creative vision envelops others in immersive experiences. You transform spaces and hearts with your artistic sensibility."
  // },
  // poppy: {
  //   name: "Poppy",
  //   image: require('./plants/poppy.gif'),
  //   description: "The Poppy's vibrant but brief blooming represents fleeting beauty. You capture transient moments through your creative expression. Your art helps others appreciate the beauty in impermanence."
  // }
};

export default function PlantAssignmentScreen({ route, navigation }) {
  const { plantMatch } = route.params;
  const plant = plantData[plantMatch] || {
    name: "Mystery Plant",
    image: require('./plants/default-plant.gif'), // Make sure to have a default image
    description: "A rare and unique plant that matches your personality. Its special qualities will be revealed soon!"
  };

  const handleContinue = () => {
    // Navigate to account creation with the plant match
    navigation.navigate("CreateAccount", { 
      plantMatch: plantMatch
    });
  };

  return (
    <ImageBackground 
      source={pixelSkyBackground} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Your Plant Match</Text>
            
            <Text style={styles.plantName}>{plant.name}</Text>
            
            <View style={styles.imageContainer}>
              <Image 
                source={plant.image} 
                style={styles.plantImage}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{plant.description}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continue to Create Account</Text>
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
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'monospace',
    color: '#000',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
  },
  plantName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: 'monospace',
    color: '#4a2511', // Dark brown
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 0,
    textShadowColor: 'rgba(255,255,255,0.7)',
  },
  imageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 5,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    padding: 10,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 4,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'monospace',
    color: '#000',
  },
  continueButton: {
    width: '80%',
    backgroundColor: '#90EE90', // Light green
    borderWidth: 5,
    borderColor: '#B87333', // Copper/lighter brown
    borderStyle: 'solid',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 2, 
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    marginBottom: 30,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});