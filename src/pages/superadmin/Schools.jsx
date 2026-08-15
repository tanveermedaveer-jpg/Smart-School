import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Plus, Edit, Trash2, X, School, ScrollText } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction, getActivityLogs } from '../../utils/logger';
import { getSchools, saveSchools, upsertUser, saveClasses, saveCollection, getCollection } from '../../utils/db';

const getDefaultTemplates = () => {
  const defaultClasses = [];
  const commonLowerSubjects = [
    { name: 'English', code: 'ENG' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Mathematics', code: 'MTH' },
    { name: 'General Knowledge', code: 'GK' },
    { name: 'Islamiat', code: 'ISL' }
  ];
  
  const commonMidSubjects = [
    { name: 'English', code: 'ENG' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Mathematics', code: 'MTH' },
    { name: 'General Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Islamiat', code: 'ISL' }
  ];

  const commonUpperSubjects = [
    { name: 'English', code: 'ENG' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Mathematics', code: 'MTH' },
    { name: 'Science', code: 'SCI' },
    { name: 'History', code: 'HIS' },
    { name: 'Geography', code: 'GEO' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'Islamiat', code: 'ISL' }
  ];

  const science910 = [
    { name: 'English', code: 'ENG' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Mathematics', code: 'MTH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHM' },
    { name: 'Biology', code: 'BIO' },
    { name: 'Islamiat', code: 'ISL' },
    { name: 'Pakistan Studies', code: 'PST' }
  ];

  const cs910 = [
    { name: 'English', code: 'ENG' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Mathematics', code: 'MTH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHM' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'Islamiat', code: 'ISL' },
    { name: 'Pakistan Studies', code: 'PST' }
  ];

  for (let i = 1; i <= 10; i++) {
    const clsId = `class-${i}`;
    if (i < 4) {
      defaultClasses.push({
        id: clsId,
        name: `Class ${i}`,
        subjects: commonLowerSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
      });
    } else if (i === 4 || i === 5) {
      defaultClasses.push({
        id: clsId,
        name: `Class ${i}`,
        subjects: commonMidSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
      });
    } else if (i >= 6 && i <= 8) {
      defaultClasses.push({
        id: clsId,
        name: `Class ${i}`,
        subjects: commonUpperSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
      });
    } else {
      defaultClasses.push({
        id: clsId,
        name: `Class ${i}`,
        groups: [
          {
            id: `group-sci-${i}`,
            name: 'Science Group',
            subjects: science910.map((s, idx) => ({ id: `sub-${i}-sci-${idx}`, name: s.name, code: `${s.code}-${i}`, enabled: true }))
          },
          {
            id: `group-cs-${i}`,
            name: 'Computer Science Group',
            subjects: cs910.map((s, idx) => ({ id: `sub-${i}-cs-${idx}`, name: s.name, code: `${s.code}-${i}`, enabled: true }))
          }
        ]
      });
    }
  }

  return [
    {
      id: 'pakistan-school-template',
      name: 'Pakistan School Template',
      status: 'Active',
      classes: defaultClasses
    }
  ];
};

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectingSchool, setInspectingSchool] = useState(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [schoolLogs, setSchoolLogs] = useState([]);
  
  const initialFormState = {
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    classes: '',
    description: '',
    featured: false,
    admissionsEnabled: false,
    planId: 'monthly',
    status: 'Active',
    templateId: 'pakistan-school-template',
    logo: '',
    banner: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        // Load schools from Firestore
        const data = await getSchools();
        setSchools(data);

        // Load academic templates from Firestore (fallback to defaults if empty)
        let savedTemplates = await getCollection('superAdminAcademicTemplates');
        if (!savedTemplates || savedTemplates.length === 0) {
          savedTemplates = getDefaultTemplates();
          await saveCollection('superAdminAcademicTemplates', null, savedTemplates);
        }
        setTemplates(savedTemplates);
      } catch (err) {
        console.error('Error loading schools:', err);
        toast.error('Failed to load schools from database.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const saveToDb = async (updatedSchools) => {
    try {
      await saveSchools(updatedSchools);
      setSchools(updatedSchools);
      localStorage.setItem('schools', JSON.stringify(updatedSchools));
    } catch (err) {
      console.error('Error saving schools:', err);
      toast.error('Failed to save changes to Firestore.');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = schools.map(s => s.id === editingId ? { ...formData, id: editingId } : s);
      await saveToDb(updated);
      toast.success('School updated successfully');
    } else {
      const schoolId = Date.now().toString();
      const newSchool = { ...formData, id: schoolId };

      try {
        const selectedTemplate = templates.find(t => t.id === (formData.templateId || 'pakistan-school-template'));
        if (!selectedTemplate) {
          throw new Error('Selected Academic Template not found.');
        }

        // 1. Copy template classes and subjects to this school namespace
        const copiedClasses = [];
        const copiedSubjects = [];

        selectedTemplate.classes.forEach((cls) => {
          if (cls.groups) {
            // Class 9 / 10 with academic groups
            cls.groups.forEach((group) => {
              const classId = `class-${schoolId}-${cls.id}-${group.id}`;
              copiedClasses.push({
                id: classId,
                className: cls.name,
                section: group.name, // e.g. "Science Group" or "Computer Science Group"
                capacity: '50',
                classTeacherId: '',
                schoolId: schoolId
              });

              (group.subjects || []).forEach((sub) => {
                copiedSubjects.push({
                  id: `sub-${schoolId}-${sub.id}`,
                  subjectName: sub.name,
                  subjectCode: sub.code,
                  classId: classId,
                  teacherId: '',
                  schoolId: schoolId,
                  enabled: sub.enabled !== false
                });
              });
            });
          } else {
            // Normal Classes 1-8
            const classId = `class-${schoolId}-${cls.id}`;
            copiedClasses.push({
              id: classId,
              className: cls.name,
              section: 'A',
              capacity: '50',
              classTeacherId: '',
              schoolId: schoolId
            });

            (cls.subjects || []).forEach((sub) => {
              copiedSubjects.push({
                id: `sub-${schoolId}-${sub.id}`,
                subjectName: sub.name,
                subjectCode: sub.code,
                classId: classId,
                teacherId: '',
                schoolId: schoolId,
                enabled: sub.enabled !== false
              });
            });
          }
        });

        // Write classes and subjects to Firestore
        await saveClasses(schoolId, copiedClasses);
        await saveCollection('schoolAdminSubjects', schoolId, copiedSubjects);

        // Save School record
        await saveToDb([...schools, newSchool]);
        
        toast.success(`School created successfully. Academic setup has been initialized from ${selectedTemplate.name}.`);
        logSystemAction('School Created', 'Super Admin', 'Super Admin', newSchool.name);
      } catch (err) {
        toast.error(`Failed to create school: ${err.message}`);
        return;
      }
    }
    closeModal();
  };

  const handleInspectLogs = async (school) => {
    setInspectingSchool(school);
    try {
      const logs = await getActivityLogs(school.id);
      setSchoolLogs(logs);
    } catch (err) {
      console.error('Error loading school logs:', err);
      setSchoolLogs([]);
    }
    setIsLogsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      await saveToDb(schools.filter(s => s.id !== id));
      toast.success('School deleted');
    }
  };

  const openModal = (school = null) => {
    if (school) {
      setFormData(school);
      setEditingId(school.id);
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
        <h2 className="text-2xl font-bold text-gray-800">Schools Management</h2>
        <div className="flex items-center space-x-3">
          <ExportButtons tableId="export-table" filename="Schools Management" />
          <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
            <Plus size={20} />
            <span>Add New School</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoadingData ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
            Loading schools...
          </div>
        ) : schools.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No schools added yet. Click "Add New School" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">School Info</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Admissions</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {schools.map((school) => (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {school.logo ? <img src={school.logo} alt="logo" className="w-full h-full object-cover" /> : <School className="text-gray-400" size={20} />}
                      </div>
                      <span className="font-medium text-darkBlue">{school.name}</span>
                    </td>
                    <td className="p-4">
                      <div>{school.email}</div>
                      <div className="text-gray-500 text-xs">{school.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.admissionsEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {school.admissionsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 text-nowrap whitespace-nowrap">
                      <button onClick={() => handleInspectLogs(school)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex" title="Inspect Logs">
                        <ScrollText size={16} />
                      </button>
                      <button onClick={() => openModal(school)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Edit School">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(school.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete School">
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
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit School' : 'Add New School'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                  <input required type="text" name="code" value={formData.code || ''} onChange={handleInputChange} placeholder="e.g. SCH-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                  <select name="planId" value={formData.planId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="monthly">Monthly Plan</option>
                    <option value="yearly">Yearly Plan</option>
                  </select>
                </div>
              </div>

              {!editingId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Template</label>
                    <select name="templateId" value={formData.templateId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {/* Align UI layout */}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Classes</label>
                  <input required type="text" name="classes" value={formData.classes} onChange={handleInputChange} placeholder="e.g. Pre-K to Grade 12" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input required type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Short description of the school" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Logo</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors" />
                  {formData.logo && <img src={formData.logo} alt="Logo Preview" className="h-12 object-contain mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Banner</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                  {formData.banner && <img src={formData.banner} alt="Banner Preview" className="h-12 object-contain mt-2" />}
                </div>
              </div>



              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="admissionsEnabled" checked={formData.admissionsEnabled} onChange={handleInputChange} className="w-4 h-4 text-greenAccent rounded focus:ring-greenAccent" />
                  <span className="text-sm font-medium text-gray-700">Enable Online Admissions</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="w-4 h-4 text-greenAccent rounded focus:ring-greenAccent" />
                  <span className="text-sm font-medium text-gray-700">Mark as Featured</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="px-2 py-1 border border-gray-300 rounded text-sm outline-none bg-white">
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save School</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isLogsModalOpen && inspectingSchool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Activity Logs — {inspectingSchool.name}</h3>
              <button onClick={() => { setIsLogsModalOpen(false); setInspectingSchool(null); }} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 font-semibold text-gray-600 text-sm">Date & Time</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Action</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolLogs.length > 0 ? (
                      schoolLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">
                             <div>{log.date}</div>
                             <div className="text-xs text-gray-400">{log.time}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-800">{log.user}</td>
                          <td className="p-4 text-sm text-gray-600">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{log.role}</span>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-800">{log.action}</td>
                          <td className="p-4 text-sm">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          No activity logs found for this school.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => { setIsLogsModalOpen(false); setInspectingSchool(null); }} className="px-5 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
