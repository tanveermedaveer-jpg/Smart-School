import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Calendar, Award } from 'lucide-react';

const ChildProfile = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childInfo, setChildInfo] = useState(null);
  const [className, setClassName] = useState('');
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const myChildren = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.parentId?.toString() === authUser.id?.toString() || 
       (authUser.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );
    setChildren(myChildren);

    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id.toString());
    }
  }, [authUser.id]);

  useEffect(() => {
    if (selectedChildId) {
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const child = users.find(u => u.id.toString() === selectedChildId);
      setChildInfo(child);
      
      if (child) {
        const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
        const studentClass = classes.find(c => c.id?.toString() === child.classId?.toString());
        if (studentClass) {
          setClassName(`${studentClass.className} - ${studentClass.section}`);
        } else {
          setClassName('Not Assigned');
        }
      }
    } else {
      setChildInfo(null);
      setClassName('');
    }
  }, [selectedChildId]);

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 text-xs">
        No child account is linked to your profile. Please contact the school administration.
      </div>
    );
  }

  const getClassName = (classId) => {
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = classes.find(c => c.id?.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Child Profile Details</h2>
          <p className="text-gray-500 text-sm mt-1">Review academic information and enrollment files for your children.</p>
        </div>
      </div>

      {/* Select Child Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id.toString())}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${selectedChildId === child.id.toString() ? 'bg-white text-darkBlue shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {child.name} ({getClassName(child.classId)})
          </button>
        ))}
      </div>

      {childInfo && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-darkBlue px-8 py-6 text-white flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 overflow-hidden">
              {childInfo.photo ? <img src={childInfo.photo} alt="Child" className="w-full h-full object-cover" /> : <User size={40} />}
            </div>
            <div>
              <h3 className="text-xl font-bold">{childInfo.name}</h3>
              <p className="text-blue-200 text-xs mt-1">Admission ID / Roll No: {childInfo.rollNumber}</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center">
                  <Building size={14} className="mr-1 text-greenAccent"/> Current Class Placement
                </label>
                <p className="font-semibold text-gray-800">{className}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center">
                  <Phone size={14} className="mr-1 text-greenAccent"/> Parent Phone Number
                </label>
                <p className="font-semibold text-gray-800">{childInfo.phone || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center">
                  <Calendar size={14} className="mr-1 text-greenAccent"/> Date of Birth
                </label>
                <p className="font-semibold text-gray-800">{childInfo.dob || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center">
                  <Award size={14} className="mr-1 text-greenAccent"/> Gender
                </label>
                <p className="font-semibold text-gray-800">{childInfo.gender || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center">
                  <MapPin size={14} className="mr-1 text-greenAccent"/> Home Address
                </label>
                <p className="font-semibold text-gray-800">{childInfo.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildProfile;
