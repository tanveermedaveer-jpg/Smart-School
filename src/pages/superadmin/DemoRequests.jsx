import React, { useEffect, useState } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DemoRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('demoRequests') || '[]');
    setRequests(data);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Delete this demo request?')) {
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      localStorage.setItem('demoRequests', JSON.stringify(updated));
      toast.success('Demo request deleted');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Demo Requests</h2>
      
      <ExportButtons tableId="export-table" filename="Demo Requests" /></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No demo requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">School Name</th>
                  <th className="p-4 font-semibold">Contact Info</th>
                  <th className="p-4 font-semibold">Students</th>
                  <th className="p-4 font-semibold">Message</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(req.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-darkBlue">{req.name}</td>
                    <td className="p-4">{req.schoolName}</td>
                    <td className="p-4">
                      <div>{req.email}</div>
                      <div className="text-gray-500 text-xs">{req.phone}</div>
                    </td>
                    <td className="p-4">{req.students}</td>
                    <td className="p-4 max-w-xs truncate" title={req.message}>{req.message || '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(req.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete">
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

export default DemoRequests;
