import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, MapPin, BookOpen, GraduationCap } from 'lucide-react';

const Admission = () => {
  const [schools, setSchools] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    class: '',
    schoolId: '',
    parentName: '',
    phone: '',
    parentEmail: '',
    address: ''
  });

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const { getSchools } = await import('../utils/db');
        const data = await getSchools();
        const activeSchools = data.filter(s => s.status === 'Active');
        setSchools(activeSchools);
        localStorage.setItem('schools', JSON.stringify(data));
      } catch (err) {
        console.error('Error loading schools in Admission:', err);
        const data = JSON.parse(localStorage.getItem('schools') || '[]');
        setSchools(data.filter(s => s.status === 'Active'));
      }
    };
    loadSchools();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyClick = (schoolId = '') => {
    setFormData({ ...formData, schoolId: schoolId });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newAdmission = {
      ...formData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      const { addAdmission } = await import('../utils/db');
      await addAdmission(newAdmission);

      const existing = JSON.parse(localStorage.getItem('admissions') || '[]');
      localStorage.setItem('admissions', JSON.stringify([newAdmission, ...existing]));

      toast.success('Application submitted successfully!');
      setIsModalOpen(false);
      setFormData({ studentName: '', class: '', schoolId: '', parentName: '', phone: '', parentEmail: '', address: '' });
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application to Firestore.');
    }
  };

  const PlaceholderCard = ({ banner, logo, name, city }) => (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 group flex flex-col transform hover:-translate-y-1">
      <div className="h-48 relative overflow-hidden bg-gray-100">
        <img 
          src={banner} 
          alt="Banner" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'; }}
        />
        <div className="absolute top-4 right-4 bg-greenAccent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          Admissions Open
        </div>
      </div>
      <div className="px-6 pt-0 pb-6 relative flex-1 flex flex-col">
        <div className="w-20 h-20 rounded-xl bg-white shadow-lg border-4 border-white -mt-10 mb-4 flex items-center justify-center overflow-hidden z-10 relative">
           <img 
             src={logo} 
             alt="Logo" 
             className="w-full h-full object-cover" 
             onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80'; }}
           />
        </div>
        <h3 className="text-xl font-bold text-darkBlue mb-2 line-clamp-1">{name}</h3>
        <div className="space-y-2 mb-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-greenAccent shrink-0" />
            <span className="line-clamp-1">{city}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-greenAccent shrink-0" />
            <span>Pre-K to Grade 12</span>
          </div>
        </div>
        <div className="mt-auto">
          <button disabled title="Available after school is published" className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );

  const SchoolCard = ({ school }) => (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 group flex flex-col transform hover:-translate-y-1">
      <div className="h-48 relative overflow-hidden bg-gray-100">
        {school.banner ? (
          <img 
            src={school.banner} 
            alt={school.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200">
             <GraduationCap className="w-16 h-16" />
          </div>
        )}
        {school.admissionsEnabled && (
          <div className="absolute top-4 right-4 bg-greenAccent text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            Admissions Open
          </div>
        )}
      </div>
      <div className="px-6 pt-0 pb-6 relative flex-1 flex flex-col">
        <div className="w-20 h-20 rounded-xl bg-white shadow-lg border-4 border-white -mt-10 mb-4 flex items-center justify-center overflow-hidden z-10 relative">
          {school.logo ? (
             <img 
               src={school.logo} 
               alt="Logo" 
               className="w-full h-full object-contain" 
               onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80'; }}
             />
          ) : (
             <span className="font-bold text-darkBlue text-xl">{school.name.substring(0,2).toUpperCase()}</span>
          )}
        </div>
        <h3 className="text-xl font-bold text-darkBlue mb-2 line-clamp-1" title={school.name}>{school.name}</h3>
        <div className="space-y-2 mb-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-greenAccent shrink-0" />
            <span className="line-clamp-1" title={school.city || school.address}>{school.city || school.address || 'Address not provided'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-greenAccent shrink-0" />
            <span>{school.classes || 'Pre-K to Grade 12'}</span>
          </div>
        </div>
        <div className="mt-auto">
          {school.admissionsEnabled ? (
            <button onClick={() => handleApplyClick(school.id)} className="w-full bg-darkBlue hover:bg-blue-900 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
              Apply Now
            </button>
          ) : (
            <button disabled title="Admissions are currently closed for this school" className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed transition-colors">
              Admissions Closed
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section id="admission" className="py-24 bg-gray-50 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-darkBlue mb-4">Choose Your School</h2>
            <div className="w-16 h-1 bg-greenAccent mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schools will appear here once they are published by the Super Admin. You will be able to select a school and apply online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schools.length > 0 ? (
              schools.map(school => <SchoolCard key={school.id} school={school} />)
            ) : (
              <>
                <PlaceholderCard 
                  banner="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80" 
                  logo="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80" 
                  name="Excellence Academy" 
                  city="New York, USA" 
                />
                <PlaceholderCard 
                  banner="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80" 
                  logo="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80" 
                  name="Global Heights School" 
                  city="London, UK" 
                />
                <PlaceholderCard 
                  banner="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80" 
                  logo="https://images.unsplash.com/photo-1614036634955-ae5e90f9cb9c?auto=format&fit=crop&w=200&q=80" 
                  name="Pioneer International" 
                  city="Sydney, Australia" 
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Admission Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Admission Application</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select School</label>
                <select required name="schoolId" value={formData.schoolId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all bg-white">
                  <option value="">-- Choose a school --</option>
                  {schools.filter(s => s.admissionsEnabled).map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <input required type="text" name="studentName" value={formData.studentName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade to Apply</label>
                  <input required type="text" name="class" value={formData.class} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" placeholder="e.g. Grade 5" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                  <input required type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                  <input required type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-greenAccent outline-none transition-all" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-greenAccent hover:bg-green-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Admission;
