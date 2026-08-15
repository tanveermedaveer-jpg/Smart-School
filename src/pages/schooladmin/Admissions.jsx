import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, XCircle, Clock, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateMonthlyFees } from '../../utils/feeGenerator';
import PasswordInput from '../../components/PasswordInput';
import { logSystemAction } from '../../utils/logger';
import { getAdmissionsScoped, updateAdmissionStatus } from '../../utils/db';

const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [assignClassId, setAssignClassId] = useState('');
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewSelectedReq, setViewSelectedReq] = useState(null);
  
  const [studentPassword, setStudentPassword] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [generatedRollNumber, setGeneratedRollNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  const loadAdmissions = async () => {
    if (!authUser.schoolId) {
      setError('Missing assigned School ID for this administrator.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdmissionsScoped(authUser.schoolId);
      if (Array.isArray(data)) {
        setAdmissions([...data].reverse()); // Show newest first
        localStorage.setItem('admissions', JSON.stringify(data));
      } else {
        throw new Error('Malformed admissions response from server.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load admissions from the database.');
      toast.error('Failed to load admissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
    try {
      const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      setClasses(Array.isArray(savedClasses) ? savedClasses : []);
    } catch (e) {
      console.error(e);
      setClasses([]);
    }
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'Approved') {
      const req = admissions.find(a => a.id === id);
      
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const globalUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const allUsers = [...users, ...globalUsers];
      
      const isDuplicate = allUsers.some(u => {
        if (req.parentEmail && u.email === req.parentEmail) return true;
        if (req.phone && u.phone === req.phone) return true;
        if (req.studentName && req.phone && u.name === req.studentName && u.phone === req.phone) return true;
        return false;
      });

      if (isDuplicate) {
         toast.error("This admission already exists.");
         return;
      }

      const students = users.filter(u => u.role === 'student');
      const year = new Date().getFullYear();
      const nextNum = (students.length + 1).toString().padStart(3, '0');
      const rollNum = `${year}-${nextNum}`;
      
      setGeneratedRollNumber(rollNum);
      setSelectedReq(req);
      setIsModalOpen(true);
      return;
    }

    if (window.confirm(`Are you sure you want to mark this as ${newStatus}?`)) {
      const req = admissions.find(a => a.id === id);
      try {
        await updateAdmissionStatus(id, newStatus);
        const updated = admissions.map(a => a.id === id ? { ...a, status: newStatus } : a);
        setAdmissions(updated);
        localStorage.setItem('admissions', JSON.stringify([...updated].reverse()));
        toast.success(`Admission ${newStatus.toLowerCase()}`);

        logSystemAction(
          `Admission status changed to ${newStatus}: ${req?.studentName || 'Student'}`,
          authUser.name || 'School Admin',
          'School Admin',
          authUser.schoolName || 'School',
          authUser.schoolId
        );
      } catch (err) {
        console.error(err);
        toast.error('Failed to update status on server.');
      }
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!assignClassId) {
      toast.error('Please assign a class');
      return;
    }
    if (!studentPassword || !parentPassword) {
      toast.error('Please provide passwords for both accounts');
      return;
    }

    try {
      await updateAdmissionStatus(selectedReq.id, 'Approved');
      
      const updated = admissions.map(a => a.id === selectedReq.id ? { ...a, status: 'Approved', assignedClassId: assignClassId, rollNumber: generatedRollNumber } : a);
      setAdmissions(updated);
      localStorage.setItem('admissions', JSON.stringify([...updated].reverse()));

      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      const schoolId = authUser.schoolId || 'global';
      
      const studentId = Date.now();
      const parentId = Date.now() + 1;
      
      const newStudent = {
        id: studentId,
        name: selectedReq.studentName,
        email: generatedRollNumber,
        phone: selectedReq.phone,
        username: generatedRollNumber,
        rollNumber: generatedRollNumber,
        password: studentPassword,
        role: 'student',
        status: 'Active',
        classId: assignClassId,
        schoolId: schoolId,
        parentId: parentId
      };
      
      const newParent = {
        id: parentId,
        name: selectedReq.parentName,
        email: selectedReq.parentEmail,
        phone: selectedReq.phone,
        username: selectedReq.parentEmail,
        password: parentPassword,
        role: 'parent',
        status: 'Active',
        linkedStudentId: studentId,
        childId: studentId,
        schoolId: schoolId
      };

      localStorage.setItem('schoolAdminUsers', JSON.stringify([...users, newStudent, newParent]));
      
      // Generate monthly fee record for the new active student
      const generated = generateMonthlyFees(studentId);
      
      logSystemAction(
        `Admission Approved: ${selectedReq.studentName} (ID: ${generatedRollNumber})`,
        authUser.name || 'School Admin',
        'School Admin',
        authUser.schoolName || 'School',
        schoolId
      );

      toast.success('Admission approved! Student & Parent accounts created.');
      if (generated > 0) {
        toast.success('Initial fee record generated for the current month.');
      }

      setIsModalOpen(false);
      setSelectedReq(null);
      setAssignClassId('');
      setStudentPassword('');
      setParentPassword('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve admission application.');
    }
  };

  const handleView = (req) => {
    setViewSelectedReq(req);
    setIsViewModalOpen(true);
  };

  const filteredAdmissions = admissions.filter(a => 
    a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone?.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Online Admissions</h2>
          <p className="text-gray-500 text-sm mt-1">Review and process admission requests from the website.</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search student or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
            Loading applications...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-bold">Error Loading Admissions</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={loadAdmissions} className="mt-4 px-4 py-2 bg-darkBlue text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors">
              Retry
            </button>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No admission requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Student Details</th>
                  <th className="p-4 font-semibold">Contact Info</th>
                  <th className="p-4 font-semibold">Requested Grade</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {filteredAdmissions.map((req) => (
                  <tr key={req.id || Math.random()} className="border-b border-gray-55 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-darkBlue flex items-center space-x-2">
                        <UserPlus size={16} className="text-gray-400" />
                        <span>{req.studentName || 'N/A'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6">DOB: {req.dateOfBirth || 'N/A'}</div>
                      <div className="text-xs text-gray-500 ml-6">Parent: {req.parentName || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div>{req.phone || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{req.email || req.parentEmail || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {req.class || req.grade || 'N/A'}
                      {req.assignedClassId && (
                        <div className="text-xs text-green-600 mt-1">
                          Assigned: {(Array.isArray(classes) ? classes.find(c => c.id?.toString() === req.assignedClassId?.toString()) : null)?.className || 'Unknown Class'}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {req.status === 'Approved' ? (
                        <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full w-max"><CheckCircle size={14} className="mr-1"/> Approved</span>
                      ) : req.status === 'Rejected' ? (
                        <span className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full w-max"><XCircle size={14} className="mr-1"/> Rejected</span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full w-max"><Clock size={14} className="mr-1"/> Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleView(req)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="View Details">
                        <Eye size={18} />
                      </button>
                      {req.status === 'Pending' && (
                        <>
                          <button onClick={() => handleStatusChange(req.id, 'Approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex" title="Approve">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleStatusChange(req.id, 'Rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Approve Admission</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                You are approving the admission for <strong>{selectedReq?.studentName}</strong> (Requested Grade: {selectedReq?.class || selectedReq?.grade}).
              </p>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 text-sm">
                <span className="font-semibold">Generated Roll Number:</span> {generatedRollNumber}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Class</label>
                <select required value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Password</label>
                  <PasswordInput required value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none bg-white" placeholder="Student Password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Password</label>
                  <PasswordInput required value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none bg-white" placeholder="Parent Password" />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Approving will automatically create Active Student and Parent accounts.
              </p>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">Final Approve</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Admission Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-600">Student Name:</span> {viewSelectedReq?.studentName}</div>
                <div><span className="font-semibold text-gray-600">Class Applied For:</span> {viewSelectedReq?.class || viewSelectedReq?.grade}</div>
                <div><span className="font-semibold text-gray-600">Parent Name:</span> {viewSelectedReq?.parentName}</div>
                <div><span className="font-semibold text-gray-600">Parent Email:</span> {viewSelectedReq?.parentEmail || 'Not Provided'}</div>
                <div><span className="font-semibold text-gray-600">Parent Phone:</span> {viewSelectedReq?.phone}</div>
                <div><span className="font-semibold text-gray-600">Address:</span> {viewSelectedReq?.address || 'Not Provided'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-600">Submitted Documents:</span> None (No file attached)</div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;
