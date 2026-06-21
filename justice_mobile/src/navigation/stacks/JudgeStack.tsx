import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JudgeStackParamList } from '../../types/navigation';

// --- 👨‍⚖️ Écrans Métier Juge ---
import JudgeHomeScreen from '../../screens/judge/JudgeHomeScreen';
import JudgeCasesScreen from '../../screens/judge/JudgeCasesScreen';
import JudgeCaseDetailScreen from '../../screens/judge/JudgeCaseDetailScreen';
import CreateDecisionScreen from '../../screens/judge/CreateDecisionScreen';
import IssueArrestWarrantScreen from '../../screens/judge/IssueArrestWarrantScreen';
import JudgeConfiscationScreen from '../../screens/judge/JudgeConfiscationScreen';
import JudgePreventiveDetentionScreen from '../../screens/judge/JudgePreventiveDetentionScreen';
import JudgeReparationScreen from '../../screens/judge/JudgeReparationScreen';
import JudgeVerdictScreen from '../../screens/judge/JudgeVerdictScreen';
import JudgeAppealScreen from '../../screens/judge/JudgeAppealScreen';
import JudgeHearingScreen from '../../screens/judge/JudgeHearingScreen';
import JudgeDecisionsScreen from '../../screens/judge/JudgeDecisionsScreen';
import JudgeSentenceScreen from '../../screens/judge/JudgeSentenceScreen';
import JudgeProsecutionScreen from '../../screens/judge/JudgeProsecutionScreen';
import JudgeReleaseScreen from '../../screens/judge/JudgeReleaseScreen';
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
// --- ✅ NOUVEAUX ÉCRANS PARTAGÉS (Scanner & Rapport) ---
import VerificationScannerScreen from '../../screens/shared/VerificationScannerScreen';
import WeeklyReportScreen from '../../screens/shared/WeeklyReportScreen';
// --- 🌍 Écrans PARTAGÉS (Système & Support) ---
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import NationalMapScreen from '../../screens/admin/NationalMapScreen';
import AdminNotificationsScreen from '../../screens/admin/AdminNotificationsScreen';
import UserGuideScreen from '../../screens/shared/UserGuideScreen';
import SupportScreen from '../../screens/shared/SupportScreen';
import AboutScreen from '../../screens/shared/AboutScreen';
import MyDownloadsScreen from '../../screens/citizen/MyDownloadsScreen';
// 🚧 PLACEHOLDER
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Écran {route.name}</Text>
    <Text style={{ color: 'gray' }}>En cours de développement</Text>
  </View>
);
const Stack = createNativeStackNavigator<JudgeStackParamList>();
export default function JudgeStack() {
  return (
    <Stack.Navigator 
      initialRouteName="JudgeHome" 
      screenOptions={{ headerShown: false }}
    >
      {/* ==========================================
          🏠 ACCUEIL & DOSSIERS
      ========================================== */}
      <Stack.Screen name="JudgeHome" component={JudgeHomeScreen} />
      <Stack.Screen name="JudgeCases" component={JudgeCasesScreen} />
      {/* Alias pour compatibilité */}
      <Stack.Screen name="JudgeCaseList" component={JudgeCasesScreen as any} />
      
      <Stack.Screen name="JudgeCaseDetails" component={JudgeCaseDetailScreen as any} />
      <Stack.Screen name="CaseDetail" component={JudgeCaseDetailScreen as any} />
          ✅ OUTILS DE CONTRÔLE (Nouveaux)
      {/* Scanner pour vérifier les preuves/pièces */}
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
      {/* Statistiques d'audience (Lundi) */}
      <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
          ⚖️ DÉCISIONS & JUGEMENTS
      <Stack.Screen name="CreateDecision" component={CreateDecisionScreen} />
      <Stack.Screen name="JudgeVerdict" component={JudgeVerdictScreen} />
      <Stack.Screen name="JudgeSentence" component={JudgeSentenceScreen} />
      <Stack.Screen name="JudgeDecisions" component={JudgeDecisionsScreen} />
          📜 ACTES & PROCÉDURES
      <Stack.Screen name="IssueArrestWarrant" component={IssueArrestWarrantScreen} />
      <Stack.Screen name="JudgePreventiveDetention" component={JudgePreventiveDetentionScreen} />
      <Stack.Screen name="JudgeConfiscation" component={JudgeConfiscationScreen} />
      <Stack.Screen name="JudgeReparation" component={JudgeReparationScreen} />
      <Stack.Screen name="JudgeAppeal" component={JudgeAppealScreen} />
      <Stack.Screen name="JudgeProsecution" component={JudgeProsecutionScreen} /> 
      <Stack.Screen name="JudgeRelease" component={JudgeReleaseScreen} />
      <Stack.Screen name="JudgeInterrogation" component={PlaceholderScreen} />
          🗓️ CALENDRIER
      <Stack.Screen name="JudgeHearing" component={JudgeHearingScreen} />
      <Stack.Screen name="JudgeCalendar" component={JudgeHearingScreen as any} />
          👤 COMPTE & SYSTÈME
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />
      <Stack.Screen name="NationalMap" component={NationalMapScreen} />
          ℹ️ AIDE & RESSOURCES
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      <Stack.Screen name="HelpCenter" component={UserGuideScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="MyDownloads" component={MyDownloadsScreen} />
      <Stack.Screen name="LegalChatbot" component={LegalChatbotScreen} />
    </Stack.Navigator>
  );
}
