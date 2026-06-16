import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Complaint } from "../services/complaint.service";

export type SharedStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  HelpCenter: undefined;
  About: undefined;
  UserGuide: undefined;
  Support: undefined;
  MyDownloads: undefined;
  NationalMap: undefined;
  VerificationScanner: undefined;
  WeeklyReport: undefined; // ← ajouté ici pour tous les stacks
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;  // ← alias
  AdminStats: undefined;
  AdminLogs: undefined;      // ← alias
  AdminUsers: { refresh?: boolean; timestamp?: number } | undefined;
  AdminCreateUser: undefined;
  AdminEditUser: { userId: string | number };
  AdminUserDetails: { userId: number };
  AdminUserDetail: { userId: number }; // ← alias
  AdminEditProfile: undefined;
  AdminSecurity: undefined;
  AdminMaintenance: undefined;
  AdminAuditTrail: undefined;
  AdminSecurityDashboard: undefined;
  AdminCourts: undefined;
  AdminCreateCourt: undefined;
  ManageStations: undefined;
  AdminSettings: undefined;
  AdminNotifications: undefined;
} & SharedStackParamList;

export type PoliceStackParamList = {
  PoliceHome: undefined;
  PoliceComplaints: undefined;
  PoliceCases: undefined;
  PoliceComplaintDetails: { complaintId: number };
  PolicePVScreen: { complaintId?: number };
  PoliceInterrogation: { complaintId: number; suspectName: string };
  PoliceCustody: { complaintId: number; suspectName: string };
  PoliceCustodyExtension: { caseId: number; suspectName: string; complaintId: number };
  PoliceDetention: { complaintId?: number; suspectName: string };
  PoliceArrestWarrant: undefined;
  PoliceSearchWarrant: undefined;
  WarrantSearch: undefined;   // ← alias
  CreateSummon: { complaintId: number | string };
  SosDetail: { alert: any };
  CommissaireGAVSupervision: undefined; // ← ajouté pour compatibilité
  CommissaireReview: { id: number } | { complaintId: number }; // ← ajouté
} & SharedStackParamList;

export type JudgeStackParamList = {
  JudgeHome: undefined;
  JudgeCases: undefined;
  JudgeCaseList: undefined;
  JudgeCaseDetails: { caseId: number };
  JudgeCaseDetail: { caseId: number };  // ← alias
  CaseDetail: { caseId: number };
  JudgeInterrogation: { complaintId: number; suspectName: string };
  CreateDecision: { caseId: number };
  IssueArrestWarrant: { caseId: number };
  JudgeConfiscation: { caseId: number; decisionId?: number };
  JudgePreventiveDetention: { caseId: number; personName?: string };
  JudgeReparation: { caseId: number; decisionId?: number };
  JudgeVerdict: { caseId: number };
  JudgeAppeal: { caseId: number; personName?: string };
  JudgeCalendar: undefined;
  JudgeHearing: undefined;
  JudgeDecisions: undefined;
  JudgeSentence: undefined;
  JudgeProsecution: { caseId: number };
  JudgeRelease: { caseId: number };
} & SharedStackParamList;

export type ProsecutorStackParamList = {
  ProsecutorHome: undefined;
  ProsecutorDashboard: undefined;
  ProsecutorCaseList: undefined;
  ProsecutorAssignJudge: { caseId: number };
  ProsecutorCaseDetail: { caseId: number };
  ProsecutorCalendar: undefined;
  WarrantSearch: undefined;   // ← ajouté ici pour tous les stacks
} & SharedStackParamList;

export type CommissaireStackParamList = {
  CommissaireDashboard: undefined;
  CommissaireReview: { id: number } | { complaintId: number };
  CommissaireActionDetail: { id: number };
  CommissaireVisaList: undefined;
  CommissaireGAVSupervision: undefined;
  CommissaireRegistry: undefined;
  CommissaireCommandCenter: undefined;
} & SharedStackParamList;

export type ClerkStackParamList = {
  ClerkHome: undefined;
  ClerkCalendar: undefined;
  ClerkComplaints: undefined;
  ClerkHearings: undefined;
  ClerkHearing: undefined;
  ClerkProsecution: undefined;
  ClerkRegisterCase: { complaintId: number };
  ClerkHearingDetails: { caseId: number; caseNumber: string };
  ClerkComplaintDetails: { id: number };
  ClerkAdjournHearing: { hearingId: number | string; caseNumber: string };
  ClerkConfiscation: { caseId: string };
  ClerkEvidence: undefined;
  ClerkRelease: undefined;
  ClerkWitness: undefined;
} & SharedStackParamList;

export type CitizenStackParamList = {
  CitizenHome: undefined;
  CitizenCreateComplaint: undefined;
  CitizenMyComplaints: undefined;
  CitizenComplaintDetails: { complaintId?: number; id?: string | number };
  ComplaintDetail: { id: string | number }; // ← alias utilisé dans les écrans
  CitizenTracking: undefined;
  CitizenCases: undefined;
  ComplaintList: { id: string; complaintId: number }; // ← ajouter
  CitizenEditComplaint: { complaint: Complaint };
  CitizenCriminalRecord: undefined;
  CitizenDirectory: undefined;
  StationMapScreen: undefined;
  CitizenLegalGuide: undefined;
  CitizenNotifications: undefined;
} & SharedStackParamList;

export type LawyerStackParamList = {
  LawyerHome: undefined;
  LawyerCaseList: undefined;
  LawyerCaseDetail: { caseId: number };
  LawyerCalendar: undefined;
  LawyerNotifications: undefined;
  LawyerSubmitBrief: undefined;
  LawyerTracking: undefined;
} & SharedStackParamList;

export type BailiffStackParamList = {
  BailiffHome: undefined;
  BailiffMissions: undefined;
  BailiffCalendar: undefined;
} & SharedStackParamList;

export type PrisonStackParamList = {
  PrisonHome: undefined;
  PrisonInmates: undefined;
  PrisonCheckIn: { warrantId: string };
} & SharedStackParamList;

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  AdminStack: NavigatorScreenParams<AdminStackParamList>;
  PoliceStack: NavigatorScreenParams<PoliceStackParamList>;
  JudgeStack: NavigatorScreenParams<JudgeStackParamList>;
  ProsecutorStack: NavigatorScreenParams<ProsecutorStackParamList>;
  CitizenStack: NavigatorScreenParams<CitizenStackParamList>;
  ClerkStack: NavigatorScreenParams<ClerkStackParamList>;
  CommissaireStack: NavigatorScreenParams<CommissaireStackParamList>;
  LawyerStack: NavigatorScreenParams<LawyerStackParamList>;
  BailiffStack: NavigatorScreenParams<BailiffStackParamList>;
  PrisonStack: NavigatorScreenParams<PrisonStackParamList>;
  Main: undefined;
  ComplaintDetail: { id: string | number };
  ComplaintList: { id: string; complaintId: number };
  PoliceStation: undefined;
} & SharedStackParamList;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type AdminScreenProps<T extends keyof AdminStackParamList> = NativeStackScreenProps<AdminStackParamList, T>;
export type PoliceScreenProps<T extends keyof PoliceStackParamList> = NativeStackScreenProps<PoliceStackParamList, T>;
export type JudgeScreenProps<T extends keyof JudgeStackParamList> = NativeStackScreenProps<JudgeStackParamList, T>;
export type ProsecutorScreenProps<T extends keyof ProsecutorStackParamList> = NativeStackScreenProps<ProsecutorStackParamList, T>;
export type CommissaireScreenProps<T extends keyof CommissaireStackParamList> = NativeStackScreenProps<CommissaireStackParamList, T>;
export type ClerkScreenProps<T extends keyof ClerkStackParamList> = NativeStackScreenProps<ClerkStackParamList, T>;
export type CitizenScreenProps<T extends keyof CitizenStackParamList> = NativeStackScreenProps<CitizenStackParamList, T>;
export type LawyerScreenProps<T extends keyof LawyerStackParamList> = NativeStackScreenProps<LawyerStackParamList, T>;
export type BailiffScreenProps<T extends keyof BailiffStackParamList> = NativeStackScreenProps<BailiffStackParamList, T>;
export type PrisonScreenProps<T extends keyof PrisonStackParamList> = NativeStackScreenProps<PrisonStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
