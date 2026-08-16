import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForcePasswordChange from './pages/ForcePasswordChange';

// Super Admin
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Schools from './pages/superadmin/Schools';
import SchoolAdmins from './pages/superadmin/SchoolAdmins';
import AcademicTemplates from './pages/superadmin/AcademicTemplates';
import DemoRequests from './pages/superadmin/DemoRequests';
import ContactMessages from './pages/superadmin/ContactMessages';
import GalleryManagement from './pages/superadmin/GalleryManagement';
import AdmissionsManagement from './pages/superadmin/AdmissionsManagement';
import Subscriptions from './pages/superadmin/Subscriptions';
import Settings from './pages/superadmin/Settings';
import WebsiteContentManagement from './pages/superadmin/WebsiteContentManagement';
import Notifications from './pages/superadmin/Notifications';
import SystemLogs from './pages/superadmin/SystemLogs';
import SupportCenter from './pages/superadmin/SupportCenter';

// Role-based auth
import RoleProtectedRoute from './components/RoleProtectedRoute';
import PlaceholderModule from './pages/PlaceholderModule';

// Teacher Portal
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherMarks from './pages/teacher/Marks';
import TeacherHomework from './pages/teacher/Homework';
import TeacherTimetable from './pages/teacher/Timetable';
import TeacherNotices from './pages/teacher/Notices';
import TeacherProfile from './pages/teacher/Profile';
import TeacherQrAttendance from './pages/teacher/QrAttendance';


// Student Portal
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentHomework from './pages/student/Homework';
import StudentResults from './pages/student/Results';
import StudentTimetable from './pages/student/Timetable';
import StudentNotices from './pages/student/Notices';
import StudentProfile from './pages/student/Profile';
import StudentFeeStatus from './pages/student/FeeStatus';

// Parent Portal
import ParentDashboard from './pages/parent/Dashboard';
import ParentChildProfile from './pages/parent/ChildProfile';
import ParentAttendance from './pages/parent/Attendance';
import ParentHomework from './pages/parent/Homework';
import ParentResults from './pages/parent/Results';
import ParentTimetable from './pages/parent/Timetable';
import ParentFeeStatus from './pages/parent/FeeStatus';
import ParentNotices from './pages/parent/Notices';
import ParentContactSchool from './pages/parent/ContactSchool';
import ParentProfile from './pages/parent/Profile';

// Layouts
import SchoolAdminLayout from './layouts/SchoolAdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import ParentLayout from './layouts/ParentLayout';

// Users Management (School Admin)
import SchoolAdminDashboard from './pages/schooladmin/Dashboard';
import UserManagement from './pages/schooladmin/UserManagement';
import Classes from './pages/schooladmin/Classes';
import Subjects from './pages/schooladmin/Subjects';
import TeacherAssignments from './pages/schooladmin/TeacherAssignments';
import Attendance from './pages/schooladmin/Attendance';
import Admissions from './pages/schooladmin/Admissions';
import FeeManagement from './pages/schooladmin/FeeManagement';
import FeeStructure from './pages/schooladmin/FeeStructure';
import MonthlyFees from './pages/schooladmin/MonthlyFees';
import CollectFees from './pages/schooladmin/CollectFees';
import ExamManagement from './pages/schooladmin/ExamManagement';
import ResultProcessing from './pages/schooladmin/ResultProcessing';
import PublishResults from './pages/schooladmin/PublishResults';
import ReportCards from './pages/schooladmin/ReportCards';
import MeritList from './pages/schooladmin/MeritList';
import ResultReports from './pages/schooladmin/ResultReports';
import Timetable from './pages/schooladmin/Timetable';
import Notices from './pages/schooladmin/Notices';
import Gallery from './pages/schooladmin/Gallery';
import Reports from './pages/schooladmin/Reports';
import SettingsSA from './pages/schooladmin/Settings';
import SupportCenterSA from './pages/schooladmin/SupportCenter';
import TeacherSalaries from './pages/schooladmin/TeacherSalaries';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ForcePasswordChange />} />
        
        {/* Super Admin Auth */}
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        
        {/* Super Admin Protected Area */}
        <Route 
          path="/super-admin" 
          element={
            <ProtectedRoute>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="school-admins" element={<SchoolAdmins />} />
          <Route path="academic-templates" element={<AcademicTemplates />} />
          <Route path="demo-requests" element={<DemoRequests />} />
          <Route path="contact-messages" element={<ContactMessages />} />
          <Route path="gallery" element={<GalleryManagement />} />
          <Route path="admissions" element={<AdmissionsManagement />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="website-content" element={<WebsiteContentManagement />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="system-logs" element={<SystemLogs />} />
          <Route path="support" element={<SupportCenter />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route 
          path="/school-admin" 
          element={
            <RoleProtectedRoute allowedRoles={['schoolAdmin']}>
              <SchoolAdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SchoolAdminDashboard />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="teacher-assignments" element={<TeacherAssignments />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="fee-management" element={<FeeManagement />} />
          <Route path="fee-structure" element={<FeeStructure />} />
          <Route path="monthly-fees" element={<MonthlyFees />} />
          <Route path="collect-fees" element={<CollectFees />} />
          <Route path="teacher-salaries" element={<TeacherSalaries />} />
          <Route path="exam-management" element={<ExamManagement />} />
          <Route path="marks-entry" element={<TeacherMarks />} />
          <Route path="result-processing" element={<ResultProcessing />} />
          <Route path="publish-results" element={<PublishResults />} />
          <Route path="report-cards" element={<ReportCards />} />
          <Route path="merit-list" element={<MeritList />} />
          <Route path="result-reports" element={<ResultReports />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="notices" element={<Notices />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsSA />} />
          <Route path="support" element={<SupportCenterSA />} />
          <Route path="*" element={<PlaceholderModule title="School Admin Module" />} />
        </Route>

        {/* Teacher Protected Area */}
        <Route 
          path="/teacher" 
          element={
            <RoleProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="qr-attendance" element={<TeacherQrAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="homework" element={<TeacherHomework />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="notices" element={<TeacherNotices />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="*" element={<PlaceholderModule title="Teacher Module" />} />
        </Route>

        {/* Student Protected Area */}
        <Route 
          path="/student" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="homework" element={<StudentHomework />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="fee-status" element={<StudentFeeStatus />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="*" element={<PlaceholderModule title="Student Module" />} />
        </Route>

        {/* Parent Protected Area */}
        <Route 
          path="/parent" 
          element={
            <RoleProtectedRoute allowedRoles={['parent']}>
              <ParentLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="child-profile" element={<ParentChildProfile />} />
          <Route path="attendance" element={<ParentAttendance />} />
          <Route path="homework" element={<ParentHomework />} />
          <Route path="results" element={<ParentResults />} />
          <Route path="timetable" element={<ParentTimetable />} />
          <Route path="fee-status" element={<ParentFeeStatus />} />
          <Route path="notices" element={<ParentNotices />} />
          <Route path="contact-school" element={<ParentContactSchool />} />
          <Route path="contact" element={<ParentContactSchool />} />
          <Route path="profile" element={<ParentProfile />} />
          <Route path="*" element={<PlaceholderModule title="Parent Module" />} />
        </Route>

        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default App;
