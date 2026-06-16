import React, { useEffect, useRef } from "react";
import { 
  View, 
  Animated, 
  StyleSheet, 
  Image, 
  StatusBar,
  Platform,
  ActivityIndicator
} from "react-native";
import { Text } from "react-native-paper";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { AuthScreenProps } from "../../types/navigation";

export default function SplashScreen({ navigation }: AuthScreenProps<'Splash'>) {
  const { theme } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        navigation.replace("Login");
      }
      // Si isAuthenticated === true, AppNavigator bascule automatiquement
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      
      <Animated.View style={[
        styles.content, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require("../../../assets/armoirie.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>e-Justice Niger</Text>
        <Text style={styles.subtitle}>Plateforme Judiciaire Intégrée</Text>
        <View style={styles.line} />
        <Text style={styles.motto}>FRATERNITÉ • TRAVAIL • PROGRÈS</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator animating={true} color="#FFF" size="small" />
        <Text style={styles.loadingText}>Vérification des habilitations...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#FFF",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
      }
    })
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
  },
  line: {
    width: 40,
    height: 3,
    backgroundColor: "#EAB308",
    marginVertical: 20,
    borderRadius: 2,
  },
  motto: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 15,
    fontWeight: "700",
  },
});