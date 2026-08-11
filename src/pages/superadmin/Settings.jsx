import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';

const Settings = () => {
  const [settings, setSettings] = useState({
    email: 'info@smartschool.com',
    phone: '+92 300 1234567',
    address: '123 Education Street, Lahore, Pakistan',
    mapIframe: ''
  });

  const [emailSecurity, setEmailSecurity] = useState({ currentPassword: '', newEmail: '' });
  const [passwordSecurity, setPasswordSecurity] = useState({ current: '', new: '', confirm: '' });
  const [recoverySecurity, setRecoverySecurity] = useState({ currentPassword: '', newRecoveryCode: '', confirmRecoveryCode: '' });
  const [currentRecoveryCode, setCurrentRecoveryCode] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('siteSettings');
      if (saved) {
        const data = JSON.parse(saved);
        if (data) setSettings(data);
      }
    } catch (error) {
      console.error('Failed to parse siteSettings:', error);
    }
    setCurrentRecoveryCode(localStorage.getItem('superAdminRecoveryCode') || 'SMART-SUPER-2026');
  }, []);

  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('siteSettings', JSON.stringify(settings));
    toast.success('Website settings updated. Changes will reflect on homepage.');
  };

  const handleEmailSecurityChange = (e) => setEmailSecurity({ ...emailSecurity, [e.target.name]: e.target.value });
  const handlePasswordSecurityChange = (e) => setPasswordSecurity({ ...passwordSecurity, [e.target.name]: e.target.value });
  const handleRecoverySecurityChange = (e) => setRecoverySecurity({ ...recoverySecurity, [e.target.name]: e.target.value });

  const saveEmailSecurity = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('superAdminPassword') || 'SuperAdmin123!';
    if (emailSecurity.currentPassword !== storedPassword) {
      toast.error('Invalid Current Password');
      return;
    }
    localStorage.setItem('superAdminEmail', emailSecurity.newEmail);
    toast.success('Super Admin Email updated successfully');
    setEmailSecurity({ currentPassword: '', newEmail: '' });
  };

  const savePasswordSecurity = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('superAdminPassword') || 'SuperAdmin123!';
    if (passwordSecurity.current !== storedPassword) {
      toast.error('Invalid Current Password');
      return;
    }
    if (passwordSecurity.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordSecurity.new !== passwordSecurity.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    localStorage.setItem('superAdminPassword', passwordSecurity.new);
    toast.success('Password updated successfully');
    setPasswordSecurity({ current: '', new: '', confirm: '' });
  };

  const saveRecoverySecurity = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('superAdminPassword') || 'SuperAdmin123!';
    if (recoverySecurity.currentPassword !== storedPassword) {
      toast.error('Invalid Current Password');
      return;
    }
    if (recoverySecurity.newRecoveryCode !== recoverySecurity.confirmRecoveryCode) {
      toast.error('New recovery codes do not match');
      return;
    }
    localStorage.setItem('superAdminRecoveryCode', recoverySecurity.newRecoveryCode);
    setCurrentRecoveryCode(recoverySecurity.newRecoveryCode);
    toast.success('Recovery Code updated successfully');
    setRecoverySecurity({ currentPassword: '', newRecoveryCode: '', confirmRecoveryCode: '' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Website Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-darkBlue mb-6">Website Settings</h3>
          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" name="email" value={settings.email} onChange={handleSettingsChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="text" name="phone" value={settings.phone} onChange={handleSettingsChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
              <textarea rows="2" name="address" value={settings.address} onChange={handleSettingsChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Iframe URL (Optional)</label>
              <input type="text" name="mapIframe" value={settings.mapIframe} onChange={handleSettingsChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" placeholder="https://www.google.com/maps/embed?..." />
            </div>
            <button type="submit" className="mt-4 bg-darkBlue hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Save size={18} />
              <span>Save Settings</span>
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b pb-2">Change Email</h3>
            <form onSubmit={saveEmailSecurity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <PasswordInput required name="currentPassword" value={emailSecurity.currentPassword} onChange={handleEmailSecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                <input required type="email" name="newEmail" value={emailSecurity.newEmail} onChange={handleEmailSecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                <Save size={18} />
                <span>Update Email</span>
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b pb-2">Change Password</h3>
            <form onSubmit={savePasswordSecurity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <PasswordInput required name="current" value={passwordSecurity.current} onChange={handlePasswordSecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <PasswordInput required minLength={8} name="new" value={passwordSecurity.new} onChange={handlePasswordSecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" placeholder="Minimum 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <PasswordInput required name="confirm" value={passwordSecurity.confirm} onChange={handlePasswordSecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                <Save size={18} />
                <span>Update Password</span>
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b pb-2">Change Recovery Code</h3>
            <p className="text-sm text-gray-600 mb-4">Current Recovery Code: <strong>{currentRecoveryCode}</strong></p>
            <form onSubmit={saveRecoverySecurity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <PasswordInput required name="currentPassword" value={recoverySecurity.currentPassword} onChange={handleRecoverySecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Recovery Code</label>
                <input required type="text" name="newRecoveryCode" value={recoverySecurity.newRecoveryCode} onChange={handleRecoverySecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Recovery Code</label>
                <input required type="text" name="confirmRecoveryCode" value={recoverySecurity.confirmRecoveryCode} onChange={handleRecoverySecurityChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" />
              </div>
              <button type="submit" className="bg-darkBlue hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                <Save size={18} />
                <span>Update Recovery Code</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
