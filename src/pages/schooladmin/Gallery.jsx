import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    url: ''
  });

  useEffect(() => {
    const savedImages = JSON.parse(localStorage.getItem('schoolAdminGallery') || '[]');
    setImages(savedImages);
  }, []);

  const saveToLocal = (updatedImages) => {
    setImages(updatedImages);
    localStorage.setItem('schoolAdminGallery', JSON.stringify(updatedImages));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.url) {
      toast.error('Please select an image');
      return;
    }
    
    const newImage = { ...formData, id: Date.now(), date: new Date().toISOString().split('T')[0] };
    saveToLocal([...images, newImage]);
    toast.success('Image uploaded successfully');
    
    setIsModalOpen(false);
    setFormData({ title: '', url: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      saveToLocal(images.filter(img => img.id !== id));
      toast.success('Image deleted');
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

      {images.length === 0 ? (
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
                <h3 className="font-semibold text-gray-800 truncate" title={img.title}>{img.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{img.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
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
