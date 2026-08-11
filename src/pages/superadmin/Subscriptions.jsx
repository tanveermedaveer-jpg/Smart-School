import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: 'Monthly',
    features: ''
  });

  useEffect(() => {
    // Default plans if none exist
    const defaultPlans = [
      { id: 'monthly', name: 'Standard Monthly', price: '99', duration: 'Monthly', features: 'Admin Panel, Teacher Portal, Student Portal' },
      { id: 'yearly', name: 'Premium Yearly', price: '999', duration: 'Yearly', features: 'All Features, Priority Support, Custom Domain' }
    ];
    const data = JSON.parse(localStorage.getItem('plans') || JSON.stringify(defaultPlans));
    setPlans(data);
    if (!localStorage.getItem('plans')) localStorage.setItem('plans', JSON.stringify(defaultPlans));
  }, []);

  const saveToLocal = (data) => {
    setPlans(data);
    localStorage.setItem('plans', JSON.stringify(data));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = plans.map(p => p.id === editingId ? { ...formData, id: editingId } : p);
      saveToLocal(updated);
      toast.success('Plan updated successfully');
    } else {
      const newPlan = { ...formData, id: `plan_${Date.now()}` };
      saveToLocal([...plans, newPlan]);
      toast.success('Plan added successfully');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this plan?')) {
      saveToLocal(plans.filter(p => p.id !== id));
      toast.success('Plan deleted');
    }
  };

  const openModal = (plan = null) => {
    if (plan) {
      setFormData(plan);
      setEditingId(plan.id);
    } else {
      setFormData({ name: '', price: '', duration: 'Monthly', features: '' });
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
        <h2 className="text-2xl font-bold text-gray-800">Subscriptions & Plans</h2>
        <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>Add New Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative flex flex-col">
            <div className="absolute top-4 right-4 flex space-x-1">
              <button onClick={() => openModal(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit size={14}/></button>
              <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14}/></button>
            </div>
            
            <h3 className="text-xl font-bold text-darkBlue mb-2">{plan.name}</h3>
            <div className="flex items-baseline space-x-1 mb-4">
              <span className="text-3xl font-extrabold text-gray-900">${plan.price}</span>
              <span className="text-gray-500 font-medium">/ {plan.duration}</span>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                {plan.features.split(',').map((f, i) => <li key={i}>{f.trim()}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Plan' : 'Add New Plan'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none bg-white">
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                <textarea required rows="3" name="features" value={formData.features} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent outline-none resize-none" placeholder="Feature 1, Feature 2, Feature 3" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
