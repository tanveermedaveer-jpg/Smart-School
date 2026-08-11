import React, { useState, useEffect } from 'react';
import { Save, User as UserIcon, Mail, Phone, MapPin, AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';
import { upsertUser, getAllUsersRaw } from '../../utils/db';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    photo: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsersRaw();
      const userProfile = allUsers.find(u => u.id?.toString() === authUser.id?.toString()) || authUser;
      
      if (!userProfile || !userProfile.id) {
        throw new Error("Unable to retrieve Parent user profile details from current active session.");
      }

      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        photo: userProfile.profilePhoto || userProfile.photo || ''
      });

      // Query linked children/students
      const linkedChildren = allUsers.filter(u => 
        u.role?.toLowerCase() === 'student' && 
        (u.id?.toString() === userProfile.studentId?.toString() || 
         u.parentId?.toString() === userProfile.id?.toString() ||
         (userProfile.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
      );
      setChildren(linkedChildren);
      setLoading(false);
    } catch (err) {
      console.error("Profile load error:", err);
      setError(err.message || "Failed to load parent profile information.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [authUser.id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordDataChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.current !== authUser.password) {
      toast.error('Invalid current password');
      return;
    }

    try {
      const updatedUser = { ...authUser, password: passwordData.new };
      await upsertUser(updatedUser);
      sessionStorage.setItem('authUser', JSON.stringify(updatedUser));

      toast.success('Password changed successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error('Failed to change password');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = { ...authUser, ...formData };
      await upsertUser(updatedUser);
      sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to save profile changes');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw size={40} className="text-darkBlue animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading profile details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Profile Loading Failed</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
        <button 
          onClick={loadProfileData}
          className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center space-x-2"
        >
          <RefreshCw size={14} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeaderCard 
        name={formData.name || 'Parent'}
        role="Parent User"
        details={[
          { label: 'Parent ID', value: authUser.id || 'N/A' },
          { label: 'Username', value: authUser.username || 'N/A' },
          { label: 'Email', value: authUser.email || 'N/A' },
          { label: 'Phone', value: formData.phone || 'N/A' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Edit Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider">Profile Information</h3>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-greenAccent transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-greenAccent transition-all" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Home Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm resize-none focus:border-greenAccent transition-all" 
                ></textarea>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md flex items-center space-x-2">
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Linked Children Side Widget */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col">
            <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
              <GraduationCap className="mr-2 text-greenAccent" size={20} />
              Linked Children
            </h3>
            
            <div className="space-y-3 flex-1">
              {children.length > 0 ? children.map((child, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold uppercase text-sm shrink-0">
                    {child.name?.charAt(0) || 'C'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">{child.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {child.id}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No children linked to this parent profile.
                </div>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider">Update Password</h3>
            </div>
            <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Password</label>
                <PasswordInput required name="current" value={passwordData.current} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-greenAccent transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">New Password</label>
                <PasswordInput required minLength={8} name="new" value={passwordData.new} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-greenAccent transition-all" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Confirm Password</label>
                <PasswordInput required minLength={8} name="confirm" value={passwordData.confirm} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-greenAccent transition-all" placeholder="Match new password" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md flex items-center space-x-2">
                  <Save size={15} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
