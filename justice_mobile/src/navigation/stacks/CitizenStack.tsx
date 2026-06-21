import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CitizenStackParamList } from '../../types/navigation';

// --- 👨‍👩‍👧‍👦 Écrans Métier Citoyen ---
import CitizenHomeScreen from '../../screens/citizen/CitizenHomeScreen';
import CitizenCreateComplaintScreen from '../../screens/citizen/CitizenCreateComplaintScreen'; // Note: Vérifiez si vous l'avez renommé ou non
import CitizenMyComplaintsScreen from '../../screens/citizen/CitizenMyComplaintsScreen';
import CitizenComplaintDetailsScreen from '../../screens/citizen/CitizenComplaintDetailsScreen'; // Souvent partagé
import CitizenTrackingScreen from '../../screens/citizen/CitizenTrackingScreen';
import CitizenCasesScreen from '../../screens/citizen/CitizenCasesScreen'; // Assurez-vous que ce fichier existe
import CitizenEditComplaintScreen from '../../screens/citizen/CitizenEditComplaintScreen';
import CitizenCriminalRecordScreen from '../../screens/citizen/CitizenCriminalRecordScreen';
import CitizenDirectoryScreen from '../../screens/citizen/CitizenDirectoryScreen';
import StationMapScreen from '../../screens/citizen/StationMapScreen';
import MyDownloadsScreen from '../../screens/citizen/MyDownloadsScreen';
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
// --- ✅ NOUVEAUX MODULES (Guide & Scanner) ---
import CitizenLegalGuideScreen from '../../screens/citizen/CitizenLegalGuideScreen'; // 📖 Guide Juridique
import VerificationScannerScreen from '../../screens/shared/VerificationScannerScreen'; // 🔍 Scanner (Chemin corrigé)
// --- 🌍 Écrans PARTAGÉS (Système & Support) ---
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import NationalMapScreen from '../../screens/admin/NationalMapScreen';
import AdminNotificationsScreen from '../../screens/admin/AdminNotificationsScreen';
import UserGuideScreen from '../../screens/shared/UserGuideScreen';
import SupportScreen from '../../screens/shared/SupportScreen';
import AboutScreen from '../../screens/shared/AboutScreen';
const Stack = createNativeStackNavigator<CitizenStackParamList>();
export default function CitizenStack() {
  return (
    <Stack.Navigator 
      initialRouteName="CitizenHome" 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {/* ==========================================
          🏠 ACCUEIL & SERVICES CITOYENS
      ========================================== */}
      <Stack.Screen name="CitizenHome" component={CitizenHomeScreen} />
      <Stack.Screen name="CitizenDirectory" component={CitizenDirectoryScreen} />
      <Stack.Screen name="StationMapScreen" component={StationMapScreen} />
          📖 GUIDE JURIDIQUE & DROITS (Nouveau)
      <Stack.Screen name="CitizenLegalGuide" component={CitizenLegalGuideScreen} />
          ✅ OUTILS (Vérification Document)
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen} />
          📝 GESTION DES PLAINTES
      <Stack.Screen name="CitizenCreateComplaint" component={CitizenCreateComplaintScreen} />
      <Stack.Screen name="CitizenMyComplaints" component={CitizenMyComplaintsScreen} />
      {/* Utilisation de 'as any' pour compatibilité des types partagés */}
      <Stack.Screen name="CitizenComplaintDetails" component={CitizenComplaintDetailsScreen as any} />
      <Stack.Screen name="CitizenEditComplaint" component={CitizenEditComplaintScreen as any} />
          ⚖️ SUIVI JUDICIAIRE & ADMINISTRATIF
      <Stack.Screen name="CitizenTracking" component={CitizenTrackingScreen} />
      <Stack.Screen name="CitizenCases" component={CitizenCasesScreen as any} />
      <Stack.Screen name="CitizenCriminalRecord" component={CitizenCriminalRecordScreen} />
      <Stack.Screen name="MyDownloads" component={MyDownloadsScreen} />
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
      <Stack.Screen name="LegalChatbot" component={LegalChatbotScreen} />
    </Stack.Navigator>
  );
}
