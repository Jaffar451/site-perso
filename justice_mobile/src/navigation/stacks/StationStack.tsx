import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../types/navigation';

// --- 🏢 Écrans Admin / Unités (Logistique) ---
import ManageStationsScreen from '../../screens/admin/ManageStationsScreen';
import NationalMapScreen from '../../screens/admin/NationalMapScreen';
import AdminUsersScreen from '../../screens/admin/AdminUsersScreen';
import AdminStatsScreen from '../../screens/admin/AdminStatsScreen';
import AdminNotificationsScreen from '../../screens/admin/AdminNotificationsScreen';
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
// --- ✅ NOUVEAUX ÉCRANS PARTAGÉS (Scanner & Rapport) ---
import VerificationScannerScreen from '../../screens/shared/VerificationScannerScreen';
import WeeklyReportScreen from '../../screens/shared/WeeklyReportScreen';
// --- 🌍 Écrans Communs & Support ---
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import AboutScreen from '../../screens/shared/AboutScreen';
// --- 🚨 Écrans Transversaux (Police/Urgence) ---
import SosDetailScreen from '../../screens/police/SosDetailScreen';
import WarrantSearchScreen from '../../screens/police/WarrantSearchScreen';
// --- ℹ️ Support ---
import MyDownloadsScreen from '../../screens/citizen/MyDownloadsScreen';
import UserGuideScreen from '../../screens/shared/UserGuideScreen';
import SupportScreen from '../../screens/shared/SupportScreen';
// ✅ CORRECTION TYPAGE : Création d'un type local hybride
type StationStackParams = AdminStackParamList & {
  WarrantSearch: undefined;
  SosDetail: { alert: any };
  VerificationScanner: undefined; // Ajouté
  WeeklyReport: undefined;        // Ajouté
};
const Stack = createNativeStackNavigator<StationStackParams>();
export const StationStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right'
    }}
    initialRouteName="ManageStations"
  >
    {/* ==========================================
        🏢 GESTION DU TERRITOIRE & UNITÉS
    ========================================== */}
    <Stack.Screen name="ManageStations" component={ManageStationsScreen} />
    <Stack.Screen name="NationalMap" component={NationalMapScreen} />
        ✅ OUTILS DE CONTRÔLE & INVENTAIRE (Nouveaux)
    <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
    <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
        👥 AGENTS ET RESSOURCES HUMAINES
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        📊 ANALYSE ET PERFORMANCE GÉOGRAPHIQUE
    <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
        👤 COMPTE & SYSTÈME
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} /> 
    
    {/* AdminNotifications est compatible avec le type Admin */}
    <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    {/* Alias pour la navigation partagée */}
    <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />
        🗺️ OUTILS TRANSVERSAUX & SOS
    <Stack.Screen name="WarrantSearch" component={WarrantSearchScreen as any} />
    <Stack.Screen name="SosDetail" component={SosDetailScreen as any} />
        ℹ️ SUPPORT, AIDE & TÉLÉCHARGEMENTS
    <Stack.Screen name="UserGuide" component={UserGuideScreen} />
    <Stack.Screen name="HelpCenter" component={UserGuideScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="MyDownloads" component={MyDownloadsScreen} />
      <Stack.Screen name="LegalChatbot" component={LegalChatbotScreen} />
  </Stack.Navigator>
);
export default StationStack;
