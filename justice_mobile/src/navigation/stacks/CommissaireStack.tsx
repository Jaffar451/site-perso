import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommissaireStackParamList } from '../../types/navigation';

// --- 👮‍♂️ Écrans Métier Commissaire ---
import CommissaireDashboard from '../../screens/commissaire/CommissaireDashboard';
import CommissaireReviewScreen from '../../screens/commissaire/CommissaireReviewScreen';
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
import CommissaireActionDetail from '../../screens/commissaire/CommissaireActionDetail';
import CommissaireVisaList from '../../screens/commissaire/CommissaireVisaList';
import CommissaireGAVSupervisionScreen from '../../screens/commissaire/CommissaireGAVSupervisionScreen';
import CommissaireRegistryScreen from '../../screens/commissaire/CommissaireRegistryScreen';
import CommissaireCommandCenter from '../../screens/commissaire/CommissaireCommandCenter';
import PoliceComplaintsScreen from '@/screens/police/PoliceComplaintsScreen';
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
const Stack = createNativeStackNavigator<CommissaireStackParamList>();
export default function CommissaireStack() {
  return (
    <Stack.Navigator 
      initialRouteName="CommissaireDashboard" 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {/* ==========================================
          👮‍♂️ PILOTAGE & COMMANDEMENT
      ========================================== */}
      <Stack.Screen name="CommissaireDashboard" component={CommissaireDashboard} />
      <Stack.Screen name="CommissaireCommandCenter" component={CommissaireCommandCenter} />
      <Stack.Screen name="NationalMap" component={NationalMapScreen} />
      
          ✅ OUTILS DE CONTRÔLE (Nouveaux)
      {/* Scanner pour vérifier les pièces et identités */}
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
      {/* Rapport d'activité de l'Unité (Lundi) */}
      <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
          ✅ VALIDATION & VISAS (OPJ)
      <Stack.Screen name="CommissaireVisaList" component={CommissaireVisaList} />
      <Stack.Screen name="CommissaireReview" component={CommissaireReviewScreen} />
      <Stack.Screen name="CommissaireActionDetail" component={CommissaireActionDetail} />
          🔒 SUPERVISION GAV & REGISTRES
      <Stack.Screen name="CommissaireGAVSupervision" component={CommissaireGAVSupervisionScreen} />
      <Stack.Screen name="CommissaireRegistry" component={CommissaireRegistryScreen} />
          👤 COMPTE & SYSTÈME
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />
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
