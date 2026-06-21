import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PrisonHomeScreen from "../../screens/prison/PrisonHomeScreen";
import PrisonInmatesScreen from "../../screens/prison/PrisonInmatesScreen";
import PrisonEntryScreen from "../../screens/prison/PrisonEntryScreen";
import PrisonReleaseScreen from "../../screens/prison/PrisonReleaseScreen";
import PrisonTransferScreen from "../../screens/prison/PrisonTransferScreen";
import LegalChatbotScreen from "../../screens/shared/LegalChatbotScreen";
import VerificationScannerScreen from "../../screens/shared/VerificationScannerScreen";
import WeeklyReportScreen from "../../screens/shared/WeeklyReportScreen";
import ProfileScreen from "../../screens/Profile/ProfileScreen";
import EditProfileScreen from "../../screens/Profile/EditProfileScreen";
import SettingsScreen from "../../screens/Settings/SettingsScreen";
import AdminNotificationsScreen from "../../screens/admin/AdminNotificationsScreen";
import UserGuideScreen from "../../screens/shared/UserGuideScreen";
import SupportScreen from "../../screens/shared/SupportScreen";
import AboutScreen from "../../screens/shared/AboutScreen";
const Stack = createNativeStackNavigator();
export default function PrisonStack() {
  return (
    <Stack.Navigator
      initialRouteName="PrisonHome"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="PrisonHome" component={PrisonHomeScreen} />
      <Stack.Screen name="PrisonInmates" component={PrisonInmatesScreen} />
      <Stack.Screen name="PrisonEntry" component={PrisonEntryScreen} />
      <Stack.Screen name="PrisonRelease" component={PrisonReleaseScreen} />
      <Stack.Screen name="PrisonTransfer" component={PrisonTransferScreen} />
      <Stack.Screen name="VerificationScanner" component={VerificationScannerScreen as any} />
      <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen as any} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={AdminNotificationsScreen as any} />
      <Stack.Screen name="UserGuide" component={UserGuideScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="LegalChatbot" component={LegalChatbotScreen} />
    </Stack.Navigator>
  );
}
