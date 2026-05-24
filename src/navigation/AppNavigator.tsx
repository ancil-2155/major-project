import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
  Signup: undefined;
  FaceEnrollment: { userData: any };
  AdminHome: undefined;
  AdminAttendance: undefined;
  AdminApprove: undefined;
  UploadResult: undefined;
  ViewResults: undefined;
  Library: undefined;
  GroupChat: undefined;
  CreateTeacherGroup: undefined;
  TeacherGroups: undefined;
  GroupMembers: undefined;
  UploadResource: undefined;
  Resources: undefined;
  PDFViewer: { fileUrl: string; fileName?: string };
  FaceCapture: undefined;
  TakeAttendance: undefined;
  ApplyBonafide: undefined;
  AdminApprove: undefined;
  TeacherRequests: undefined;
  TeacherSignature: undefined;
  BonafideDocument: any;
  StudentBonafideList: undefined;
  ApplyLeave: undefined;
  TeacherLeaveRequests: undefined;
  StudentLeaveList: undefined;
  CreateAssignment: undefined;
  StudentAssignments: undefined;
  SubmitAssignment: { id: string; title: string };
};
import StudentHome from '../screens/StudentHome';
import TeacherHome from '../screens/TeacherHome';
import ParentHome from '../screens/ParentHome';
import GalleryScreen from '../screens/GalleryScreen';
import TimetableMenuScreen from '../screens/TimetableMenuScreen';
import TimetableScreen from '../screens/TimetableScreen';
import CreateMeetingScreen from '../screens/CreateMeetingScreen';
import MeetingViewerScreen from '../screens/MeetingViewerScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import FaceEnrollmentScreen from '../screens/auth/FaceEnrollmentScreen';
import UploadResultScreen from '../screens/UploadResultScreen';
import ViewResultsScreen from '../screens/ViewResultsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import CreateTeacherGroupScreen from '../screens/CreateTeacherGroupScreen';
import TeacherGroupsScreen from '../screens/TeacherGroupsScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import UploadResourceScreen from '../screens/UploadResourceScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import FaceCaptureScreen from '../screens/FaceCaptureScreen';
import AttendanceScreen from '../screens/AttendenceScreen';
import ApplyBonafideScreen from '../screens/ApplyBonafideScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminApproveScreen from '../screens/admin/AdminApproveScreen';
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import TeacherRequestsScreen from '../screens/TeacherRequestsScreen';
import TeacherSignatureScreen from '../screens/TeacherSignatureScreen';
import StudentBonafideListScreen from '../screens/StudentBonafideListScreen';
import ApplyLeaveScreen from '../screens/ApplyLeaveScreen';
import TeacherLeaveRequestsScreen from '../screens/TeacherLeaveRequestsScreen';
import StudentLeaveListScreen from '../screens/StudentLeaveListScreen';
import CreateAssignmentScreen from '../screens/CreateAssignmentScreen';
import StudentAssignmentListScreen from '../screens/StudentAssignmentListScreen';



const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StudentHome" component={StudentHome} />
        <Stack.Screen name="TeacherHome" component={TeacherHome} />
        <Stack.Screen name="ParentHome" component={ParentHome} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
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
<Stack.Screen name="CreateTeacherGroup" component={CreateTeacherGroupScreen} />
<Stack.Screen name="TeacherGroups" component={TeacherGroupsScreen} />
<Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
<Stack.Screen name="UploadResource" component={UploadResourceScreen} />
<Stack.Screen name="Resources" component={ResourcesScreen} />
<Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
<Stack.Screen name="FaceCapture" component={FaceCaptureScreen} />
<Stack.Screen 
  name="Attendance" 
  component={AttendanceScreen} 
/>
<Stack.Screen name="ApplyBonafide" component={ApplyBonafideScreen} />
<Stack.Screen name="AdminHome" component={AdminHomeScreen} />
<Stack.Screen name="AdminApprove" component={AdminApproveScreen} />
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
<Stack.Screen
  name="CreateAssignment"
  component={CreateAssignmentScreen}
/>
<Stack.Screen
  name="StudentAssignments"
  component={StudentAssignmentListScreen}
/>


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;