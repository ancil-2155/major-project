import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/appTheme';

import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  Login: undefined;
  StudentHome: undefined;
  TeacherHome: undefined;
  ParentHome: undefined;
  Gallery: undefined;
  TimetableMenu: undefined;
  TimetableScreen: undefined;
  CreateMeeting: undefined;
  MeetingViewer: undefined;
  Attendance: undefined;
  StudentAttendance: undefined;
  SubjectAttendanceDetails: any;
  Signup: undefined;
  FaceEnrollment: { userData: any };
  AdminHome: undefined;
  TeacherApprovals: undefined;
  UserManagement: undefined;
  AttendanceAnalytics: undefined;
  NoticeManager: undefined;
  GalleryManagement: undefined;
  ClassManager: undefined;
  AdminSettings: undefined;
  PendingApproval: undefined;
  RejectedTeacher: { reason?: string };
  SuspendedAccount: undefined;
  AdminAttendance: undefined;
  UploadResult: undefined;
  ViewResults: undefined;
  Library: undefined;
  GroupChat: any;
  CreateTeacherGroup: undefined;
  CreateGroup: undefined;
  TeacherGroups: undefined;
  StudentGroups: undefined;
  GroupMembers: undefined;
  GroupInfo: { groupId: string };
  UploadResource: undefined;
  Resources: undefined;
  PDFViewer: { fileUrl: string; fileName?: string };
  FaceCapture: undefined;
  TakeAttendance: undefined;
  ApplyBonafide: undefined;
  TeacherRequests: undefined;
  TeacherSignature: undefined;
  BonafideDocument: any;
  StudentBonafideList: undefined;
  ApplyLeave: undefined;
  TeacherLeaveRequests: undefined;
  StudentLeaveList: undefined;
  StudentProfile: undefined;
  StudentSettings: undefined;
  TeacherSettings: undefined;
  BonafideCertificateView: { certificate: any };
  CreateAssignment: undefined;
  StudentAssignments: undefined;
  TeacherAttendanceSetup: undefined;
  TeacherLiveAttendance: any;
  AttendanceReview: any;
  EventGallery: undefined;
  CreateGalleryPost: undefined;
  MyGalleryPosts: undefined;
  StudentNotices: undefined;
  TeacherNotices: undefined;
  NoticeDetails: { noticeId: string };

  // New screens
  ForgotPassword: undefined;
  PrivacySecurity: undefined;
  AboutACAMS: undefined;
  FAQ: undefined;
  TeacherAssignments: undefined;
  AssignmentSubmissions: { assignmentId: string };
  ReviewSubmission: { assignmentId: string; studentId: string };
  AssignmentDetails: { assignmentId: string };
  SubmitAssignment: any;
  // E-Library screens
  ELibrary: undefined;
  LibraryResourceDetails: { resource: any };
  MyBookmarkedResources: undefined;
  TeacherELibrary: undefined;
  UploadLibraryResource: undefined;
  ACAMSChatBot: undefined;
};
import StudentHome from '../screens/StudentHome';
import TeacherHome from '../screens/TeacherHome';
import ParentHome from '../screens/ParentHome';
import EventGalleryScreen from '../screens/gallery/EventGalleryScreen';
import CreateGalleryPostScreen from '../screens/gallery/CreateGalleryPostScreen';
import MyGalleryPostsScreen from '../screens/gallery/MyGalleryPostsScreen';
import TimetableMenuScreen from '../screens/TimetableMenuScreen';
import TimetableScreen from '../screens/TimetableScreen';
import CreateMeetingScreen from '../screens/CreateMeetingScreen';
import MeetingViewerScreen from '../screens/MeetingViewerScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import FaceEnrollmentScreen from '../screens/auth/FaceEnrollmentScreen';
import UploadResultScreen from '../screens/UploadResultScreen';
import ViewResultsScreen from '../screens/ViewResultsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import GroupChatScreen from '../screens/groups/GroupChatScreen';
import GroupInfoScreen from '../screens/groups/GroupInfoScreen';
import CreateGroupScreen from '../screens/teacher/CreateGroupScreen';
import TeacherGroupsScreen from '../screens/teacher/TeacherGroupsScreen';
import StudentGroupsScreen from '../screens/student/StudentGroupsScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import UploadResourceScreen from '../screens/UploadResourceScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import FaceCaptureScreen from '../screens/FaceCaptureScreen';
import AttendanceScreen from '../screens/AttendenceScreen';
import ApplyBonafideScreen from '../screens/ApplyBonafideScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
// AdminApproveScreen removed — replaced by TeacherApprovalsScreen
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import TeacherRequestsScreen from '../screens/TeacherRequestsScreen';
import TeacherSignatureScreen from '../screens/TeacherSignatureScreen';
import StudentBonafideListScreen from '../screens/StudentBonafideListScreen';
import ApplyLeaveScreen from '../screens/ApplyLeaveScreen';
import TeacherLeaveRequestsScreen from '../screens/TeacherLeaveRequestsScreen';
import StudentLeaveListScreen from '../screens/StudentLeaveListScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import StudentSettingsScreen from '../screens/StudentSettingsScreen';
import TeacherSettingsScreen from '../screens/TeacherSettingsScreen';
import BonafideCertificateViewScreen from '../screens/BonafideCertificateViewScreen';
import CreateAssignmentScreen from '../screens/CreateAssignmentScreen';
import StudentAssignmentListScreen from '../screens/StudentAssignmentListScreen';
import TeacherAttendanceSetupScreen from '../screens/TeacherAttendanceSetupScreen';
import TeacherLiveAttendanceScreen from '../screens/TeacherLiveAttendanceScreen';
import AttendanceReviewScreen from '../screens/AttendanceReviewScreen';

import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import AboutACAMSScreen from '../screens/AboutACAMSScreen';
import FAQScreen from '../screens/FAQScreen';
import TeacherAssignmentsScreen from '../screens/TeacherAssignmentsScreen';
import AssignmentSubmissionsScreen from '../screens/AssignmentSubmissionsScreen';
import ReviewSubmissionScreen from '../screens/ReviewSubmissionScreen';
import AssignmentDetailsScreen from '../screens/AssignmentDetailsScreen';
import SubmitAssignmentScreen from '../screens/SubmitAssignmentScreen';

import ELibraryScreen from '../screens/ELibraryScreen';
import LibraryResourceDetailsScreen from '../screens/LibraryResourceDetailsScreen';
import MyBookmarkedResourcesScreen from '../screens/MyBookmarkedResourcesScreen';
import TeacherELibraryScreen from '../screens/TeacherELibraryScreen';
import UploadLibraryResourceScreen from '../screens/UploadLibraryResourceScreen';
import ACAMSChatBotScreen from '../screens/ACAMSChatBotScreen';
import StudentNoticesScreen from '../screens/StudentNoticesScreen';
import NoticeDetailsScreen from '../screens/NoticeDetailsScreen';
import TeacherNoticesScreen from '../screens/TeacherNoticesScreen';
import StudentAttendanceScreen from '../screens/student/StudentAttendanceScreen';
import SubjectAttendanceDetailsScreen from '../screens/student/SubjectAttendanceDetailsScreen';

import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';
import RejectedTeacherScreen from '../screens/auth/RejectedTeacherScreen';
import SuspendedAccountScreen from '../screens/auth/SuspendedAccountScreen';

import TeacherApprovalsScreen from '../screens/admin/TeacherApprovalsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AttendanceAnalyticsScreen from '../screens/admin/AttendanceAnalyticsScreen';
import NoticeManagerScreen from '../screens/admin/NoticeManagerScreen';
import GalleryManagementScreen from '../screens/admin/GalleryManagementScreen';
import ClassManagerScreen from '../screens/admin/ClassManagerScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Helper to wrap any screen component with ErrorBoundary
const withErrorBoundary = (ScreenComponent: React.ComponentType<any>) => {
  return (props: any) => (
    <ErrorBoundary navigation={props.navigation}>
      <ScreenComponent {...props} />
    </ErrorBoundary>
  );
};



const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { colors, isDark } = useAppTheme();
  const navigationTheme = React.useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    }),
    [colors, isDark],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StudentHome" component={StudentHome} />
        <Stack.Screen name="TeacherHome" component={TeacherHome} />
        <Stack.Screen name="ParentHome" component={ParentHome} />
        <Stack.Screen name="EventGallery" component={EventGalleryScreen} />
        <Stack.Screen name="CreateGalleryPost" component={CreateGalleryPostScreen} />
        <Stack.Screen name="MyGalleryPosts" component={MyGalleryPostsScreen} />
        <Stack.Screen name="TimetableMenu" component={TimetableMenuScreen} />
        <Stack.Screen name="TimetableScreen" component={TimetableScreen} />
        <Stack.Screen name="CreateMeeting" component={CreateMeetingScreen} />
<Stack.Screen name="MeetingViewer" component={MeetingViewerScreen} />
<Stack.Screen name="Signup" component={SignupScreen} />
<Stack.Screen name="FaceEnrollment" component={FaceEnrollmentScreen} />
<Stack.Screen name="UploadResult" component={UploadResultScreen} />
<Stack.Screen name="ViewResults" component={ViewResultsScreen} />
<Stack.Screen name="Library" component={LibraryScreen} />
<Stack.Screen name="GroupChat" component={GroupChatScreen} />
<Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
<Stack.Screen name="CreateTeacherGroup" component={CreateGroupScreen} />
<Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
<Stack.Screen name="TeacherGroups" component={TeacherGroupsScreen} />
<Stack.Screen name="StudentGroups" component={StudentGroupsScreen} />
<Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
<Stack.Screen name="UploadResource" component={UploadResourceScreen} />
<Stack.Screen name="Resources" component={ResourcesScreen} />
<Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
<Stack.Screen name="FaceCapture" component={FaceCaptureScreen} />
<Stack.Screen 
  name="Attendance" 
  component={AttendanceScreen} 
/>
<Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
<Stack.Screen name="SubjectAttendanceDetails" component={SubjectAttendanceDetailsScreen} />
<Stack.Screen name="ApplyBonafide" component={ApplyBonafideScreen} />
<Stack.Screen name="AdminHome" component={withErrorBoundary(AdminHomeScreen)} />
<Stack.Screen name="TeacherApprovals" component={withErrorBoundary(TeacherApprovalsScreen)} />
<Stack.Screen name="UserManagement" component={withErrorBoundary(UserManagementScreen)} />
<Stack.Screen name="AttendanceAnalytics" component={withErrorBoundary(AttendanceAnalyticsScreen)} />
<Stack.Screen name="NoticeManager" component={withErrorBoundary(NoticeManagerScreen)} />
<Stack.Screen name="GalleryManagement" component={withErrorBoundary(GalleryManagementScreen)} />
<Stack.Screen name="ClassManager" component={withErrorBoundary(ClassManagerScreen)} />
<Stack.Screen name="AdminSettings" component={withErrorBoundary(AdminSettingsScreen)} />
<Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
<Stack.Screen name="RejectedTeacher" component={RejectedTeacherScreen} />
<Stack.Screen name="SuspendedAccount" component={SuspendedAccountScreen} />
<Stack.Screen name="AdminAttendance" component={AdminAttendanceScreen} />
<Stack.Screen
  name="TeacherRequests"
  component={TeacherRequestsScreen}
/>
<Stack.Screen name="TeacherSignature" component={TeacherSignatureScreen} />

<Stack.Screen
  name="StudentBonafideList"
  component={StudentBonafideListScreen}
/>
<Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
<Stack.Screen
  name="TeacherLeaveRequests"
  component={TeacherLeaveRequestsScreen}
/>
<Stack.Screen
  name="StudentLeaveList"
  component={StudentLeaveListScreen}
/>
<Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
<Stack.Screen name="StudentSettings" component={StudentSettingsScreen} />
<Stack.Screen name="TeacherSettings" component={TeacherSettingsScreen} />
<Stack.Screen name="BonafideCertificateView" component={BonafideCertificateViewScreen} />
<Stack.Screen
  name="CreateAssignment"
  component={CreateAssignmentScreen}
/>
<Stack.Screen
  name="StudentAssignments"
  component={StudentAssignmentListScreen}
/>
<Stack.Screen name="TeacherAttendanceSetup" component={TeacherAttendanceSetupScreen} />
<Stack.Screen name="TeacherLiveAttendance" component={TeacherLiveAttendanceScreen} />
<Stack.Screen name="AttendanceReview" component={AttendanceReviewScreen} />
<Stack.Screen name="StudentNotices" component={StudentNoticesScreen} />
<Stack.Screen name="TeacherNotices" component={TeacherNoticesScreen} />
<Stack.Screen name="NoticeDetails" component={NoticeDetailsScreen} />

{/* New Screens */}
<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
<Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
<Stack.Screen name="AboutACAMS" component={AboutACAMSScreen} />
<Stack.Screen name="FAQ" component={FAQScreen} />
<Stack.Screen name="TeacherAssignments" component={TeacherAssignmentsScreen} />
<Stack.Screen name="AssignmentSubmissions" component={AssignmentSubmissionsScreen} />
<Stack.Screen name="ReviewSubmission" component={ReviewSubmissionScreen} />
<Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} />
<Stack.Screen name="SubmitAssignment" component={SubmitAssignmentScreen} />

{/* E-Library Screens */}
<Stack.Screen name="ELibrary" component={ELibraryScreen} />
<Stack.Screen name="LibraryResourceDetails" component={LibraryResourceDetailsScreen} />
<Stack.Screen name="MyBookmarkedResources" component={MyBookmarkedResourcesScreen} />
<Stack.Screen name="TeacherELibrary" component={TeacherELibraryScreen} />
<Stack.Screen name="UploadLibraryResource" component={UploadLibraryResourceScreen} />
<Stack.Screen name="ACAMSChatBot" component={ACAMSChatBotScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
