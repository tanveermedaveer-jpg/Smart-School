import React, { useState, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GalleryManagement = () => {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('schools') || '[]');
    setSchools(data);
  }, []);

  const handleImageUpdate = (schoolId, type, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedSchools = schools.map(s => {
          if (s.id === schoolId) {
            return { ...s, [type]: reader.result };
          }
          return s;
        });
        setSchools(updatedSchools);
        localStorage.setItem('schools', JSON.stringify(updatedSchools));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (schoolId, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      const updatedSchools = schools.map(s => {
        if (s.id === schoolId) {
          const updatedSchool = { ...s };
          delete updatedSchool[type];
          return updatedSchool;
        }
        return s;
      });
      setSchools(updatedSchools);
      localStorage.setItem('schools', JSON.stringify(updatedSchools));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gallery Management</h2>
      
      <div className="space-y-8">
        
        {/* School Banners */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-darkBlue mb-4">Uploaded School Banners</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {schools.filter(s => s.banner).length === 0 && <p className="text-gray-400 text-sm">No banners uploaded yet. Upload via Schools Management.</p>}
            {schools.filter(s => s.banner).map(school => (
              <div key={`banner-${school.id}`} className="relative border rounded-lg overflow-hidden group aspect-video">
                <img src={school.banner} alt={school.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3">
                  <span className="text-white text-sm font-medium px-2 text-center line-clamp-1">{school.name}</span>
                  <div className="flex space-x-3">
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors shadow-sm" title="Replace Banner">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpdate(school.id, 'banner', e.target.files[0])} />
                      <Edit2 size={16} />
                    </label>
                    <button onClick={() => handleDeleteImage(school.id, 'banner')} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors shadow-sm" title="Delete Banner">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Logos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-darkBlue mb-4">Uploaded School Logos</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {schools.filter(s => s.logo).length === 0 && <p className="text-gray-400 text-sm">No logos uploaded yet. Upload via Schools Management.</p>}
            {schools.filter(s => s.logo).map(school => (
              <div key={`logo-${school.id}`} className="relative border rounded-lg overflow-hidden group aspect-square flex items-center justify-center p-2 bg-gray-50">
                <img src={school.logo} alt={school.name} className="max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center space-y-3">
                  <span className="text-white text-xs font-medium px-1 line-clamp-1">{school.name}</span>
                  <div className="flex space-x-2">
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-lg transition-colors shadow-sm" title="Replace Logo">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpdate(school.id, 'logo', e.target.files[0])} />
                      <Edit2 size={14} />
                    </label>
                    <button onClick={() => handleDeleteImage(school.id, 'logo')} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors shadow-sm" title="Delete Logo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GalleryManagement;
