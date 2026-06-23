import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  StatusBar
} from "react-native";
import { Button, Text, TextInput, Title, Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";

// Services
import { register } from "../../services/auth.service";

// Composants & Thème
import ScreenContainer from "../../components/layout/ScreenContainer";
import { useAppTheme } from "../../theme/AppThemeProvider";

const { height } = Dimensions.get("window");

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useAppTheme();

  // Ajout de confirmPassword dans l'état initial
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    telephone: "", 
    password: "",
    confirmPassword: "",
    consent: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (key: keyof typeof form, value: string) => 
    setForm({ ...form, [key]: value });

  // 🔄 Gestion de l'inscription via React Query
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (userData: any) => register(userData),
    onSuccess: () => {
      const successTitle = "Inscription Réussie ✅";
      const successMsg = "Votre compte a été créé avec succès. Veuillez vous connecter pour accéder à la plateforme.";

      if (Platform.OS === 'web') {
        window.alert(`${successTitle}\n\n${successMsg}`);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        Alert.alert(
          successTitle, 
          successMsg,
          [
            { 
              text: "SE CONNECTER", 
              onPress: () => {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              } 
            }
          ],
          { cancelable: false }
        );
      }
    },
    onError: (err: any) => {
      const serverMessage = err?.response?.data?.message || "";
      let message = "Impossible de créer le compte. Vérifiez votre connexion.";
      
      if (serverMessage.toLowerCase().includes('email')) message = "Cette adresse email est déjà utilisée.";
      if (serverMessage.toLowerCase().includes('telephone')) message = "Ce numéro de téléphone est déjà associé à un compte.";

      Platform.OS === 'web' ? window.alert(message) : Alert.alert("Échec inscription", message);
    }
  });

  const handleRegister = async () => {
    // 1. Validation de remplissage
    if (!form.consent) {
        const msg = "Vous devez accepter la politique de confidentialité pour vous inscrire.";
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Consentement requis", msg);
        return;
    }
    if (!form.firstname.trim() || !form.lastname.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
        const msg = "Veuillez remplir tous les champs obligatoires.";
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Champs requis", msg);
        return;
    }

    // 2. Validation de correspondance
    if (form.password !== form.confirmPassword) {
        const msg = "Les mots de passe ne sont pas identiques.";
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Erreur de saisie", msg);
        return;
    }

    // 3. Préparation des données à envoyer
    const dataToSend = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
        phone: form.telephone.trim(),
        password: form.password,
        role: "CITOYEN" // Assure-toi d'envoyer un rôle par défaut si ton API l'exige
    };

    // 4. Envoi au service
    await mutateAsync(dataToSend);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          
          <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.brandContent}>
                <Surface style={styles.logoSurface}>
                   <Image source={require("../../../assets/armoirie.png")} style={styles.logoImage} resizeMode="contain" />
                </Surface>
                <Title style={styles.headerTitle}>Inscription</Title>
                <Text style={styles.headerSubtitle}>ESPACE CITOYEN SÉCURISÉ</Text>
              </View>
          </View>

          <View style={[
            styles.formContainer, 
            { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32 }
          ]}>
             <View style={styles.formContent}>
                
                <View style={styles.inputRow}>
                   <TextInput
                      label="Prénom"
                      value={form.firstname}
                      onChangeText={(v) => onChange("firstname", v)}
                      style={[styles.inputHalf, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                      mode="outlined"
                      outlineColor="transparent"
                      activeOutlineColor={theme.colors.primary}
                      theme={{ roundness: 14 }}
                   />
                   <View style={{ width: 12 }} />
                   <TextInput
                      label="Nom"
                      value={form.lastname}
                      onChangeText={(v) => onChange("lastname", v)}
                      style={[styles.inputHalf, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                      mode="outlined"
                      outlineColor="transparent"
                      activeOutlineColor={theme.colors.primary}
                      theme={{ roundness: 14 }}
                   />
                </View>

                <TextInput
                   label="Email"
                   value={form.email}
                   onChangeText={(v) => onChange("email", v)}
                   style={[styles.input, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                   mode="outlined"
                   autoCapitalize="none"
                   keyboardType="email-address"
                   outlineColor="transparent"
                   activeOutlineColor={theme.colors.primary}
                   left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
                   theme={{ roundness: 14 }}
                />

                <TextInput
                   label="Numéro de téléphone"
                   value={form.telephone}
                   onChangeText={(v) => onChange("telephone", v)}
                   style={[styles.input, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                   mode="outlined"
                   keyboardType="phone-pad"
                   placeholder="Ex: 90000000"
                   outlineColor="transparent"
                   activeOutlineColor={theme.colors.primary}
                   left={<TextInput.Icon icon="phone-outline" color={theme.colors.primary} />}
                   theme={{ roundness: 14 }}
                />

                {/* CHAMP : Mot de passe original */}
                <TextInput
                   label="Mot de passe"
                   value={form.password}
                   onChangeText={(v) => onChange("password", v)}
                   style={[styles.input, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                   mode="outlined"
                   secureTextEntry={!showPassword}
                   outlineColor="transparent"
                   activeOutlineColor={theme.colors.primary}
                   left={<TextInput.Icon icon="lock-outline" color={theme.colors.primary} />}
                   right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} color="#64748B" />}
                   theme={{ roundness: 14 }}
                />

                {/* NOUVEAU CHAMP : Confirmation du mot de passe */}
                <TextInput
                   label="Confirmer le mot de passe"
                   value={form.confirmPassword}
                   onChangeText={(v) => onChange("confirmPassword", v)}
                   style={[styles.input, { backgroundColor: isDark ? "#2C2C2C" : "#F8FAFC" }]}
                   mode="outlined"
                   secureTextEntry={!showConfirmPassword}
                   outlineColor="transparent"
                   activeOutlineColor={theme.colors.primary}
                   left={<TextInput.Icon icon="shield-check-outline" color={theme.colors.primary} />}
                   right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} color="#64748B" />}
                   theme={{ roundness: 14 }}
                />

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}
                  onPress={() => setForm(f => ({ ...f, consent: !f.consent }))}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: form.consent ? theme.colors.primary : '#94A3B8', backgroundColor: form.consent ? theme.colors.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                    {form.consent && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: (theme.colors as any).textSecondary || '#64748B', lineHeight: 18 }}>
                    J'accepte la{' '}
                    <Text style={{ color: theme.colors.primary, fontWeight: '700', textDecorationLine: 'underline' }} onPress={() => (navigation as any).navigate?.('PrivacyPolicy')}>
                      politique de confidentialité
                    </Text>
                    {' '}et les conditions d'utilisation (Loi n°2017-28 Niger)
                  </Text>
                </TouchableOpacity>

                <Button
                   mode="contained"
                   onPress={handleRegister}
                   style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                   contentStyle={{ height: 54 }}
                   labelStyle={{ fontSize: 16, fontWeight: "bold" }}
                   loading={isPending}
                   disabled={isPending}
                >
                   {isPending ? "Création en cours..." : "S'INSCRIRE MAINTENANT"}
                </Button>

                <View style={styles.footerLinks}>
                   <Text style={{ color: (theme.colors as any).textSecondary || '#64748B' }}>Déjà inscrit ? </Text>
                   <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                      <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>Se connecter</Text>
                   </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} /> 
             </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: height * 0.35,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  brandContent: {
    alignItems: "center",
    marginTop: -20,
  },
  logoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 2,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    paddingTop: 40,
    paddingHorizontal: 25,
  },
  formContent: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputHalf: {
    flex: 1,
  },
  input: {
    marginBottom: 14,
  },
  submitButton: {
    marginTop: 15,
    borderRadius: 16,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    alignItems: "center",
  },
});