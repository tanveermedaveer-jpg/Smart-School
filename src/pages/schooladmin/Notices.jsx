import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../../utils/logger';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    audience: 'All',
    content: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const savedNotices = JSON.parse(localStorage.getItem('schoolAdminNotices') || '[]');
    setNotices(savedNotices);
  }, []);

  const saveToLocal = (updatedNotices) => {
    setNotices(updatedNotices);
    localStorage.setItem('schoolAdminNotices', JSON.stringify(updatedNotices));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = notices.map(n => n.id === editingId ? { ...formData, id: editingId } : n);
      saveToLocal(updated);
      toast.success('Notice updated successfully');
    } else {
      const newNotice = { ...formData, id: Date.now() };
      saveToLocal([...notices, newNotice]);
      toast.success('Notice published successfully');
      const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      logSystemAction('Notice Created', authUser.name || 'School Admin', authUser.role || 'School Admin', newNotice.title);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      saveToLocal(notices.filter(n => n.id !== id));
      toast.success('Notice deleted');
    }
  };

  const openModal = (notice = null) => {
    if (notice) {
      setFormData(notice);
      setEditingId(notice.id);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notice Board</h2>
          <p className="text-gray-500 text-sm mt-1">Publish announcements and notices.</p>
        </div>
        <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>New Notice</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {notices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notices published yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Audience</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-darkBlue flex items-center space-x-2">
                        <Bell size={16} className="text-gray-400" />
                        <span>{notice.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6 line-clamp-1">{notice.content}</div>
                    </td>
                    <td className="p-4">{notice.date}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                        {notice.audience}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openModal(notice)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(notice.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Notice' : 'Publish Notice'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select name="audience" value={formData.audience} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="All">All</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Students">Students</option>
                    <option value="Parents">Parents</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required name="content" value={formData.content} onChange={handleInputChange} rows="5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none resize-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
