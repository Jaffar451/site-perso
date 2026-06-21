import React from "react";
import { TouchableOpacity, StyleSheet, Platform, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../theme/AppThemeProvider";

export default function ChatbotFAB() {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: isDark ? "#4C1D95" : "#7C3AED" }]}
      activeOpacity={0.85}
      onPress={() => {
        try { navigation.navigate("LegalChatbot"); }
        catch { console.warn("LegalChatbot screen not found"); }
      }}
    >
      <Ionicons name="chatbubbles" size={26} color="#FFF" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>?</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 85,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
