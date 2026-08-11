import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { FileText, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteSystemLog } from '../../utils/logger';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [classes, setClasses] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setStudents(users.filter(u => u.role === 'student' || u.role === 'Student'));

    const savedFees = JSON.parse(localStorage.getItem('schoolAdminFees') || '[]');
    setFees(savedFees);

    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '{}');
    setAttendance(savedAttendance);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    // Load from unified logs table, fallback to legacy logs array
    let savedLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    if (savedLogs.length > 0) {
      savedLogs = savedLogs.filter(log => log.schoolId?.toString() === schoolId.toString());
    } else {
      savedLogs = JSON.parse(localStorage.getItem(`schoolActivityLogs_${schoolId}`) || '[]');
    }
    setLogs(savedLogs);
  }, []);

  const handleDeleteLog = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this record?')) {
      const success = deleteSystemLog(id);
      if (success) {
        setLogs(prev => prev.filter(log => log.id !== id));
        toast.success('Record deleted successfully.');
      } else {
        toast.error('Unable to delete record. Please try again.');
      }
    }
  };

  const handleDownload = () => {
    toast.success(`Downloading ${activeTab} report... (Mock functionality)`);
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Not Assigned';
  };

  const renderStudentReport = () => (
    <div className="overflow-x-auto">
      <table id="export-table" className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
            <th className="p-4 font-semibold">Student ID</th>
            <th className="p-4 font-semibold">Name</th>
            <th className="p-4 font-semibold">Class</th>
            <th className="p-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {students.map((student) => (
            <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="p-4">{student.username}</td>
              <td className="p-4 font-medium text-darkBlue">{student.name}</td>
              <td className="p-4">{getClassName(student.classId)}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {student.status || 'Active'}
                </span>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan="4" className="p-8 text-center text-gray-500">No students found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFeeReport = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
            <th className="p-4 font-semibold">Fee Title</th>
            <th className="p-4 font-semibold">Student</th>
            <th className="p-4 font-semibold">Amount</th>
            <th className="p-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {fees.map((fee) => (
            <tr key={fee.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="p-4">{fee.title}</td>
              <td className="p-4 font-medium text-darkBlue">
                {students.find(s => s.id.toString() === fee.studentId?.toString())?.name || 'Unknown'}
              </td>
              <td className="p-4">${fee.amount}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {fee.status}
                </span>
              </td>
            </tr>
          ))}
          {fees.length === 0 && (
            <tr>
              <td colSpan="4" className="p-8 text-center text-gray-500">No fee records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLogsReport = () => (
    <div className="overflow-x-auto">
      <table id="export-table" className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
            <th className="p-4 font-semibold">Date & Time</th>
            <th className="p-4 font-semibold">User</th>
            <th className="p-4 font-semibold">Role</th>
            <th className="p-4 font-semibold">Action</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="p-4">
                <div className="font-medium text-darkBlue">{log.date}</div>
                <div className="text-xs text-gray-400">{log.time}</div>
              </td>
              <td className="p-4 font-medium">{log.user}</td>
              <td className="p-4">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {log.role}
                </span>
              </td>
              <td className="p-4 font-medium text-gray-800">{log.action}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {log.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors inline-flex"
                  title="Delete Log"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan="6" className="p-8 text-center text-gray-500">No activity logs found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 text-sm mt-1">Generate and view various school reports.</p>
        </div>
        <div className="flex items-center space-x-3">
        <ExportButtons tableId="export-table" filename="Reports" />
        <button onClick={handleDownload} className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Download size={20} />
          <span>Export to CSV</span>
        </button>
      </div>
</div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
          {['students', 'fees', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 flex items-center justify-center space-x-2 font-medium transition-colors capitalize ${
                activeTab === tab 
                  ? 'text-darkBlue border-b-2 border-darkBlue bg-blue-50/50' 
                  : 'text-gray-500 hover:text-darkBlue hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              <span>{tab === 'logs' ? 'Activity Logs' : `${tab} Report`}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'students' && renderStudentReport()}
        {activeTab === 'fees' && renderFeeReport()}
        {activeTab === 'logs' && renderLogsReport()}
      </div>
    </div>
  );
};

export default Reports;
