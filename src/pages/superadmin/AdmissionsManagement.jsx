import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdmissions, saveAdmissions, getSchools } from '../../utils/db';
const AdmissionsManagement = () => {
  const [admissions, setAdmissions] = useState([]);
  const [schools, setSchools] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getAdmissions();
        setAdmissions(data);
        localStorage.setItem('admissions', JSON.stringify(data));

        const schoolsData = await getSchools();
        const schoolMap = schoolsData.reduce((acc, school) => {
          acc[school.id] = school.name;
          return acc;
        }, {});
        setSchools(schoolMap);
      } catch (err) {
        console.error('Error loading admissions data:', err);
        toast.error('Failed to load admissions from database.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const updated = admissions.map(a => a.id === id ? { ...a, status: newStatus } : a);
      await saveAdmissions(updated);
      setAdmissions(updated);
      localStorage.setItem('admissions', JSON.stringify(updated));
      toast.success(`Application ${newStatus.toLowerCase()}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this admission?')) {
      try {
        const updated = admissions.filter(a => a.id !== id);
        await saveAdmissions(updated);
        setAdmissions(updated);
        localStorage.setItem('admissions', JSON.stringify(updated));
        toast.success('Admission deleted successfully');
      } catch (err) {
        console.error('Error deleting admission:', err);
        toast.error('Failed to delete admission from database.');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admissions Management</h2>
        <ExportButtons tableId="export-table" filename="Admissions Management" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
            Loading applications...
          </div>
        ) : admissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No admission applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Class</th>
                  <th className="p-4 font-semibold">Target School</th>
                  <th className="p-4 font-semibold">Parent Info</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {admissions.map((app) => (
                  <tr key={app.id} className="border-b border-gray-55 hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(app.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-darkBlue">{app.studentName}</td>
                    <td className="p-4">{app.class}</td>
                    <td className="p-4">{schools[app.schoolId] || 'Unknown School'}</td>
                    <td className="p-4">
                      <div>{app.parentName}</div>
                      <div className="text-gray-500 text-xs">{app.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {app.status === 'Pending' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'Approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex" title="Approve">
                            <Check size={16} />
                          </button>
                          <button onClick={() => updateStatus(app.id, 'Rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Reject">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(app.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete Admission">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmissionsManagement;
