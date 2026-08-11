import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [schools, setSchools] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All Schools',
    schoolId: '',
    publishDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('superAdminNotifications')) || [];
    setNotifications(saved);
    const savedSchools = JSON.parse(localStorage.getItem('schools')) || [];
    setSchools(savedSchools);
  }, []);

  const handleOpenModal = (notification = null) => {
    if (notification) {
      setFormData(notification);
      setEditingId(notification.id);
    } else {
      setFormData({
        title: '',
        message: '',
        audience: 'All Schools',
        schoolId: '',
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.publishDate) {
      toast.error('Please fill required fields');
      return;
    }

    let updatedNotifications;
    if (editingId) {
      updatedNotifications = notifications.map(n => 
        n.id === editingId ? { ...formData, id: editingId } : n
      );
      toast.success('Notification updated successfully');
    } else {
      const newNotification = {
        ...formData,
        id: Date.now().toString()
      };
      updatedNotifications = [newNotification, ...notifications];
      toast.success('Notification sent successfully');
    }

    setNotifications(updatedNotifications);
    localStorage.setItem('superAdminNotifications', JSON.stringify(updatedNotifications));
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      localStorage.setItem('superAdminNotifications', JSON.stringify(updated));
      toast.success('Notification deleted');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            <Bell className="mx-auto mb-3 text-gray-300" size={48} />
            <p>No notifications found.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div key={notification.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-darkBlue">{notification.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    notification.audience === 'All Schools' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {notification.audience === 'All Schools' 
                      ? 'All Schools' 
                      : `School: ${schools.find(s => s.id === notification.schoolId)?.name || 'Unknown'}`}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{notification.message}</p>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>Published: {notification.publishDate}</span>
                  {notification.expiryDate && <span>Expires: {notification.expiryDate}</span>}
                </div>
              </div>
              <div className="flex space-x-2 shrink-0">
                <button onClick={() => handleOpenModal(notification)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(notification.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-darkBlue mb-4">
              {editingId ? 'Edit Notification' : 'Create Notification'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  required 
                  rows="4" 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none resize-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select 
                  value={formData.audience} 
                  onChange={(e) => setFormData({...formData, audience: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
                >
                  <option value="All Schools">All Schools</option>
                  <option value="Specific School">Specific School</option>
                </select>
              </div>
              {formData.audience === 'Specific School' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select School</label>
                  <select 
                    required 
                    value={formData.schoolId} 
                    onChange={(e) => setFormData({...formData, schoolId: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
                  >
                    <option value="">Select a school...</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.publishDate} 
                    onChange={(e) => setFormData({...formData, publishDate: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.expiryDate} 
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none" 
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-darkBlue text-white py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors">
                  {editingId ? 'Update' : 'Send'}
                </button>
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
