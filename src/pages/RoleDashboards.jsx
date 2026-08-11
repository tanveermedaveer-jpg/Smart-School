import React from 'react';

export const SchoolAdminDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">School Admin Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-greenAccent">
        <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
        <p className="text-3xl font-bold text-darkBlue mt-2">1,245</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
        <h3 className="text-gray-500 text-sm font-medium">Total Teachers</h3>
        <p className="text-3xl font-bold text-darkBlue mt-2">84</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
        <h3 className="text-gray-500 text-sm font-medium">Total Parents</h3>
        <p className="text-3xl font-bold text-darkBlue mt-2">950</p>
      </div>
    </div>
  </div>
);

export const TeacherDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Teacher Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">Today's Classes</h3>
        <p className="text-gray-500">You have 4 classes scheduled today.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">Pending Assignments</h3>
        <p className="text-gray-500">2 assignments need grading.</p>
      </div>
    </div>
  </div>
);

export const StudentDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">My Attendance</h3>
        <p className="text-greenAccent text-2xl font-bold">95%</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">Upcoming Homework</h3>
        <p className="text-gray-500">Mathematics assignment due tomorrow.</p>
      </div>
    </div>
  </div>
);

export const ParentDashboard = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">Child's Attendance</h3>
        <p className="text-greenAccent text-2xl font-bold">95%</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-darkBlue mb-2">Fee Status</h3>
        <p className="text-gray-500">All fees are cleared for this semester.</p>
      </div>
    </div>
  </div>
);
