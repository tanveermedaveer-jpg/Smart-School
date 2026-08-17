import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteSystemLog, deleteAllSystemLogs, getActivityLogs } from '../../utils/logger';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load system logs:', err);
      toast.error('Failed to load system logs from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteLog = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this record from the database?')) {
      try {
        const success = await deleteSystemLog(id);
        if (success) {
          setLogs(prev => prev.filter(log => log.id !== id));
          toast.success('Record deleted successfully from Firebase.');
        } else {
          toast.error('Unable to delete record from Firebase. Please try again.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting record.');
      }
    }
  };

  const handleDeleteAllLogs = async () => {
    if (logs.length === 0) {
      toast.error('No logs available to delete.');
      return;
    }
    if (window.confirm('WARNING: Are you absolutely sure you want to permanently delete ALL system logs from Firebase? This cannot be undone.')) {
      try {
        const success = await deleteAllSystemLogs();
        if (success) {
          setLogs([]);
          toast.success('All system logs deleted permanently from Firebase.');
        } else {
          toast.error('Failed to delete all logs. Please try again.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting all records.');
      }
    }
  };

  const handleExportPDF = () => {
    exportToPDF('export-table', 'System_Logs', 'System Activity Logs');
  };

  const handleExportExcel = () => {
    exportToCSV('export-table', 'System_Logs');
  };

  const filteredLogs = logs.filter(log => {
    const userStr = log.user ? log.user.toString() : '';
    const schoolStr = log.school ? log.school.toString() : '';
    const actionStr = log.action ? log.action.toString() : '';
    const roleStr = log.role ? log.role.toString() : '';

    const matchesSearch = 
      userStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      schoolStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actionStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || roleStr === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportExcel}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium"
          >
            <FileText size={18} />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={handleDeleteAllLogs}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm text-sm font-medium"
            title="Delete All Logs"
          >
            <Trash2 size={18} />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search logs by user, school, or action..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="School Admin">School Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="Parent">Parent</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
              Loading system logs...
            </div>
          ) : (
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Date & Time</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">School</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Action</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        <div>{log.date}</div>
                        <div className="text-xs text-gray-400">{log.time}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-darkBlue">{log.school}</td>
                      <td className="p-4 text-sm text-gray-800">{log.user}</td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{log.role}</span>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-800">{log.action}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Delete Log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
