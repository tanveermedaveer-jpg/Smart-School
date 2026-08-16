import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';
import { saveSchoolAdmins, getAllUsersRaw, getSchools, deleteUser } from '../../utils/db';

const SchoolAdmins = () => {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetAdminId, setResetAdminId] = useState(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    schoolId: '',
    status: 'Active',
    role: 'school_admin'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        // Load all school admin users from Firestore users collection
        const allUsers = await getAllUsersRaw();
        setUsers(allUsers.filter(u => {
          const r = (u.role || '').toString().toLowerCase().replace(/[\s_]/g, '');
          return r === 'schooladmin' || r === 'schoolAdmin' || r === 'admin';
        }));
        
        // Load schools for selection dropdown
        const allSchools = await getSchools();
        setSchools(allSchools);
      } catch (err) {
        console.error('Error loading school admins:', err);
        toast.error('Failed to load school admins.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const saveToDb = async (updatedAdmins) => {
    try {
      const safeAdmins = updatedAdmins.map(u => ({
        ...u,
        id: u.id.toString(),
        schoolId: u.schoolId.toString()
      }));
      await saveSchoolAdmins(safeAdmins);
      setUsers(safeAdmins);
    } catch (err) {
      console.error('Error saving school admins:', err);
      toast.error('Failed to save changes to Firestore.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === 'schoolId' && value && !editingId) {
      const selectedSchool = schools.find(s => s.id.toString() === value.toString());
      if (selectedSchool) {
        const schoolNameSanitized = selectedSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        updatedFormData.username = `admin_${schoolNameSanitized}`;
      }
    }
    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedSchool = schools.find(s => s.id?.toString() === formData.schoolId?.toString());
    const schoolName = selectedSchool ? selectedSchool.name : (formData.schoolName || '');
    
    if (editingId) {
      const updated = users.map(u => u.id === editingId ? { ...formData, schoolName, id: editingId } : u);
      await saveToDb(updated);
      toast.success('School Admin updated successfully');
    } else {
      const newAdmin = { ...formData, schoolName, id: Date.now().toString(), isTemporaryPassword: false, role: 'schoolAdmin' };
      await saveToDb([...users, newAdmin]);
      toast.success('School Admin created successfully');
    }
    closeModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this admin account?')) {
      try {
        await deleteUser(id);
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        toast.success('School Admin deleted successfully');
      } catch (err) {
        console.error('Error deleting school admin:', err);
        toast.error('Failed to delete school admin');
      }
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        password: '',
        schoolId: user.schoolId || '',
        status: user.status || 'Active',
        role: user.role || 'school_admin'
      });
      setEditingId(user.id);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        schoolId: '',
        status: 'Active',
        role: 'school_admin'
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openResetModal = (id) => {
    setResetAdminId(id);
    setNewTempPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newTempPassword || newTempPassword.length < 8) {
      toast.error('Temporary password must be at least 8 characters');
      return;
    }
    const updatedUsers = users.map(u => u.id === resetAdminId ? { ...u, password: newTempPassword, isTemporaryPassword: false } : u);
    await saveToDb(updatedUsers);
    toast.success('Password reset successfully.');
    setIsResetModalOpen(false);
    setResetAdminId(null);
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find(s => s.id.toString() === schoolId.toString());
    return school ? school.name : 'Unknown School';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">School Admins</h2>
        <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>Add New Admin</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoadingData ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
            Loading school admins...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No School Admins added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Admin Info</th>
                  <th className="p-4 font-semibold">Assigned School</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-darkBlue">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{getSchoolName(user.schoolId)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => openResetModal(user.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex" title="Reset Password">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Admin' : 'Add New Admin'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign School</label>
                  <select required name="schoolId" value={formData.schoolId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="">-- Select School --</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input required type="text" name="username" value={formData.username} onChange={handleInputChange} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <PasswordInput required={!editingId} name="password" value={formData.password} onChange={handleInputChange} autoComplete="new-password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="px-2 py-1 border border-gray-300 rounded text-sm outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Reset Password</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Set a new temporary password. The admin will be required to change it on their next login.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input required minLength={8} type="text" value={newTempPassword} onChange={(e) => setNewTempPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" placeholder="Minimum 8 characters" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdmins;
