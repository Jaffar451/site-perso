import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PoliceStackParamList } from '../../types/navigation';

// --- 👮 Écrans Spécifiques Police (Le Terrain) ---
import PoliceHomeScreen from '../../screens/police/PoliceHomeScreen';
import PoliceComplaintsScreen from '../../screens/police/PoliceComplaintsScreen';
import PoliceComplaintDetailsScreen from '../../screens/police/PoliceComplaintDetailsScreen';
import PoliceCasesScreen from '../../screens/police/PoliceCasesScreen';
import PoliceCustodyScreen from '../../screens/police/PoliceCustodyScreen';
import PoliceCustodyExtensionScreen from '../../screens/police/PoliceCustodyExtensionScreen';
import PolicePVScreen from '../../screens/police/PolicePVScreen';
import CreateSummonScreen from '../../screens/police/CreateSummonScreen';
import PoliceArrestWarrantScreen from '../../screens/police/PoliceArrestWarrantScreen';
import PoliceSearchWarrantScreen from '../../screens/police/PoliceSearchWarrantScreen';
import PoliceInterrogationScreen from '../../screens/police/PoliceInterrogationScreen';
import PoliceDetentionScreen from '../../screens/police/PoliceDetentionScreen';
import WarrantSearchScreen from '../../screens/police/WarrantSearchScreen';
import SosDetailScreen from '../../screens/police/SosDetailScreen';
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
// --- ✅ NOUVEAUX ÉCRANS PARTAGÉS (Scanner & Rapport) ---
import VerificationScannerScreen from '../../screens/shared/VerificationScannerScreen';
import WeeklyReportScreen from '../../screens/shared/WeeklyReportScreen';
// --- 🌍 Écrans PARTAGÉS (Système & Support MJ) ---
import NationalMapScreen from '../../screens/admin/NationalMapScreen';
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import AdminNotificationsScreen from '../../screens/admin/AdminNotificationsScreen';
import MyDownloadsScreen from '../../screens/citizen/MyDownloadsScreen';
import UserGuideScreen from '../../screens/shared/UserGuideScreen';
import SupportScreen from '../../screens/shared/SupportScreen';
import AboutScreen from '../../screens/shared/AboutScreen';
// ✅ Création du Stack avec le type strict (incluant les routes partagées)
const Stack = createNativeStackNavigator<PoliceStackParamList>();
export default function PoliceStack() {
  return (
    <Stack.Navigator 
      initialRouteName="PoliceHome"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right' // Animation fluide pour le terrain
      }}
    >
      {/* ==========================================
          🏠 UNITÉ DE RÉPONSE RAPIDE (SOS)
      ========================================== */}
      <Stack.Screen name="PoliceHome" component={PoliceHomeScreen} />
      <Stack.Screen name="NationalMap" component={NationalMapScreen} /> 
      <Stack.Screen name="SosDetail" component={SosDetailScreen} />
          ✅ OUTILS DE TERRAIN (Nouveaux)
      {/* Scanner pour vérifier les documents sur le terrain */}
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
      {/* Rapport d'activité hebdomadaire */}
      <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
          📁 BUREAU DES ENQUÊTES ET PLAINTES
      <Stack.Screen name="PoliceComplaints" component={PoliceComplaintsScreen} />
      <Stack.Screen name="PoliceComplaintDetails" component={PoliceComplaintDetailsScreen} />
      <Stack.Screen name="PoliceCases" component={PoliceCasesScreen} />
      
          📝 PROCÉDURES OPJ (Actes & Auditions)
      <Stack.Screen name="PolicePVScreen" component={PolicePVScreen} />
      <Stack.Screen name="PoliceInterrogation" component={PoliceInterrogationScreen} />
      <Stack.Screen name="CreateSummon" component={CreateSummonScreen} />
          🔒 DÉTENTION & GARDE À VUE (GAV)
      <Stack.Screen name="PoliceCustody" component={PoliceCustodyScreen} />
      <Stack.Screen name="PoliceCustodyExtension" component={PoliceCustodyExtensionScreen} />
      <Stack.Screen name="PoliceDetention" component={PoliceDetentionScreen} />
          ⚖️ RECHERCHES ET MANDATS JUDICIAIRES
      <Stack.Screen name="PoliceArrestWarrant" component={PoliceArrestWarrantScreen} />
      <Stack.Screen name="PoliceSearchWarrant" component={PoliceSearchWarrantScreen} />
      {/* Le nom 'WarrantSearch' correspond à celui défini dans navigation.ts */}
      <Stack.Screen name={"WarrantSearch" as any} component={WarrantSearchScreen} />
          👤 ADMINISTRATION & NOTIFICATIONS
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} /> 
      <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />
          ℹ️ ASSISTANCE & CENTRE DE TÉLÉCHARGEMENT
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      {/* Alias pour HelpCenter vers UserGuide si pas d'écran dédié */}
      <Stack.Screen name="HelpCenter" component={UserGuideScreen} /> 
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="MyDownloads" component={MyDownloadsScreen} />
      <Stack.Screen name="LegalChatbot" component={LegalChatbotScreen} />
    </Stack.Navigator>
  );
}
