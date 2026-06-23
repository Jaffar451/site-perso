import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

const Section = ({ title, icon, children, colors }: any) => (
  <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{title}</Text>
    </View>
    <Text style={[styles.sectionBody, { color: colors.textSub }]}>{children}</Text>
  </View>
);

export default function PrivacyPolicyScreen() {
  const { theme, isDark } = useAppTheme();
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#475569",
    border: isDark ? "#334155" : "#E2E8F0",
    primary: theme.colors.primary,
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Politique de Confidentialité" showBack />
      <ScrollView style={{ backgroundColor: colors.bgMain }} contentContainerStyle={styles.scroll}>

        <View style={[styles.headerBox, { backgroundColor: isDark ? "#1a1a2e" : "#EFF6FF", borderColor: isDark ? "#1E40AF" : "#BFDBFE" }]}>
          <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
          <Text style={[styles.headerText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
            Conformément à la Loi n°2017-28 du Niger relative à la protection des données à caractère personnel et au RGPD.
          </Text>
        </View>

        <Section title="1. Responsable du traitement" icon="business-outline" colors={colors}>
          {`Le responsable du traitement des données est le Ministère de la Justice de la République du Niger, à travers le Système d'Information Judiciaire (SIJ / e-Justice Niger).

Adresse : Boulevard de la République, Niamey, Niger
Contact : support@justice.ne`}
        </Section>

        <Section title="2. Données collectées" icon="document-text-outline" colors={colors}>
          {`L'application collecte les données suivantes :
• Identité : nom, prénom, date de naissance, nationalité, numéro CIN
• Contact : email, téléphone, adresse
• Professionnelles : matricule, rôle, affectation
• Judiciaires : plaintes déposées, dossiers traités, procès-verbaux
• Techniques : logs de connexion, adresse IP, horodatage des actions
• Localisation : uniquement avec votre consentement (GPS pour géolocalisation)`}
        </Section>

        <Section title="3. Finalités du traitement" icon="list-outline" colors={colors}>
          {`Vos données sont traitées pour :
• La gestion du système judiciaire national (dépôt et suivi de plaintes)
• L'identification des agents et des justiciables
• La traçabilité des actes judiciaires (audit)
• L'établissement de statistiques anonymisées
• La sécurité du système (prévention des accès non autorisés)
• L'envoi de notifications relatives à vos dossiers`}
        </Section>

        <Section title="4. Base légale" icon="book-outline" colors={colors}>
          {`Le traitement repose sur :
• L'intérêt public (Art. 6.1.e RGPD) : mission de service public de la justice
• La Loi n°2017-28 du Niger : protection des données personnelles
• Le Code de Procédure Pénale du Niger : obligations légales de traçabilité
• Votre consentement pour les traitements non obligatoires (notifications, géolocalisation)`}
        </Section>

        <Section title="5. Durée de conservation" icon="time-outline" colors={colors}>
          {`• Comptes utilisateurs : conservés pendant la durée d'activité + 5 ans après désactivation
• Plaintes et dossiers judiciaires : conservés conformément aux délais de prescription légaux (1 à 10 ans selon la nature)
• Logs d'audit : 90 jours (purge automatique)
• Données de session : supprimées à la déconnexion (web) ou après 7 jours (mobile)`}
        </Section>

        <Section title="6. Vos droits (Loi n°2017-28)" icon="person-outline" colors={colors}>
          {`Conformément à la loi nigérienne, vous disposez des droits suivants :
• Droit d'accès : consulter vos données personnelles (Profil > Mes données)
• Droit de rectification : modifier vos informations (Profil > Modifier)
• Droit à l'effacement : demander la suppression de votre compte (Paramètres > Supprimer mon compte)
• Droit à la portabilité : exporter vos données (Paramètres > Exporter mes données)
• Droit d'opposition : refuser certains traitements non essentiels
• Droit de retrait du consentement : à tout moment, sans effet rétroactif

Pour exercer ces droits, contactez : dpo@justice.ne`}
        </Section>

        <Section title="7. Sécurité des données" icon="lock-closed-outline" colors={colors}>
          {`Vos données sont protégées par :
• Chiffrement AES-256-GCM pour les données sensibles
• Hachage bcrypt (12 rounds) pour les mots de passe
• Tokens JWT avec expiration (24h accès, 7j rafraîchissement)
• Cookies httpOnly sécurisés sur le web
• CORS restreint aux origines autorisées
• Rate limiting (protection anti-brute force)
• Journalisation des accès (audit trail)
• Connexion SSL/TLS pour toutes les communications`}
        </Section>

        <Section title="8. Transferts de données" icon="globe-outline" colors={colors}>
          {`Les données sont hébergées sur des serveurs sécurisés (Neon PostgreSQL, Render). Aucun transfert vers des pays tiers ne s'effectue sans garanties adéquates. Les sous-traitants techniques respectent le RGPD.`}
        </Section>

        <Section title="9. Cookies" icon="cafe-outline" colors={colors}>
          {`L'application web utilise des cookies strictement nécessaires au fonctionnement :
• Cookie d'authentification (httpOnly, sécurisé)
• Cookie de session (durée : session uniquement)
Aucun cookie de tracking ou publicitaire n'est utilisé.`}
        </Section>

        <Section title="10. Modification de cette politique" icon="create-outline" colors={colors}>
          {`Cette politique peut être mise à jour. La date de dernière modification est indiquée ci-dessous. En cas de modification substantielle, vous serez informé via l'application.

Dernière mise à jour : 22 juin 2026
Version : 1.0`}
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  headerBox: { flexDirection: "row", padding: 14, borderRadius: 14, borderLeftWidth: 4, marginBottom: 16, gap: 12, alignItems: "center", borderWidth: 1 },
  headerText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 18 },
  section: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  sectionBody: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
});
