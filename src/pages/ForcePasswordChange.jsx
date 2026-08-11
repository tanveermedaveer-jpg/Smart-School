import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';
import { persistUserUpdate, normalizeRole } from '../utils/db';

const ForcePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const tempAuthUserString = sessionStorage.getItem('tempAuthUser');
  const tempAuthUser = tempAuthUserString ? JSON.parse(tempAuthUserString) : null;

  useEffect(() => {
    if (!tempAuthUser) {
      navigate('/login');
    }
  }, [tempAuthUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tempAuthUser) return;

    if (currentPassword !== tempAuthUser.password) {
      toast.error('Current password is incorrect.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    // Update in the appropriate storage
    if (tempAuthUser.role === 'Super Admin' || tempAuthUser.role === 'superAdmin') {
      localStorage.setItem('superAdminPassword', newPassword);
      localStorage.setItem('superAdminIsTemporary', 'false');
      
      sessionStorage.removeItem('tempAuthUser');
      sessionStorage.setItem('superAdminAuth', 'true');
      
      toast.success('Password changed successfully. Welcome!');
      navigate('/super-admin/dashboard');
    } else {
      const updatedUser = { ...tempAuthUser, password: newPassword, isTemporaryPassword: false };

      // Use db.js persistUserUpdate — writes to both 'users' and 'schoolAdminUsers'
      persistUserUpdate(updatedUser);

      // Login the user fully
      sessionStorage.removeItem('tempAuthUser');
      sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      
      toast.success('Password changed successfully. Welcome!');
      
      // Redirect to appropriate dashboard
      const role = normalizeRole(updatedUser.role);
      if (role === 'schoolAdmin') {
        navigate('/school-admin/dashboard');
      } else if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  if (!tempAuthUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-yellow-500 mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Action Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg mx-4 sm:mx-0">
          For your security, this is a temporary password. Please create your own password before continuing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1">
                <PasswordInput 
                  required 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-greenAccent focus:border-greenAccent sm:text-sm bg-white" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <PasswordInput 
                  required 
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-greenAccent focus:border-greenAccent sm:text-sm bg-white" 
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <PasswordInput 
                  required 
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-greenAccent focus:border-greenAccent sm:text-sm bg-white" 
                  placeholder="Must match new password"
                />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkBlue hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkBlue transition-colors">
                Change Password & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
