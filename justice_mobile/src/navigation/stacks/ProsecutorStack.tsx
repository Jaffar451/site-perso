import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProsecutorStackParamList } from '../../types/navigation';

// Écrans Métier Procureur
import ProsecutorHomeScreen from '../../screens/prosecutor/ProsecutorHomeScreen';
import ProsecutorCaseListScreen from '../../screens/prosecutor/ProsecutorCaseListScreen';
import ProsecutorCaseDetailScreen from '../../screens/prosecutor/ProsecutorCaseDetailScreen';
import ProsecutorCalendarScreen from '../../screens/prosecutor/ProsecutorCalendarScreen';
import ProsecutorAssignJudgeScreen from '../../screens/prosecutor/ProsecutorAssignJudgeScreen';

// Écrans Partagés
import VerificationScannerScreen from '../../screens/shared/VerificationScannerScreen';
import WeeklyReportScreen from '../../screens/shared/WeeklyReportScreen';
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import NationalMapScreen from '../../screens/admin/NationalMapScreen';
import AdminNotificationsScreen from '../../screens/admin/AdminNotificationsScreen';
import UserGuideScreen from '../../screens/shared/UserGuideScreen';
import SupportScreen from '../../screens/shared/SupportScreen';
import AboutScreen from '../../screens/shared/AboutScreen';
import MyDownloadsScreen from '../../screens/citizen/MyDownloadsScreen';
import WarrantSearchScreen from '@/screens/police/WarrantSearchScreen';
const Stack = createNativeStackNavigator<ProsecutorStackParamList>();

export default function ProsecutorStack() {
  return (
    <Stack.Navigator 
      initialRouteName="ProsecutorDashboard" 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {/* ⚖️ PARQUET & DOSSIERS */}
      <Stack.Screen name="ProsecutorDashboard" component={ProsecutorHomeScreen} />
      <Stack.Screen name="ProsecutorCaseList" component={ProsecutorCaseListScreen} />
      <Stack.Screen name="ProsecutorCaseDetail" component={ProsecutorCaseDetailScreen} />
      <Stack.Screen name="ProsecutorAssignJudge" component={ProsecutorAssignJudgeScreen} />

      {/* ✅ OUTILS DU PARQUET */}
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
      <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
      <Stack.Screen name="WarrantSearch" component={WarrantSearchScreen as any} />

      {/* 📅 AGENDA */}
      <Stack.Screen name="ProsecutorCalendar" component={ProsecutorCalendarScreen} />

      {/* 👤 COMPTE & SYSTÈME */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NationalMap" component={NationalMapScreen} />
      <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />

      {/* ℹ️ AIDE & RESSOURCES */}
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      <Stack.Screen name="HelpCenter" component={UserGuideScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="MyDownloads" component={MyDownloadsScreen} />
    </Stack.Navigator>
  );
}