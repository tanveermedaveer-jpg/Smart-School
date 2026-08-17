import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, BookOpen, Layers, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Detail Drill-down View State
  const [viewingClassId, setViewingClassId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);

  const initialFormState = {
    className: '',
    section: '',
    classTeacherId: '',
    capacity: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', enabled: true });
  const [sectionForm, setSectionForm] = useState({ name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setTeachers(users.filter(u => u.role === 'teacher' || u.role === 'Teacher'));
    setStudents(users.filter(u => u.role === 'student' || u.role === 'Student'));

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  };

  const saveToLocal = (updatedClasses) => {
    setClasses(updatedClasses);
    localStorage.setItem('schoolAdminClasses', JSON.stringify(updatedClasses));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    if (editingId) {
      const updated = classes.map(c => c.id === editingId ? { ...formData, id: editingId, schoolId } : c);
      saveToLocal(updated);
      toast.success('Class updated successfully');
    } else {
      const newClass = { ...formData, id: `class-${Date.now()}`, schoolId };
      saveToLocal([...classes, newClass]);
      toast.success('Class created successfully');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this class? All associated subjects in this class will also be removed.')) {
      saveToLocal(classes.filter(c => c.id !== id));
      
      const updatedSubjects = subjects.filter(s => s.classId.toString() !== id.toString());
      setSubjects(updatedSubjects);
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updatedSubjects));

      toast.success('Class and subjects deleted');
    }
  };

  const openModal = (cls = null) => {
    if (cls) {
      setFormData(cls);
      setEditingId(cls.id);
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

  const getTeacherName = (id) => {
    if (!id) return 'Not Assigned';
    const teacher = teachers.find(t => t.id && t.id.toString() === id.toString());
    return teacher ? teacher.name : 'Not Assigned';
  };

  // Setup/Initialize legacy empty school
  const handleInitializeSetup = () => {
    if (window.confirm('Are you sure you want to initialize the Academic Setup for this school using the Pakistan School Template?')) {
      const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      const schoolId = authUser.schoolId || 'global';

      let savedTemplates = JSON.parse(localStorage.getItem('superAdminAcademicTemplates') || '[]');
      if (savedTemplates.length === 0) {
        savedTemplates = getDefaultTemplates();
        localStorage.setItem('superAdminAcademicTemplates', JSON.stringify(savedTemplates));
      }
      
      const selectedTemplate = savedTemplates[0];
      if (!selectedTemplate) {
        toast.error('No master academic template found.');
        return;
      }

      const copiedClasses = [];
      const copiedSubjects = [];

      selectedTemplate.classes.forEach((cls) => {
        if (cls.groups) {
          cls.groups.forEach((group) => {
            const classId = `class-${schoolId}-${cls.id}-${group.id}`;
            copiedClasses.push({
              id: classId,
              className: cls.name,
              section: group.name,
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

      // Write directly to local storage
      const existingClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      localStorage.setItem('schoolAdminClasses', JSON.stringify([...existingClasses, ...copiedClasses]));

      const existingSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
      localStorage.setItem('schoolAdminSubjects', JSON.stringify([...existingSubjects, ...copiedSubjects]));

      setClasses(copiedClasses);
      setSubjects(copiedSubjects);
      toast.success('Academic setup initialized successfully.');
    }
  };

  // Subjects handling in detail view
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    if (editingSubjectId) {
      const updated = subjects.map(s => s.id === editingSubjectId ? { ...s, subjectName: subjectForm.name, subjectCode: subjectForm.code } : s);
      setSubjects(updated);
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updated));
      toast.success('Subject updated successfully');
    } else {
      const newSub = {
        id: `sub-${Date.now()}`,
        subjectName: subjectForm.name,
        subjectCode: subjectForm.code,
        classId: viewingClassId,
        teacherId: '',
        schoolId: schoolId,
        enabled: true
      };
      const updated = [...subjects, newSub];
      setSubjects(updated);
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updated));
      toast.success('Subject created successfully');
    }
    setIsSubjectModalOpen(false);
  };

  const handleToggleSubjectStatus = (subId) => {
    const updated = subjects.map(s => s.id === subId ? { ...s, enabled: !s.enabled } : s);
    setSubjects(updated);
    localStorage.setItem('schoolAdminSubjects', JSON.stringify(updated));
    toast.success('Subject status updated');
  };

  const handleDeleteSubject = (subId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      const updated = subjects.filter(s => s.id !== subId);
      setSubjects(updated);
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updated));
      toast.success('Subject deleted');
    }
  };

  // Sections handling in detail view
  const handleSectionSubmit = (e) => {
    e.preventDefault();
    const currentClass = classes.find(c => c.id.toString() === viewingClassId.toString());
    if (!currentClass) return;

    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    if (editingSectionId) {
      const updated = classes.map(c => c.id === editingSectionId ? { ...c, section: sectionForm.name } : c);
      setClasses(updated);
      localStorage.setItem('schoolAdminClasses', JSON.stringify(updated));
      toast.success('Section renamed successfully');
    } else {
      const newSec = {
        id: `class-${Date.now()}`,
        className: currentClass.className,
        section: sectionForm.name,
        capacity: currentClass.capacity || '50',
        classTeacherId: '',
        schoolId: schoolId
      };
      
      // Duplicate subjects of current class section to the new section
      const currentClassSubjects = subjects.filter(s => s.classId.toString() === viewingClassId.toString());
      const newSubjects = currentClassSubjects.map((sub, idx) => ({
        ...sub,
        id: `sub-${Date.now()}-${idx}`,
        classId: newSec.id
      }));

      const updatedClasses = [...classes, newSec];
      const updatedSubjects = [...subjects, ...newSubjects];

      setClasses(updatedClasses);
      setSubjects(updatedSubjects);

      localStorage.setItem('schoolAdminClasses', JSON.stringify(updatedClasses));
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updatedSubjects));

      toast.success('Section added successfully with copied subjects');
    }
    setIsSectionModalOpen(false);
    setEditingSectionId(null);
  };

  const handleDeleteSection = (secId) => {
    const sectionStudents = students.filter(s => s.classId?.toString() === secId.toString());
    if (sectionStudents.length > 0) {
      alert("This section contains students or academic records. Please move the students to another section before deleting it.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this section?')) {
      const updated = classes.filter(c => c.id !== secId);
      setClasses(updated);
      localStorage.setItem('schoolAdminClasses', JSON.stringify(updated));
      
      const updatedSubjects = subjects.filter(s => s.classId?.toString() !== secId.toString());
      setSubjects(updatedSubjects);
      localStorage.setItem('schoolAdminSubjects', JSON.stringify(updatedSubjects));

      toast.success('Section deleted successfully');
    }
  };

  // RENDER DRILL-DOWN DETAILS VIEW
  if (viewingClassId) {
    const currentClass = classes.find(c => c.id.toString() === viewingClassId.toString());
    if (!currentClass) {
      setViewingClassId(null);
      return null;
    }

    const classSubjects = subjects.filter(s => s.classId.toString() === currentClass.id.toString());
    const classStudents = students.filter(u => u.classId?.toString() === currentClass.id.toString());
    const classSections = classes.filter(c => c.className === currentClass.className);

    return (
      <div className="space-y-6">
        {/* Back header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <button onClick={() => { setViewingClassId(null); loadData(); }} className="text-sm font-semibold text-gray-500 hover:text-darkBlue transition-colors mb-2 inline-flex items-center gap-1">
              &larr; Back to Classes List
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{currentClass.className} - {currentClass.section}</h2>
            <p className="text-gray-500 text-sm mt-1">Manage subjects, sections, and view assigned students.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              Active Session: 2026-2027
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200">
          {['overview', 'subjects', 'sections', 'students'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-greenAccent text-greenAccent'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase">Class Name</span>
              <h3 className="text-lg font-bold text-darkBlue mt-2">{currentClass.className}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase">Section / Group</span>
              <h3 className="text-lg font-bold text-darkBlue mt-2">{currentClass.section}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase">Total Students</span>
              <h3 className="text-2xl font-black text-greenAccent mt-2">{classStudents.length}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase">Total Subjects</span>
              <h3 className="text-2xl font-black text-greenAccent mt-2">{classSubjects.length}</h3>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">Class Subjects</h3>
              <button
                onClick={() => {
                  setSubjectForm({ name: '', code: '', enabled: true });
                  setEditingSubjectId(null);
                  setIsSubjectModalOpen(true);
                }}
                className="bg-greenAccent hover:bg-green-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} />
                <span>Add Subject</span>
              </button>
            </div>

            {classSubjects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No subjects assigned to this class section yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-3 font-semibold">Subject Name</th>
                      <th className="p-3 font-semibold">Subject Code</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {classSubjects.map((sub) => (
                      <tr key={sub.id} className={`hover:bg-gray-50 transition-colors ${!sub.enabled ? 'opacity-50 bg-gray-50/50' : ''}`}>
                        <td className="p-3 font-medium text-darkBlue">{sub.subjectName}</td>
                        <td className="p-3">{sub.subjectCode || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sub.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {sub.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleSubjectStatus(sub.id)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                              sub.enabled ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-700'
                            }`}
                          >
                            {sub.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setSubjectForm({ name: sub.subjectName, code: sub.subjectCode || '', enabled: sub.enabled });
                              setEditingSubjectId(sub.id);
                              setIsSubjectModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-flex"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded inline-flex"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">Class Sections</h3>
              <button
                onClick={() => {
                  setSectionForm({ name: '' });
                  setEditingSectionId(null);
                  setIsSectionModalOpen(true);
                }}
                className="bg-greenAccent hover:bg-green-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} />
                <span>Add Section</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classSections.map((sec) => (
                <div key={sec.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-darkBlue text-sm">{sec.className} - {sec.section}</h4>
                    <p className="text-gray-500 text-[10px] mt-0.5">Capacity: {sec.capacity} students</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSectionId(sec.id);
                        setSectionForm({ name: sec.section });
                        setIsSectionModalOpen(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm pb-3 border-b border-gray-50">Enrolled Students</h3>
            {classStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                No students enrolled in this class section yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-3 font-semibold">Student Name</th>
                      <th className="p-3 font-semibold">Roll Number</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {classStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-darkBlue">{student.name}</td>
                        <td className="p-3">{student.rollNumber || 'N/A'}</td>
                        <td className="p-3">{student.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${student.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for adding/editing subject in detail view */}
        {isSubjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
              <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject to Class'}</h3>
                <button onClick={() => setIsSubjectModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubjectSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject Name</label>
                  <input
                    required
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g. Physics"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject Code</label>
                  <input
                    required
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="e.g. PHY-09"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                  <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Subject</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for adding/editing section in detail view */}
        {isSectionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
              <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold">{editingSectionId ? 'Rename Section' : 'Add Section'}</h3>
                <button onClick={() => setIsSectionModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSectionSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Section Name</label>
                  <input
                    required
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ name: e.target.value })}
                    placeholder="e.g. B"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                  <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Section</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleManageClass = (className) => {
    const firstSection = classes.find(c => c.className === className);
    if (firstSection) {
      setViewingClassId(firstSection.id);
      setActiveTab('sections');
    }
  };

  const groupedClasses = [];
  const classNames = Array.from(new Set(classes.map(c => c.className)));
  classNames.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  classNames.forEach(name => {
    const sections = classes.filter(c => c.className === name);
    groupedClasses.push({
      className: name,
      sections: sections
    });
  });

  // STANDARD CLASS LISTING VIEW
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Classes & Sections Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage class sections and view detailed academic configurations.</p>
        </div>
        {classes.length > 0 && (
          <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm text-xs font-bold uppercase tracking-wider shrink-0">
            <Plus size={16} />
            <span>Add Class</span>
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-800">Academic Setup Required</h4>
          <p className="text-gray-500 text-sm mt-1 mb-6">This school does not have any classes initialized yet.</p>
          <button
            onClick={handleInitializeSetup}
            className="bg-greenAccent hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Initialize Academic Setup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedClasses.map((gc) => (
            <div key={gc.className} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{gc.className}</h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                    {gc.sections.length} {gc.sections.length === 1 ? 'Section' : 'Sections'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const firstSec = gc.sections[0];
                    if (firstSec) {
                      setViewingClassId(firstSec.id);
                      setSectionForm({ name: '' });
                      setEditingSectionId(null);
                      setIsSectionModalOpen(true);
                    }
                  }}
                  className="text-xs font-bold text-greenAccent hover:text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-100/50 flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  <span>Add Section</span>
                </button>
              </div>

              {/* Section badges */}
              <div className="flex flex-wrap gap-2 py-1">
                {gc.sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setViewingClassId(sec.id);
                      setActiveTab('overview');
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-lg text-xs font-bold transition-all shadow-xs"
                    title={`View ${sec.className} - ${sec.section} details`}
                  >
                    {sec.section}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Teacher-led Sections
                </span>
                <button
                  onClick={() => handleManageClass(gc.className)}
                  className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <span>Manage</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name (e.g., Grade 10)</label>
                <input required type="text" name="className" value={formData.className} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section / Group (e.g., A, B, Science Group)</label>
                <input required type="text" name="section" value={formData.section} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher</label>
                <select name="classTeacherId" value={formData.classTeacherId ? formData.classTeacherId.toString() : ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id ? t.id.toString() : ''}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
