import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { useAuthStore } from "../../stores/useAuthStore";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { searchLocalKB, SUGGESTED_QUESTIONS, LegalEntry } from "../../data/legalChatbot";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  articles?: string;
  referTo?: string;
  timestamp: Date;
}

const WELCOME_MSG: Message = {
  id: "welcome",
  text: "Bienvenue sur l'Assistant Juridique e-Justice Niger.\n\nJe peux vous renseigner sur vos droits, les peines encourues, les procédures et où vous référer.\n\nPosez votre question ou choisissez un sujet ci-dessous.",
  sender: "bot",
  timestamp: new Date(),
};

export default function LegalChatbotScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F1F5F9",
    bgUser: primaryColor,
    bgBot: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
    legalBg: isDark ? "#1a1a2e" : "#EFF6FF",
    legalBorder: isDark ? "#1E40AF" : "#BFDBFE",
    referBg: isDark ? "#064E3B" : "#F0FDF4",
    referBorder: isDark ? "#10B981" : "#A7F3D0",
  };

  const addMessage = (text: string, sender: "user" | "bot", articles?: string, referTo?: string) => {
    const msg: Message = { id: Date.now().toString() + sender, text, sender, articles, referTo, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query) return;

    addMessage(query, "user");
    setInput("");
    setShowSuggestions(false);
    setLoading(true);

    setTimeout(() => {
      const match = searchLocalKB(query);

      if (match) {
        addMessage(match.answer, "bot", match.articles, match.referTo);
      } else {
        addMessage(
          "Je n'ai pas trouvé de réponse précise à votre question dans ma base juridique.\n\n" +
          "Je vous recommande de :\n" +
          "• Reformuler votre question avec des termes plus simples\n" +
          "• Consulter un avocat au Barreau de Niamey\n" +
          "• Vous rendre au greffe du tribunal le plus proche\n" +
          "• Appeler le commissariat (17) en cas d'urgence",
          "bot",
          undefined,
          "Barreau de Niamey / Greffe du Tribunal / Police (17)"
        );
      }
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.msgRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: primaryColor + "20" }]}>
            <Ionicons name="scale-outline" size={18} color={primaryColor} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.bgUser, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.bgBot, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border }
        ]}>
          <Text style={[styles.msgText, { color: isUser ? "#FFF" : colors.textMain }]}>
            {item.text}
          </Text>

          {item.articles && (
            <View style={[styles.legalTag, { backgroundColor: colors.legalBg, borderColor: colors.legalBorder }]}>
              <Ionicons name="book-outline" size={14} color={isDark ? "#93C5FD" : "#1E40AF"} />
              <Text style={[styles.legalText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>{item.articles}</Text>
            </View>
          )}

          {item.referTo && (
            <View style={[styles.referTag, { backgroundColor: colors.referBg, borderColor: colors.referBorder }]}>
              <Ionicons name="location-outline" size={14} color={isDark ? "#6EE7B7" : "#065F46"} />
              <Text style={[styles.referText, { color: isDark ? "#6EE7B7" : "#065F46" }]}>📍 {item.referTo}</Text>
            </View>
          )}

          <Text style={[styles.timeText, { color: isUser ? "rgba(255,255,255,0.6)" : colors.textSub }]}>
            {item.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Assistant Juridique" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bgMain }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <>
              {loading && (
                <View style={[styles.msgRow, { justifyContent: "flex-start" }]}>
                  <View style={[styles.avatar, { backgroundColor: primaryColor + "20" }]}>
                    <Ionicons name="scale-outline" size={18} color={primaryColor} />
                  </View>
                  <View style={[styles.bubble, { backgroundColor: colors.bgBot, borderWidth: 1, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={primaryColor} />
                    <Text style={[styles.typingText, { color: colors.textSub }]}>Recherche en cours...</Text>
                  </View>
                </View>
              )}
              {showSuggestions && (
                <View style={styles.suggestions}>
                  <Text style={[styles.sugTitle, { color: colors.textSub }]}>QUESTIONS FRÉQUENTES</Text>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.sugBtn, { backgroundColor: colors.bgBot, borderColor: colors.border }]}
                      onPress={() => handleSend(q)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={primaryColor} />
                      <Text style={[styles.sugText, { color: colors.textMain }]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ height: 80 }} />
            </>
          }
        />

        {/* BARRE DE SAISIE */}
        <View style={[styles.inputBar, { backgroundColor: colors.inputBg, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textMain, backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderColor: colors.border }]}
            placeholder="Posez votre question juridique..."
            placeholderTextColor={colors.textSub}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: primaryColor, opacity: input.trim() ? 1 : 0.5 }]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chatContent: { padding: 16, paddingBottom: 0 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  bubble: { maxWidth: "78%", padding: 14, borderRadius: 18 },
  msgText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  legalTag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 8, borderRadius: 8, borderWidth: 1 },
  legalText: { fontSize: 11, fontWeight: "700" },
  referTag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  referText: { fontSize: 11, fontWeight: "600" },
  timeText: { fontSize: 10, marginTop: 6, textAlign: "right" },
  typingText: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  suggestions: { padding: 8, gap: 8 },
  sugTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 4 },
  sugBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  sugText: { fontSize: 13, fontWeight: "600", flex: 1 },
  inputBar: { flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1, alignItems: "flex-end" },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === "web" ? 12 : 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});
