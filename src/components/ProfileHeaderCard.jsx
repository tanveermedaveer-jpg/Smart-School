import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, CheckCircle, Mail, Phone, Building2, Hash, Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/db';
// Removed Firebase imports, using HTTP fetch to Node.js backend

const ProfileHeaderCard = ({ name, role, status = 'Active', details = [] }) => {
  const authUserString = sessionStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  
  const [avatar, setAvatar] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      if (authUser && authUser.id) {
        try {
          const token = sessionStorage.getItem('jwtToken');
          const res = await fetch(`${BASE_URL}/users/${authUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            if (userData.profilePhoto) {
              setAvatar(userData.profilePhoto);
              
              // Sync with session storage if out of sync
              if (authUser.profilePhoto !== userData.profilePhoto) {
                const updatedSession = { ...authUser, profilePhoto: userData.profilePhoto };
                sessionStorage.setItem('authUser', JSON.stringify(updatedSession));
                window.dispatchEvent(new Event('avatarUpdate'));
              }
            } else {
              setAvatar(null);
            }
          }
        } catch (error) {
          console.warn('Failed to load profile photo from backend:', error);
          if (authUser.profilePhoto) {
            setAvatar(authUser.profilePhoto);
          }
        }
      }
    };
    loadProfileImage();
  }, [authUser?.id]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, JPEG, PNG).');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setAvatar(base64String);

        if (authUser && authUser.id) {
          try {
            const token = sessionStorage.getItem('jwtToken');
            const res = await fetch(`${BASE_URL}/users/${authUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ profilePhoto: base64String })
            });
            
            if (res.ok) {
              const updatedSession = { ...authUser, profilePhoto: base64String };
              sessionStorage.setItem('authUser', JSON.stringify(updatedSession));
              
              // Notify layouts to update their header avatars instantly
              window.dispatchEvent(new Event('avatarUpdate'));
              toast.success('Profile picture updated successfully.');
            } else {
              throw new Error('Failed to update profile picture');
            }
          } catch (error) {
            console.error('Failed to save profile picture in backend:', error);
            toast.error('Failed to save profile picture permanently.');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAvatar = async (e) => {
    e.stopPropagation(); // Prevent trigger file upload click
    if (window.confirm('Are you sure you want to permanently delete your profile picture?')) {
      try {
        setAvatar(null);
        if (authUser && authUser.id) {
          const token = sessionStorage.getItem('jwtToken');
          const res = await fetch(`${BASE_URL}/users/${authUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profilePhoto: null })
          });
          
          if (res.ok) {
            const updatedSession = { ...authUser, profilePhoto: null };
            sessionStorage.setItem('authUser', JSON.stringify(updatedSession));
            
            window.dispatchEvent(new Event('avatarUpdate'));
            toast.success('Profile picture deleted successfully.');
          } else {
            throw new Error('Failed to delete profile picture');
          }
        }
      } catch (error) {
        console.error('Failed to delete profile picture from backend:', error);
        toast.error('Failed to delete profile picture.');
      }
    }
  };

  const getIconForLabel = (label) => {
    const l = label.toLowerCase();
    if (l.includes('email')) return <Mail size={14} className="text-slate-400 shrink-0" />;
    if (l.includes('phone')) return <Phone size={14} className="text-slate-400 shrink-0" />;
    if (l.includes('school name') || l.includes('school')) return <Building2 size={14} className="text-slate-400 shrink-0" />;
    if (l.includes('code')) return <Hash size={14} className="text-slate-400 shrink-0" />;
    return null;
  };

  return (
    <div className="profile-card-premium rounded-2xl overflow-hidden mb-8 flex flex-col md:flex-row items-center p-6 md:p-8 space-y-6 md:space-y-0 md:space-x-8">
      
      {/* Avatar Section */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="relative group">
          <div 
            onClick={handleAvatarClick}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center cursor-pointer relative"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover animate-fade-in" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <UserIcon size={40} className="text-slate-400" />
              </div>
            )}
            {status === 'Active' && (
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
            )}
          </div>
          
          {/* Delete profile picture button - only shows when mouse hovers over avatar container */}
          {avatar && (
            <button 
              onClick={handleDeleteAvatar}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full border border-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 hover:scale-110 active:scale-95"
              title="Delete Profile Picture"
            >
              <Trash2 size={12} />
            </button>
          )}

          {/* Subtle edit photo trigger button with Camera icon */}
          <button 
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white hover:bg-slate-50 text-slate-700 rounded-full border border-slate-200/80 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-10"
            title="Update Profile Picture"
          >
            <Camera size={14} className="text-slate-600" />
          </button>
        </div>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".jpg,.jpeg,.png" 
          className="hidden" 
        />
      </div>

      {/* Main Info */}
      <div className="flex-1 text-center md:text-left w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">{name}</h2>
            <div className="flex items-center justify-center md:justify-start mt-2.5 space-x-3">
              <span className="px-3.5 py-1 bg-darkBlue text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                {role}
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle size={12} className="mr-1" />
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-slate-200/60">
          {details.map((detail, idx) => (
            <div key={idx} className="flex flex-col bg-white/40 dark:bg-black/10 p-3.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center space-x-1.5">
                {getIconForLabel(detail.label)}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{detail.label}</span>
              </div>
              <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 mt-2 break-words">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default ProfileHeaderCard;
