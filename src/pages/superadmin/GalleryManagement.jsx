import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Check, EyeOff, Filter, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSchools, saveSchools, getGallery, updateGalleryImage, deleteGalleryImage } from '../../utils/db';

const GalleryManagement = () => {
  const [schools, setSchools] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [schoolFilter, setSchoolFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const schoolsData = await getSchools();
      setSchools(schoolsData);
      
      const galleryData = await getGallery();
      setGalleryItems(galleryData);
      setFilteredItems(galleryData);
    } catch (err) {
      console.error('Error loading gallery management data:', err);
      toast.error('Failed to load gallery data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle filtering
  useEffect(() => {
    let items = [...galleryItems];
    if (schoolFilter) {
      items = items.filter(item => item.schoolId && item.schoolId.toString() === schoolFilter.toString());
    }
    if (categoryFilter) {
      items = items.filter(item => item.category === categoryFilter);
    }
    setFilteredItems(items);
  }, [schoolFilter, categoryFilter, galleryItems]);

  const handleImageUpdate = async (schoolId, type, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const updatedSchools = schools.map(s => {
          if (s.id === schoolId) {
            return { ...s, [type]: reader.result };
          }
          return s;
        });
        setSchools(updatedSchools);
        await saveSchools(updatedSchools);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
        loadData();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async (schoolId, type) => {
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
      await saveSchools(updatedSchools);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      loadData();
    }
  };

  // General Gallery Actions
  const handleTogglePublish = async (item) => {
    const newStatus = item.status === 'published' ? 'hidden' : 'published';
    try {
      const res = await updateGalleryImage(item.id, { status: newStatus });
      if (res) {
        toast.success(`Image status updated to ${newStatus}`);
        loadData();
      } else {
        toast.error('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating image status.');
    }
  };

  const handleDeleteGalleryItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      try {
        const success = await deleteGalleryImage(id);
        if (success) {
          toast.success('Gallery item deleted successfully');
          loadData();
        } else {
          toast.error('Failed to delete item.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting item.');
      }
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

        {/* General Galleries Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-darkBlue">School Gallery Portfolios</h3>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-sm">
                <Filter size={16} className="text-gray-400" />
                <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="bg-transparent border-0 outline-none pr-4 text-gray-700">
                  <option value="">All Schools</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-sm">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent border-0 outline-none pr-4 text-gray-700">
                  <option value="">All Categories</option>
                  <option value="School Logo">School Logo</option>
                  <option value="School Banner">School Banner</option>
                  <option value="Campus">Campus</option>
                  <option value="Events">Events</option>
                  <option value="Activities">Activities</option>
                  <option value="Achievements">Achievements</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <span className="animate-spin inline-block rounded-full h-6 w-6 border-b-2 border-darkBlue mr-2"></span>
              Loading gallery items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl text-gray-400">
              <ImageIcon size={40} className="mx-auto mb-3 opacity-60" />
              <p>No gallery items found matching filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map(item => {
                const school = schools.find(s => s.id?.toString() === item.schoolId?.toString());
                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-150 overflow-hidden flex flex-col group relative">
                    <div className="aspect-[4/3] w-full bg-gray-200 relative overflow-hidden">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        {item.category || 'Other'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-800 line-clamp-1" title={item.title}>{item.title}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                          School: {school ? school.name : 'Unknown School'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'published' ? 'Published' : 'Hidden'}
                        </span>
                        
                        <div className="flex space-x-2">
                          <button onClick={() => handleTogglePublish(item)} className={`p-1.5 rounded transition-colors ${
                            item.status === 'published' 
                              ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600' 
                              : 'bg-green-50 hover:bg-green-100 text-green-600'
                          }`} title={item.status === 'published' ? 'Hide / Unpublish' : 'Approve / Publish'}>
                            {item.status === 'published' ? <EyeOff size={14} /> : <Check size={14} />}
                          </button>
                          <button onClick={() => handleDeleteGalleryItem(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors" title="Delete Permanent">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GalleryManagement;
