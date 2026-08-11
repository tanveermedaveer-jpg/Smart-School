import React, { useState, useEffect } from 'react';
import { Save, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';
import { upsertUser, getAllUsersRaw } from '../../utils/db';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const allUsers = await getAllUsersRaw();
        const userProfile = allUsers.find(u => u.id === authUser.id) || authUser;
        
        setFormData({
          name: userProfile.name || '',
          phone: userProfile.phone || '',
          address: userProfile.address || ''
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
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
      console.error(err);
      toast.error('Failed to change password.');
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
      console.error(err);
      toast.error('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information and contact details.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <ProfileHeaderCard 
          name={formData.name || 'Student'}
          role="Student"
          details={[
            { label: 'Student ID', value: authUser.id || 'N/A' },
            { label: 'Username', value: authUser.username || 'N/A' },
            { label: 'Email', value: authUser.email || 'N/A' },
            { label: 'Phone', value: formData.phone || 'N/A' }
          ]}
        />

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserIcon size={16} className="mr-2 text-gray-400"/> Full Name
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Phone size={16} className="mr-2 text-gray-400"/> Parent Phone Number
              </label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="mr-2 text-gray-400"/> Address
              </label>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none resize-none" 
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Save size={20} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
          <p className="text-gray-500 text-sm mt-1">Ensure your account is using a long, random password to stay secure.</p>
        </div>
        <form onSubmit={handlePasswordSave} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <PasswordInput required name="current" value={passwordData.current} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <PasswordInput required minLength={8} name="new" value={passwordData.new} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" placeholder="Minimum 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <PasswordInput required minLength={8} name="confirm" value={passwordData.confirm} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" placeholder="Must match new password" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Save size={20} />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
