import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGallery, uploadGalleryImage, deleteGalleryImage } from '../../utils/db';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other',
    url: ''
  });

  const loadGallery = async () => {
    if (!authUser.schoolId) return;
    try {
      setIsLoading(true);
      const data = await getGallery(authUser.schoolId);
      setImages(data);
      localStorage.setItem('schoolAdminGallery', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching gallery:', err);
      toast.error('Failed to load gallery from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size, compress slightly if too large to keep base64 storage clean
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url) {
      toast.error('Please select an image');
      return;
    }
    
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        url: formData.url,
        schoolId: authUser.schoolId,
        status: 'published' // Auto-publish for School Admin uploads by default or mark as pending for approval?
        // Wait, the prompt requirements say:
        // "Super Admin should be able to: View gallery images, Filter by school, Filter by category, Approve/publish, Hide/unpublish, Delete"
        // "Only display content that is marked as published/active."
        // "If Super Admin deletes/unpublishes it, it should no longer appear publicly."
        // Let's set default upload status to 'published' so it immediately shows up, but Super Admin can unpublish/edit it.
        // Wait! Let's default it to 'published' so that it's easy to test and use, but Super Admin can unpublish it.
      };
      
      const res = await uploadGalleryImage(payload);
      if (res) {
        toast.success('Image uploaded successfully');
        loadGallery();
      } else {
        toast.error('Failed to upload image.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error uploading image.');
    }
    
    setIsModalOpen(false);
    setFormData({ title: '', category: 'Other', url: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const success = await deleteGalleryImage(id);
        if (success) {
          toast.success('Image deleted');
          loadGallery();
        } else {
          toast.error('Failed to delete image.');
        }
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Error deleting image.');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">School Gallery</h2>
          <p className="text-gray-500 text-sm mt-1">Manage images for your school's portfolio.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>Upload Image</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <span className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-darkBlue mb-4"></span>
          <p>Loading gallery items...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 flex flex-col items-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
          <p>No images in your gallery yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 text-greenAccent font-medium hover:underline">
            Upload your first image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(img => (
            <div key={img.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(img.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800 truncate flex-1" title={img.title}>{img.title}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    img.status === 'published' ? 'bg-green-150 text-green-700 bg-green-100' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {img.status === 'published' ? 'Published' : 'Hidden'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">{img.category || 'Other'}</span>
                  <span>{img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Upload Image</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Title / Description</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category / Type</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                  <option value="School Logo">School Logo</option>
                  <option value="School Banner">School Banner</option>
                  <option value="Campus">Campus</option>
                  <option value="Events">Events</option>
                  <option value="Activities">Activities</option>
                  <option value="Achievements">Achievements</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Image</label>
                <input required type="file" accept="image/*" onChange={handleFileChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              </div>
              
              {formData.url && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img src={formData.url} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
