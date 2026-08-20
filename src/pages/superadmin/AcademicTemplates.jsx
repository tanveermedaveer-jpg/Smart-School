import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, BookOpen, Layers, CheckCircle, XCircle, Grid, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AcademicTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Form states
  const [templateForm, setTemplateForm] = useState({ name: '', status: 'Active' });
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [classForm, setClassForm] = useState({ name: '' });
  const [editingClassId, setEditingClassId] = useState(null);

  const [groupForm, setGroupForm] = useState({ name: '' });
  const [editingGroupId, setEditingGroupId] = useState(null);

  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', enabled: true });
  const [editingSubjectId, setEditingSubjectId] = useState(null);

  // Predefined Academic Sessions
  const [sessions, setSessions] = useState([
    { id: 'session-2026-2027', name: '2026-2027', academicSession: '2026-2027', isCurrent: true, status: 'Active' },
    { id: 'session-2025-2026', name: '2025-2026', academicSession: '2025-2026', isCurrent: false, status: 'Completed' }
  ]);

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'sessions' | 'timetable'

  // Initialize defaults
  useEffect(() => {
    const saved = localStorage.getItem('superAdminAcademicTemplates');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      setTemplates(parsed);
      setSelectedTemplateId(parsed[0].id);
      if (parsed[0].classes && parsed[0].classes.length > 0) {
        setSelectedClassId(parsed[0].classes[0].id);
      }
    } else {
      // Build default pre-filled structure for Classes 1 to 10 with Sections A, B, C
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
        { name: 'General Science', code: 'SCI' },
        { name: 'History & Geography', code: 'SST' },
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

      const arts910 = [
        { name: 'English', code: 'ENG' },
        { name: 'Urdu', code: 'URD' },
        { name: 'General Mathematics', code: 'GMTH' },
        { name: 'General Science', code: 'GSCI' },
        { name: 'Civics & Economics', code: 'CIV' },
        { name: 'Islamiat', code: 'ISL' },
        { name: 'Pakistan Studies', code: 'PST' }
      ];

      const sections = ['Section A', 'Section B', 'Section C'];

      for (let i = 1; i <= 10; i++) {
        const clsId = `class-${i}`;
        if (i < 4) {
          defaultClasses.push({
            id: clsId,
            name: `Class ${i}`,
            sections: sections,
            subjects: commonLowerSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
          });
        } else if (i === 4 || i === 5) {
          defaultClasses.push({
            id: clsId,
            name: `Class ${i}`,
            sections: sections,
            subjects: commonMidSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
          });
        } else if (i >= 6 && i <= 8) {
          defaultClasses.push({
            id: clsId,
            name: `Class ${i}`,
            sections: sections,
            subjects: commonUpperSubjects.map((s, idx) => ({ id: `sub-${i}-${idx}`, name: s.name, code: `${s.code}-0${i}`, enabled: true }))
          });
        } else {
          // Class 9 & 10
          defaultClasses.push({
            id: clsId,
            name: `Class ${i}`,
            sections: sections,
            groups: [
              {
                id: `group-sci-${i}`,
                name: 'Section A (Science Group)',
                subjects: science910.map((s, idx) => ({ id: `sub-${i}-sci-${idx}`, name: s.name, code: `${s.code}-${i}`, enabled: true }))
              },
              {
                id: `group-cs-${i}`,
                name: 'Section B (Computer Science Group)',
                subjects: cs910.map((s, idx) => ({ id: `sub-${i}-cs-${idx}`, name: s.name, code: `${s.code}-${i}`, enabled: true }))
              },
              {
                id: `group-arts-${i}`,
                name: 'Section C (General Arts Group)',
                subjects: arts910.map((s, idx) => ({ id: `sub-${i}-arts-${idx}`, name: s.name, code: `${s.code}-${i}`, enabled: true }))
              }
            ]
          });
        }
      }

      const defaultTemplates = [
        {
          id: 'pakistan-school-template',
          name: 'Pakistan School Template (Classes 1-10)',
          status: 'Active',
          sessions: [
            { id: 'session-2026-2027', name: '2026-2027', academicSession: '2026-2027', isCurrent: true, status: 'Active' },
            { id: 'session-2025-2026', name: '2025-2026', academicSession: '2025-2026', isCurrent: false, status: 'Completed' }
          ],
          classes: defaultClasses
        }
      ];

      setTemplates(defaultTemplates);
      setSelectedTemplateId('pakistan-school-template');
      setSelectedClassId('class-1');
      localStorage.setItem('superAdminAcademicTemplates', JSON.stringify(defaultTemplates));
    }
  }, []);

  const saveTemplates = (updated) => {
    setTemplates(updated);
    localStorage.setItem('superAdminAcademicTemplates', JSON.stringify(updated));
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplateId);
  const currentClass = currentTemplate?.classes.find(c => c.id === selectedClassId);

  // Set default group when class changes
  useEffect(() => {
    if (currentClass && currentClass.groups && currentClass.groups.length > 0) {
      setSelectedGroupId(currentClass.groups[0].id);
    } else {
      setSelectedGroupId('');
    }
  }, [selectedClassId, selectedTemplateId, templates]);

  const currentGroup = currentClass?.groups?.find(g => g.id === selectedGroupId);

  // Count calculations
  const totalClasses = currentTemplate?.classes.length || 0;
  
  let totalSubjects = 0;
  let totalGroups = 0;
  if (currentTemplate) {
    currentTemplate.classes.forEach(c => {
      if (c.subjects) {
        totalSubjects += c.subjects.length;
      }
      if (c.groups) {
        totalGroups += c.groups.length;
        c.groups.forEach(g => {
          totalSubjects += g.subjects.length;
        });
      }
    });
  }

  // Template handlers
  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    if (editingTemplateId) {
      const updated = templates.map(t => t.id === editingTemplateId ? { ...t, ...templateForm } : t);
      saveTemplates(updated);
      toast.success('Template updated successfully');
    } else {
      const newT = {
        id: `template-${Date.now()}`,
        name: templateForm.name,
        status: templateForm.status,
        classes: []
      };
      saveTemplates([...templates, newT]);
      setSelectedTemplateId(newT.id);
      toast.success('Template created successfully');
    }
    setIsTemplateModalOpen(false);
    setEditingTemplateId(null);
  };

  const deleteTemplate = () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== selectedTemplateId);
      saveTemplates(updated);
      if (updated.length > 0) {
        setSelectedTemplateId(updated[0].id);
      } else {
        setSelectedTemplateId('');
      }
      toast.success('Template deleted');
    }
  };

  // Class handlers
  const handleClassSubmit = (e) => {
    e.preventDefault();
    if (!currentTemplate) return;

    if (editingClassId) {
      const updatedClasses = currentTemplate.classes.map(c => c.id === editingClassId ? { ...c, name: classForm.name } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
      toast.success('Class updated');
    } else {
      const newClass = {
        id: `class-${Date.now()}`,
        name: classForm.name,
        subjects: []
      };
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: [...t.classes, newClass] } : t);
      saveTemplates(updated);
      setSelectedClassId(newClass.id);
      toast.success('Class added');
    }
    setIsClassModalOpen(false);
    setEditingClassId(null);
  };

  const deleteClass = (classId) => {
    if (window.confirm('Are you sure you want to delete this class from template?')) {
      const updatedClasses = currentTemplate.classes.filter(c => c.id !== classId);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
      if (updatedClasses.length > 0) {
        setSelectedClassId(updatedClasses[0].id);
      }
      toast.success('Class deleted');
    }
  };

  // Group handlers
  const handleGroupSubmit = (e) => {
    e.preventDefault();
    if (!currentClass) return;

    if (editingGroupId) {
      const updatedGroups = (currentClass.groups || []).map(g => g.id === editingGroupId ? { ...g, name: groupForm.name } : g);
      const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
      toast.success('Group updated');
    } else {
      const newGroup = {
        id: `group-${Date.now()}`,
        name: groupForm.name,
        subjects: []
      };
      const updatedGroups = [...(currentClass.groups || []), newGroup];
      const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups, subjects: undefined } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
      setSelectedGroupId(newGroup.id);
      toast.success('Group added');
    }
    setIsGroupModalOpen(false);
    setEditingGroupId(null);
  };

  const deleteGroup = (groupId) => {
    if (window.confirm('Are you sure you want to delete this academic group?')) {
      const updatedGroups = currentClass.groups.filter(g => g.id !== groupId);
      const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
      if (updatedGroups.length > 0) {
        setSelectedGroupId(updatedGroups[0].id);
      }
      toast.success('Group deleted');
    }
  };

  // Subject handlers
  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    if (!currentClass) return;

    if (currentClass.groups && !selectedGroupId) {
      toast.error('Please select an Academic Group first');
      return;
    }

    if (editingSubjectId) {
      if (currentClass.groups) {
        const updatedSubjects = currentGroup.subjects.map(s => s.id === editingSubjectId ? { ...s, name: subjectForm.name, code: subjectForm.code } : s);
        const updatedGroups = currentClass.groups.map(g => g.id === selectedGroupId ? { ...g, subjects: updatedSubjects } : g);
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      } else {
        const updatedSubjects = currentClass.subjects.map(s => s.id === editingSubjectId ? { ...s, name: subjectForm.name, code: subjectForm.code } : s);
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, subjects: updatedSubjects } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      }
      toast.success('Subject updated');
    } else {
      const newSub = {
        id: `sub-${Date.now()}`,
        name: subjectForm.name,
        code: subjectForm.code,
        enabled: true
      };
      if (currentClass.groups) {
        const updatedSubjects = [...(currentGroup.subjects || []), newSub];
        const updatedGroups = currentClass.groups.map(g => g.id === selectedGroupId ? { ...g, subjects: updatedSubjects } : g);
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      } else {
        const updatedSubjects = [...(currentClass.subjects || []), newSub];
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, subjects: updatedSubjects } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      }
      toast.success('Subject added');
    }
    setIsSubjectModalOpen(false);
    setEditingSubjectId(null);
  };

  const toggleSubjectStatus = (subjectId) => {
    if (!currentClass) return;

    if (currentClass.groups) {
      const updatedSubjects = currentGroup.subjects.map(s => s.id === subjectId ? { ...s, enabled: !s.enabled } : s);
      const updatedGroups = currentClass.groups.map(g => g.id === selectedGroupId ? { ...g, subjects: updatedSubjects } : g);
      const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
    } else {
      const updatedSubjects = currentClass.subjects.map(s => s.id === subjectId ? { ...s, enabled: !s.enabled } : s);
      const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, subjects: updatedSubjects } : c);
      const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
      saveTemplates(updated);
    }
    toast.success('Subject status updated');
  };

  const deleteSubject = (subjectId) => {
    if (window.confirm('Are you sure you want to remove this subject?')) {
      if (currentClass.groups) {
        const updatedSubjects = currentGroup.subjects.filter(s => s.id !== subjectId);
        const updatedGroups = currentClass.groups.map(g => g.id === selectedGroupId ? { ...g, subjects: updatedSubjects } : g);
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, groups: updatedGroups } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      } else {
        const updatedSubjects = currentClass.subjects.filter(s => s.id !== subjectId);
        const updatedClasses = currentTemplate.classes.map(c => c.id === selectedClassId ? { ...c, subjects: updatedSubjects } : c);
        const updated = templates.map(t => t.id === selectedTemplateId ? { ...t, classes: updatedClasses } : t);
        saveTemplates(updated);
      }
      toast.success('Subject removed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Academic Templates</h2>
          <p className="text-gray-500 text-sm mt-1">Configure global templates to quickly initialize newly registered schools.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white text-sm font-medium text-gray-700"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setTemplateForm({ name: '', status: 'Active' });
              setEditingTemplateId(null);
              setIsTemplateModalOpen(true);
            }}
            className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus size={16} />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {currentTemplate ? (
        <>
          {/* Template Info Card */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Template Name</span>
              <span className="text-sm font-bold text-gray-800 mt-2 truncate">{currentTemplate.name}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-2 w-max ${currentTemplate.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {currentTemplate.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {currentTemplate.status}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Classes</span>
              <span className="text-xl font-black text-darkBlue mt-2">{totalClasses}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Subjects</span>
              <span className="text-xl font-black text-darkBlue mt-2">{totalSubjects}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Groups</span>
              <span className="text-xl font-black text-darkBlue mt-2">{totalGroups}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-4 pt-2 rounded-t-2xl shadow-xs space-x-2">
            <button
              onClick={() => setActiveTab('classes')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'classes'
                  ? 'border-darkBlue text-darkBlue bg-slate-50/80 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen size={16} />
              <span>Classes & Subjects</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'border-darkBlue text-darkBlue bg-slate-50/80 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers size={16} />
              <span>Academic Sessions</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'timetable'
                  ? 'border-darkBlue text-darkBlue bg-slate-50/80 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid size={16} />
              <span>Academic Timetable Structure</span>
            </button>
          </div>

          {/* Quick Actions Panel */}
          {activeTab === 'classes' && (
            <div className="flex flex-wrap gap-3 bg-white p-4 rounded-b-2xl border border-gray-100 shadow-sm">
              <button
                onClick={() => {
                  setTemplateForm({ name: currentTemplate.name, status: currentTemplate.status });
                  setEditingTemplateId(currentTemplate.id);
                  setIsTemplateModalOpen(true);
                }}
                className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <Settings2 size={14} />
                <span>Edit Template Info</span>
              </button>
              <button
                onClick={() => {
                  setClassForm({ name: '' });
                  setEditingClassId(null);
                  setIsClassModalOpen(true);
                }}
                className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Class</span>
              </button>
              {currentClass && (
                <button
                  onClick={() => {
                    setClassForm({ name: currentClass.name });
                    setEditingClassId(currentClass.id);
                    setIsClassModalOpen(true);
                  }}
                  className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Edit size={14} />
                  <span>Rename Selected Class</span>
                </button>
              )}
              {currentClass && (
                <button
                  onClick={() => deleteClass(currentClass.id)}
                  className="px-3.5 py-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected Class</span>
                </button>
              )}
              <button
                onClick={deleteTemplate}
                className="w-full sm:w-auto sm:ml-auto px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Trash2 size={14} />
                <span>Delete Entire Template</span>
              </button>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Class Grid (4 columns) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px]">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <Grid className="text-gray-400 w-5 h-5" />
                <h3 className="font-bold text-gray-800 text-sm">Classes in Template</h3>
              </div>
              
              {currentTemplate.classes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <BookOpen size={36} className="text-gray-300 mb-2" />
                  <p className="text-xs">No classes configured for this template.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                  {currentTemplate.classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border ${
                        selectedClassId === c.id
                          ? 'bg-darkBlue text-white border-darkBlue shadow-md font-bold'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100 font-medium'
                      }`}
                    >
                      <span className="text-xs">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedClassId === c.id ? 'bg-white/20 text-white' : 'bg-gray-200/60 text-gray-500'}`}>
                        {c.groups ? `${c.groups.length} Groups` : `${c.subjects?.length || 0} Subjects`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Subject Table / Academic Group panel (8 columns) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[520px]">
              {currentClass ? (
                <div className="flex flex-col h-full">
                  {/* Group header if applicable */}
                  {currentClass.groups ? (
                    <div className="mb-6">
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="text-gray-400 w-5 h-5" />
                          <h3 className="font-bold text-gray-800 text-sm">Academic Groups ({currentClass.name})</h3>
                        </div>
                        <button
                          onClick={() => {
                            setGroupForm({ name: '' });
                            setEditingGroupId(null);
                            setIsGroupModalOpen(true);
                          }}
                          className="text-xs font-semibold bg-greenAccent/10 hover:bg-greenAccent/20 text-green-700 px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                        >
                          <Plus size={14} />
                          <span>Add Group</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {currentClass.groups.map((g) => (
                          <div
                            key={g.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                              selectedGroupId === g.id
                                ? 'bg-greenAccent/15 border-greenAccent text-green-800 font-bold'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 font-medium cursor-pointer'
                            }`}
                            onClick={() => setSelectedGroupId(g.id)}
                          >
                            <span>{g.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupForm({ name: g.name });
                                setEditingGroupId(g.id);
                                setIsGroupModalOpen(true);
                              }}
                              className="p-0.5 text-gray-400 hover:text-green-800 transition-colors"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGroup(g.id);
                              }}
                              className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Subjects Area */}
                  <div className="flex items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                      Subjects List {currentClass.groups ? `— ${currentGroup?.name || ''}` : `(${currentClass.name})`}
                    </h4>
                    <button
                      onClick={() => {
                        setSubjectForm({ name: '', code: '', enabled: true });
                        setEditingSubjectId(null);
                        setIsSubjectModalOpen(true);
                      }}
                      className="bg-darkBlue hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <Plus size={14} />
                      <span>Add Subject</span>
                    </button>
                  </div>

                  {/* Subject List Table */}
                  <div className="flex-1 overflow-x-auto">
                    {((currentClass.groups ? currentGroup?.subjects : currentClass.subjects) || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-12 text-gray-500 h-64">
                        <BookOpen size={48} className="text-gray-300 mb-3" />
                        <p className="text-sm font-semibold">No subjects added</p>
                        <p className="text-xs text-gray-400 mt-1">Configure subjects for this class/group by clicking the Add Subject button.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs font-bold border-b border-gray-100">
                            <th className="p-3">Subject Name</th>
                            <th className="p-3">Subject Code</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                          {((currentClass.groups ? currentGroup?.subjects : currentClass.subjects) || []).map((sub) => (
                            <tr key={sub.id} className={`hover:bg-gray-50 transition-colors ${!sub.enabled ? 'bg-gray-50/50 opacity-60' : ''}`}>
                              <td className="p-3 font-semibold text-darkBlue">{sub.name}</td>
                              <td className="p-3 font-medium text-gray-500">{sub.code}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sub.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {sub.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => toggleSubjectStatus(sub.id)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all shrink-0 ${
                                      sub.enabled ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {sub.enabled ? 'Disable' : 'Enable'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSubjectForm({ name: sub.name, code: sub.code, enabled: sub.enabled });
                                      setEditingSubjectId(sub.id);
                                      setIsSubjectModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-flex shrink-0"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteSubject(sub.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all inline-flex shrink-0"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-gray-500">
                  <BookOpen size={48} className="text-gray-300 mb-3" />
                  <p className="text-sm font-semibold">Select a class</p>
                  <p className="text-xs text-gray-400 mt-1">Choose a class from the list on the left to manage its academic structure.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Academic Sessions Tab Content */}
          {activeTab === 'sessions' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Layers className="text-darkBlue" size={18} />
                    Predefined Academic Sessions
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Master academic sessions automatically mapped to all newly created schools.</p>
                </div>
                <button
                  onClick={() => {
                    const newName = prompt('Enter new Academic Session (e.g. 2027-2028):');
                    if (newName) {
                      const updated = [...sessions, { id: `session-${Date.now()}`, name: newName, academicSession: newName, isCurrent: false, status: 'Active' }];
                      setSessions(updated);
                      toast.success(`Session ${newName} added.`);
                    }
                  }}
                  className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={16} />
                  <span>Add New Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className={`p-4 rounded-xl border flex flex-col justify-between ${sess.isCurrent ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">{sess.name}</h4>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${sess.isCurrent ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                          {sess.isCurrent ? 'Current Active Session' : sess.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = sessions.map(s => ({ ...s, isCurrent: s.id === sess.id }));
                          setSessions(updated);
                          toast.success(`Active session set to ${sess.name}`);
                        }}
                        disabled={sess.isCurrent}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${sess.isCurrent ? 'bg-emerald-100 text-emerald-800 cursor-default' : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                      >
                        {sess.isCurrent ? 'Active' : 'Set Active'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Timetable Structure Tab Content */}
          {activeTab === 'timetable' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                    <Grid className="text-darkBlue" size={18} />
                    Master Predefined Timetable Structure
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Predefined Monday to Friday period schedule automatically initialized for each class.</p>
                </div>
                
                {/* Select Class for Timetable View */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Select Class:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 text-gray-800 outline-none"
                  >
                    {currentTemplate.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Timetable Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-darkBlue text-white text-xs font-bold">
                      <th className="p-3 border-r border-blue-900 w-28">Period / Time</th>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <th key={day} className="p-3 border-r border-blue-900 text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-200">
                    {[
                      { period: 'Period 1', time: '08:00 AM - 08:40 AM', defaultSub: 'English' },
                      { period: 'Period 2', time: '08:40 AM - 09:20 AM', defaultSub: 'Urdu' },
                      { period: 'Period 3', time: '09:20 AM - 10:00 AM', defaultSub: 'Mathematics' },
                      { period: 'Period 4', time: '10:00 AM - 10:40 AM', defaultSub: 'General Science' },
                      { period: 'Recess Break', time: '10:40 AM - 11:00 AM', defaultSub: 'Break', isBreak: true },
                      { period: 'Period 5', time: '11:00 AM - 11:40 AM', defaultSub: 'Social Studies' },
                      { period: 'Period 6', time: '11:40 AM - 12:20 PM', defaultSub: 'Computer Science' },
                      { period: 'Period 7', time: '12:20 PM - 01:00 PM', defaultSub: 'Islamiat' },
                    ].map((slot, idx) => (
                      <tr key={idx} className={slot.isBreak ? 'bg-amber-50/70 font-bold' : 'hover:bg-gray-50'}>
                        <td className="p-3 font-bold border-r border-gray-200 bg-gray-50">
                          <div>{slot.period}</div>
                          <div className="text-[10px] font-medium text-gray-500">{slot.time}</div>
                        </td>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                          if (slot.isBreak) {
                            return (
                              <td key={day} className="p-3 text-center border-r border-gray-200 text-amber-700 font-bold bg-amber-50/50">
                                Recess / Break
                              </td>
                            );
                          }
                          const classSubs = (currentClass?.groups ? currentGroup?.subjects : currentClass?.subjects) || [];
                          const subName = classSubs[idx % Math.max(1, classSubs.length)]?.name || slot.defaultSub;
                          return (
                            <td key={day} className="p-3 text-center border-r border-gray-200 font-medium">
                              <div className="font-bold text-darkBlue">{subName}</div>
                              <div className="text-[10px] text-gray-400">Room {currentClass?.name || '1'}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold">No Academic Templates exist</p>
          <p className="text-xs mt-1">Please create a new template to start configuring master academic structures.</p>
        </div>
      )}

      {/* 1. Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">{editingTemplateId ? 'Edit Academic Template' : 'Add New Academic Template'}</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Template Name</label>
                <input
                  required
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Federal Board Curriculum"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={templateForm.status}
                  onChange={(e) => setTemplateForm({ ...templateForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">{editingClassId ? 'Rename Class' : 'Add Class to Template'}</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleClassSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class Name</label>
                <input
                  required
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ name: e.target.value })}
                  placeholder="e.g. Class 11"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">{editingGroupId ? 'Edit Academic Group' : 'Add Academic Group'}</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGroupSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Group Name</label>
                <input
                  required
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ name: e.target.value })}
                  placeholder="e.g. Humanities Group"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject to Template'}</h3>
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
    </div>
  );
};

export default AcademicTemplates;
