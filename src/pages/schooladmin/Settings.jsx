import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Building, Image as ImageIcon, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';
import { persistUserUpdate } from '../../utils/db';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    schoolName: '',
    schoolTagline: '',
    academicSession: '2025-2026',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    bannerUrl: ''
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('schoolAdminSettings') || '{}');
    if (Object.keys(saved).length > 0) {
      setSettings(prev => ({ ...prev, ...saved }));
    }
  }, []);

  const handlePasswordDataChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const savePassword = (e) => {
    e.preventDefault();
    
    if (passwordData.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    if (!authUser || authUser.password !== passwordData.current) {
      toast.error('Invalid current password');
      return;
    }

    // Use db.js persistUserUpdate — writes to both 'users' and 'schoolAdminUsers'
    const updatedUser = { ...authUser, password: passwordData.new };
    persistUserUpdate(updatedUser);

    sessionStorage.setItem('authUser', JSON.stringify(updatedUser));

    toast.success('Password updated successfully');
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const handleInputChange = (e) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate network delay
    setTimeout(() => {
      localStorage.setItem('schoolAdminSettings', JSON.stringify(settings));
      toast.success('School settings saved successfully');
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">School Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage school profile, branding, and academic session.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center space-x-3 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === 'general' ? 'border-greenAccent bg-green-50/30 text-green-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <Building size={20} className={activeTab === 'general' ? 'text-greenAccent' : 'text-gray-400'} />
              <span>General Info</span>
            </button>
            <div className="h-px bg-gray-100 w-full" />
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center space-x-3 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === 'branding' ? 'border-greenAccent bg-green-50/30 text-green-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <ImageIcon size={20} className={activeTab === 'branding' ? 'text-greenAccent' : 'text-gray-400'} />
              <span>Branding</span>
            </button>
            <div className="h-px bg-gray-100 w-full" />
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center space-x-3 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === 'contact' ? 'border-greenAccent bg-green-50/30 text-green-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <MapPin size={20} className={activeTab === 'contact' ? 'text-greenAccent' : 'text-gray-400'} />
              <span>Contact Info</span>
            </button>
            <div className="h-px bg-gray-100 w-full" />
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-3 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === 'security' ? 'border-greenAccent bg-green-50/30 text-green-700 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${activeTab === 'security' ? 'text-greenAccent' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Security</span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">School Information</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                      <input type="text" name="schoolName" value={settings.schoolName} onChange={handleInputChange} placeholder="e.g. Springfield High School" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tagline or Motto</label>
                      <input type="text" name="schoolTagline" value={settings.schoolTagline} onChange={handleInputChange} placeholder="e.g. Excellence in Education" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Session</label>
                      <select name="academicSession" value={settings.academicSession} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all bg-white">
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Visual Identity</h3>
                  <div className="grid grid-cols-1 gap-8">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                      <div className="flex items-start space-x-6">
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="text-gray-400 w-8 h-8" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logoUrl')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors" />
                          <p className="text-xs text-gray-500 mt-2">Recommended size: 250x250px. Max size: 2MB.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Banner</label>
                      <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative mb-4">
                        {settings.bannerUrl ? (
                          <img src={settings.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">No banner uploaded</span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerUrl')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                      <p className="text-xs text-gray-500 mt-2">Used as the background in the public directory. Recommended size: 1920x1080px.</p>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input type="email" name="email" value={settings.email} onChange={handleInputChange} placeholder="info@school.edu" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="tel" name="phone" value={settings.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                      <textarea name="address" value={settings.address} onChange={handleInputChange} rows="3" placeholder="123 Education Lane, City, State, ZIP" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none transition-all resize-none"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Change Password</h3>
                  <form onSubmit={savePassword} className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <PasswordInput required name="current" value={passwordData.current} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <PasswordInput required minLength={8} name="new" value={passwordData.new} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" placeholder="Minimum 8 characters" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <PasswordInput required minLength={8} name="confirm" value={passwordData.confirm} onChange={handlePasswordDataChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" placeholder="Must match new password" />
                    </div>
                    <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
