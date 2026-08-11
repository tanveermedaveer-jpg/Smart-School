import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, DollarSign, Layers, BookOpen, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';

const FeeStructure = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    classId: '', // ID of the class row
    monthlyFee: '',
    admissionFee: '',
    examFee: '',
    computerFee: '',
    transportFee: '',
    annualCharges: '',
    academicSession: '2026-2027',
    dueDate: '2026-08-15',
    notes: '',
    status: 'Active'
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [searchQuery, setSearchQuery] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedStructures = JSON.parse(localStorage.getItem('schoolAdminFeeStructures') || '[]');
    setFeeStructures(savedStructures);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);
  };

  const saveToLocal = (updatedStructures) => {
    setFeeStructures(updatedStructures);
    localStorage.setItem('schoolAdminFeeStructures', JSON.stringify(updatedStructures));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (parseFloat(formData.monthlyFee) < 0 || 
        parseFloat(formData.admissionFee || 0) < 0 ||
        parseFloat(formData.examFee || 0) < 0 ||
        parseFloat(formData.computerFee || 0) < 0 ||
        parseFloat(formData.transportFee || 0) < 0 ||
        parseFloat(formData.annualCharges || 0) < 0) {
      toast.error('Fee amounts cannot be negative');
      return;
    }

    const payload = {
      ...formData,
      schoolId: schoolId
    };

    if (!editingId) {
      // Check for duplicate class structure
      const exists = feeStructures.some(fs => fs.classId?.toString() === payload.classId?.toString() && fs.academicSession === payload.academicSession);
      if (exists) {
        toast.error('A fee structure for this class section already exists for this session.');
        return;
      }
    } else {
      const exists = feeStructures.some(fs => fs.classId?.toString() === payload.classId?.toString() && fs.academicSession === payload.academicSession && fs.id !== editingId);
      if (exists) {
        toast.error('A fee structure for this class section already exists for this session.');
        return;
      }
    }

    if (editingId) {
      const updated = feeStructures.map(fs => fs.id === editingId ? { ...payload, id: editingId } : fs);
      saveToLocal(updated);
      toast.success('Fee structure updated successfully');
    } else {
      const newStructure = { ...payload, id: Date.now() };
      saveToLocal([...feeStructures, newStructure]);
      toast.success('Fee structure created successfully');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      saveToLocal(feeStructures.filter(fs => fs.id !== id));
      toast.success('Fee structure deleted');
    }
  };

  const openModal = (structure = null) => {
    if (structure) {
      setFormData(structure);
      setEditingId(structure.id);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown Class';
  };

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = feeStructures.map(fs => fs.id === id ? { ...fs, status: newStatus } : fs);
    saveToLocal(updated);
    toast.success(`Fee structure marked as ${newStatus}`);
  };

  const filteredStructures = feeStructures.filter(fs => {
    const clsName = getClassName(fs.classId).toLowerCase();
    return clsName.includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fee Structure</h2>
          <p className="text-gray-500 text-sm mt-1">Manage standard fee structures for each class section and session.</p>
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            placeholder="Search by Class..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none text-xs hidden md:block"
          />
          <ExportButtons tableId="export-table" filename="Fee Structures" />
          <button onClick={() => openModal()} className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm text-xs">
            <Plus size={16} />
            <span>Add Structure</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredStructures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No fee structures configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Class Section</th>
                  <th className="p-4 font-semibold">Monthly Tuition</th>
                  <th className="p-4 font-semibold">Admission Fee</th>
                  <th className="p-4 font-semibold">Exam Fee</th>
                  <th className="p-4 font-semibold">Session</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {filteredStructures.map((fs) => {
                  const monthly = parseFloat(fs.monthlyFee) || 0;
                  const admission = parseFloat(fs.admissionFee) || 0;
                  const exam = parseFloat(fs.examFee) || 0;

                  return (
                    <tr key={fs.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-darkBlue flex items-center space-x-2">
                        <Layers size={16} className="text-gray-400" />
                        <span>{getClassName(fs.classId)}</span>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">Rs. {monthly.toFixed(2)}</td>
                      <td className="p-4">Rs. {admission.toFixed(2)}</td>
                      <td className="p-4">Rs. {exam.toFixed(2)}</td>
                      <td className="p-4 font-semibold text-gray-600">{fs.academicSession}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleStatus(fs.id, fs.status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            fs.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {fs.status}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openModal(fs)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(fs.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Section</label>
                  <select required name="classId" value={formData.classId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="">-- Select Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Tuition Fee (Required)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input required type="number" min="0" step="0.01" name="monthlyFee" value={formData.monthlyFee} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input type="number" min="0" step="0.01" name="admissionFee" value={formData.admissionFee} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Fee (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input type="number" min="0" step="0.01" name="examFee" value={formData.examFee} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Computer Fee (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input type="number" min="0" step="0.01" name="computerFee" value={formData.computerFee} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input type="number" min="0" step="0.01" name="transportFee" value={formData.transportFee} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Charges (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={16}/></span>
                    <input type="number" min="0" step="0.01" name="annualCharges" value={formData.annualCharges} onChange={handleInputChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
                  <input readOnly type="text" name="academicSession" value={formData.academicSession} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <input type="text" name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" placeholder="Any additional notes..." />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructure;
