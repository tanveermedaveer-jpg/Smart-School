import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Link as LinkIcon, User, BookOpen, FileText, CheckCircle, AlertCircle, Grid, Briefcase, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'class-wise' or 'workload'

  // Class-wise view state
  const [selectedClassViewId, setSelectedClassViewId] = useState('');

  // Workload view state
  const [selectedTeacherWorkloadId, setSelectedTeacherWorkloadId] = useState('');

  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const initialFormState = {
    teacherId: '',
    classId: '', // Represents the class row ID in the database
    subjectId: '',
    academicSession: '2026-2027'
  };

  const [formData, setFormData] = useState(initialFormState);
  
  // Dependent dropdown helpers
  const [selectedClassType, setSelectedClassType] = useState(''); // E.g., "Class 9", "Class 5"
  const [selectedGroup, setSelectedGroup] = useState(''); // "Science Group", "Computer Science Group"
  const [selectedSection, setSelectedSection] = useState(''); // "A", "B" etc.

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    setAssignments(savedAssignments);

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setTeachers(users.filter(u => u.role?.toLowerCase() === 'teacher'));

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);

    if (savedClasses.length > 0) {
      setSelectedClassViewId(savedClasses[0].id);
    }
    if (users.filter(u => u.role?.toLowerCase() === 'teacher').length > 0) {
      setSelectedTeacherWorkloadId(users.filter(u => u.role?.toLowerCase() === 'teacher')[0].id);
    }
  };

  const saveToLocal = (updatedAssignments) => {
    setAssignments(updatedAssignments);
    localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(updatedAssignments));
  };

  // Extract distinct class names (e.g. "Class 1", "Class 5", "Class 9")
  const distinctClassNames = Array.from(new Set(classes.map(c => c.className))).sort((a, b) => {
    const numA = parseInt(a.replace(/^\D+/g, '')) || 0;
    const numB = parseInt(b.replace(/^\D+/g, '')) || 0;
    return numA - numB;
  });

  // Calculate filtered selections for the modal form
  const isClass9Or10 = selectedClassType === 'Class 9' || selectedClassType === 'Class 10';

  // Group options for Class 9/10 (e.g. "Science Group", "Computer Science Group")
  const availableGroups = classes
    .filter(c => c.className === selectedClassType && (c.section.includes('Group') || c.section.includes('Science') || c.section.includes('Computer')))
    .map(c => c.section);

  // Section options for normal classes or selected group
  const availableSections = classes
    .filter(c => {
      if (c.className !== selectedClassType) return false;
      if (isClass9Or10) {
        // If it's a group, the section *is* the group name
        return c.section === selectedGroup;
      }
      return !c.section.includes('Group');
    })
    .map(c => c.section);

  // Available subjects for the selected class row
  const matchedClassRow = classes.find(c => {
    if (c.className !== selectedClassType) return false;
    if (isClass9Or10) {
      return c.section === selectedGroup;
    }
    return c.section === selectedSection;
  });

  const availableSubjects = matchedClassRow
    ? subjects.filter(s => s.classId.toString() === matchedClassRow.id.toString() && s.enabled)
    : [];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    if (!matchedClassRow) {
      toast.error('Invalid Class/Section selection.');
      return;
    }

    const payload = {
      teacherId: formData.teacherId,
      classId: matchedClassRow.id, // Maps to the unique class row ID in the DB
      subjectId: formData.subjectId,
      academicSession: formData.academicSession || '2026-2027',
      schoolId: schoolId
    };

    // Prevent duplicate assignment
    const isDuplicate = assignments.some(a => 
      a.classId.toString() === payload.classId.toString() &&
      a.subjectId.toString() === payload.subjectId.toString() &&
      a.academicSession === payload.academicSession &&
      a.id !== editingId
    );

    if (isDuplicate) {
      toast.error('This subject is already assigned to a teacher for this class/section.');
      return;
    }

    if (editingId) {
      const updated = assignments.map(a => a.id === editingId ? { ...payload, id: editingId } : a);
      saveToLocal(updated);
      toast.success('Teacher assigned successfully');
    } else {
      const newAssignment = { ...payload, id: Date.now() };
      saveToLocal([...assignments, newAssignment]);
      toast.success('Teacher assigned successfully');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this teacher assignment?')) {
      saveToLocal(assignments.filter(a => a.id !== id));
      toast.success('Assignment removed successfully');
    }
  };

  const openModal = (assignment = null) => {
    if (assignment) {
      const cls = classes.find(c => c.id.toString() === assignment.classId.toString());
      if (cls) {
        setSelectedClassType(cls.className);
        if (cls.className === 'Class 9' || cls.className === 'Class 10') {
          setSelectedGroup(cls.section);
        } else {
          setSelectedSection(cls.section);
        }
      }
      setFormData(assignment);
      setEditingId(assignment.id);
    } else {
      setFormData(initialFormState);
      setSelectedClassType('');
      setSelectedGroup('');
      setSelectedSection('');
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const openModalForUnassigned = (classId, subjectId) => {
    const cls = classes.find(c => c.id.toString() === classId.toString());
    if (cls) {
      setSelectedClassType(cls.className);
      if (cls.className === 'Class 9' || cls.className === 'Class 10') {
        setSelectedGroup(cls.section);
      } else {
        setSelectedSection(cls.section);
      }
    }
    setFormData({
      ...initialFormState,
      classId: classId,
      subjectId: subjectId
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id.toString() === id.toString());
    return teacher ? teacher.name : 'Unknown';
  };

  const getClassRow = (id) => {
    return classes.find(c => c.id.toString() === id.toString());
  };

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  // Calculations for Summary Cards
  const totalTeachers = teachers.length;
  const assignedTeachersCount = new Set(assignments.map(a => a.teacherId)).size;
  const totalAssignments = assignments.length;
  const unassignedSubjectsCount = subjects.filter(sub => sub.enabled && !assignments.some(a => a.subjectId.toString() === sub.id.toString())).length;

  // Filtered assignments for the table view
  const filteredAssignments = assignments.filter(a => {
    const teacherName = getTeacherName(a.teacherId).toLowerCase();
    const classRow = getClassRow(a.classId);
    const className = classRow ? `${classRow.className} - ${classRow.section}`.toLowerCase() : '';
    const subjectName = getSubjectName(a.subjectId).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = teacherName.includes(query) || className.includes(query) || subjectName.includes(query);
    const matchesTeacher = !filterTeacher || a.teacherId.toString() === filterTeacher.toString();
    const matchesClass = !filterClass || (classRow && classRow.className === filterClass);
    const matchesSubject = !filterSubject || a.subjectId.toString() === filterSubject.toString();

    return matchesSearch && matchesTeacher && matchesClass && matchesSubject;
  });

  // Data for Class-wise View
  const currentClassView = classes.find(c => c.id.toString() === selectedClassViewId.toString());
  const classViewSubjects = currentClassView ? subjects.filter(s => s.classId.toString() === currentClassView.id.toString() && s.enabled) : [];

  // Data for Teacher Workload View
  const workloadTeacher = teachers.find(t => t.id.toString() === selectedTeacherWorkloadId.toString());
  const teacherAssignments = workloadTeacher ? assignments.filter(a => a.teacherId.toString() === workloadTeacher.id.toString()) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Teacher Assignments</h2>
          <p className="text-gray-500 text-sm mt-1">Associate teachers to specific school classes, sections, and subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-darkBlue shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('class-wise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'class-wise' ? 'bg-white text-darkBlue shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Class-wise View
            </button>
            <button
              onClick={() => setViewMode('workload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'workload' ? 'bg-white text-darkBlue shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Teacher Workload
            </button>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus size={16} />
            <span>Assign Teacher</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Total Teachers</span>
            <h3 className="text-2xl font-black text-darkBlue mt-1">{totalTeachers}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><User size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Assigned Teachers</span>
            <h3 className="text-2xl font-black text-greenAccent mt-1">{assignedTeachersCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Total Assignments</span>
            <h3 className="text-2xl font-black text-darkBlue mt-1">{totalAssignments}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><Briefcase size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Unassigned Subjects</span>
            <h3 className="text-2xl font-black text-red-500 mt-1">{unassignedSubjectsCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-500"><AlertCircle size={24} /></div>
        </div>
      </div>

      {/* VIEW MODE 1: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teacher, class, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs transition-all bg-gray-50/50"
              />
            </div>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Classes</option>
              {distinctClassNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTeacher('');
                setFilterClass('');
                setFilterSubject('');
              }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold px-2 py-2"
            >
              Reset Filters
            </button>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredAssignments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <LinkIcon className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm font-semibold">No teacher assignments match the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-4 font-bold">Teacher</th>
                      <th className="p-4 font-bold">Class</th>
                      <th className="p-4 font-bold">Section / Group</th>
                      <th className="p-4 font-bold">Subject</th>
                      <th className="p-4 font-bold">Session</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {filteredAssignments.map((assignment) => {
                      const classRow = getClassRow(assignment.classId);
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-semibold text-darkBlue flex items-center">
                            <User size={14} className="text-gray-400 mr-2" />
                            {getTeacherName(assignment.teacherId)}
                          </td>
                          <td className="p-4 font-medium">{classRow ? classRow.className : 'Unknown'}</td>
                          <td className="p-4 font-medium">
                            <span className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 text-[10px] font-semibold text-gray-600">
                              {classRow ? classRow.section : '-'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 flex items-center pt-5">
                            <FileText size={14} className="text-gray-400 mr-2" />
                            {getSubjectName(assignment.subjectId)}
                          </td>
                          <td className="p-4 font-medium text-gray-500">{assignment.academicSession}</td>
                          <td className="p-4 text-right space-x-1.5">
                            <button onClick={() => openModal(assignment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all inline-flex">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(assignment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all inline-flex">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CLASS-WISE VIEW */}
      {viewMode === 'class-wise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: List of Classes (4 columns) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Grid className="text-gray-400 w-5 h-5" />
              <h3 className="font-bold text-gray-800 text-sm">Select Class & Section</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassViewId(cls.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border ${
                    selectedClassViewId === cls.id
                      ? 'bg-darkBlue text-white border-darkBlue shadow-md font-bold'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100 font-medium'
                  }`}
                >
                  <span className="text-xs">{cls.className} - {cls.section}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Subject allocations in selected Class (8 columns) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm min-h-[520px]">
            {currentClassView ? (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-800 text-sm">{currentClassView.className} — {currentClassView.section} Subjects Allocation</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                        <th className="p-3 font-semibold">Subject</th>
                        <th className="p-3 font-semibold">Code</th>
                        <th className="p-3 font-semibold">Assigned Teacher</th>
                        <th className="p-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-gray-50">
                      {classViewSubjects.map((sub) => {
                        const assignment = assignments.find(a => a.subjectId.toString() === sub.id.toString() && a.classId.toString() === currentClassView.id.toString());
                        return (
                          <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-semibold text-darkBlue">{sub.subjectName}</td>
                            <td className="p-3 font-medium text-gray-400">{sub.subjectCode}</td>
                            <td className="p-3">
                              {assignment ? (
                                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                  {getTeacherName(assignment.teacherId)}
                                </span>
                              ) : (
                                <span className="text-red-500 font-semibold bg-red-50 px-2 py-1 rounded border border-red-100 inline-flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Not Assigned
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {assignment ? (
                                <button
                                  onClick={() => openModal(assignment)}
                                  className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-all"
                                >
                                  Change Teacher
                                </button>
                              ) : (
                                <button
                                  onClick={() => openModalForUnassigned(currentClassView.id, sub.id)}
                                  className="text-[10px] font-bold bg-greenAccent/15 text-green-700 px-2 py-1 rounded hover:bg-greenAccent/30 transition-all"
                                >
                                  Assign Teacher
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 text-gray-500 h-64">
                <BookOpen size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold">Select a class section from the left panel.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TEACHER WORKLOAD VIEW */}
      {viewMode === 'workload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: List of Teachers (4 columns) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <User className="text-gray-400 w-5 h-5" />
              <h3 className="font-bold text-gray-800 text-sm">Select Teacher</h3>
            </div>
            {teachers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <AlertCircle size={36} className="text-gray-200 mb-2" />
                <p className="text-xs">No teachers configured in User Management.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {teachers.map((t) => {
                  const teacherLoad = assignments.filter(a => a.teacherId.toString() === t.id.toString()).length;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherWorkloadId(t.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border ${
                        selectedTeacherWorkloadId === t.id
                          ? 'bg-darkBlue text-white border-darkBlue shadow-md font-bold'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100 font-medium'
                      }`}
                    >
                      <span className="text-xs">{t.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedTeacherWorkloadId === t.id ? 'bg-white/20 text-white' : 'bg-gray-200/60 text-gray-500'}`}>
                        {teacherLoad} Assignments
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Assignments lists of selected Teacher (8 columns) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm min-h-[520px]">
            {workloadTeacher ? (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm">{workloadTeacher.name}'s Assignments Workload</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                    Total Assignments: {teacherAssignments.length}
                  </span>
                </div>

                {teacherAssignments.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <Briefcase className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-sm font-semibold">No active assignments for this teacher.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teacherAssignments.map((a) => {
                      const classRow = getClassRow(a.classId);
                      return (
                        <div key={a.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl shadow-sm relative group">
                          <h4 className="font-bold text-darkBlue text-sm">{classRow ? `${classRow.className} - ${classRow.section}` : 'Unknown Class'}</h4>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                            <FileText size={14} />
                            <span>{getSubjectName(a.subjectId)}</span>
                          </div>
                          <span className="absolute top-4 right-4 text-[10px] text-gray-400 font-semibold">{a.academicSession}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 text-gray-500 h-64">
                <User size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold">Select a teacher from the left panel.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FORM FOR NEW OR EDITING ASSIGNMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Assignment' : 'Assign Teacher'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {teachers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No teachers found</h4>
                <p className="text-xs mt-1 mb-4">Please add teachers first in User Management.</p>
                <button
                  type="button"
                  onClick={() => toast.error('Redirect to User Management is managed via School Admin Sidebar')}
                  className="bg-greenAccent text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-green-600"
                >
                  Add Teacher
                </button>
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-800">No academic subjects configured</h4>
                <p className="text-xs mt-1 mb-4 font-medium">Please initialize or configure your classes and subjects first.</p>
                <button
                  type="button"
                  onClick={() => toast.error('Configure subjects via Classes details view')}
                  className="bg-greenAccent text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-green-600"
                >
                  Manage Academic Setup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* 1. Teacher */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Teacher</label>
                  <select
                    required
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Class Name (e.g. Class 1, Class 9) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                  <select
                    required
                    value={selectedClassType}
                    onChange={(e) => {
                      setSelectedClassType(e.target.value);
                      setSelectedGroup('');
                      setSelectedSection('');
                      setFormData({ ...formData, subjectId: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                  >
                    <option value="">-- Select Class --</option>
                    {distinctClassNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Group (Only for Class 9 and Class 10) */}
                {isClass9Or10 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Academic Group</label>
                    <select
                      required
                      value={selectedGroup}
                      onChange={(e) => {
                        setSelectedGroup(e.target.value);
                        setFormData({ ...formData, subjectId: '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                    >
                      <option value="">-- Select Academic Group --</option>
                      {availableGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Section (Only for normal classes or if Group is selected) */}
                {(!isClass9Or10 || selectedGroup) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                    <select
                      required
                      value={selectedSection}
                      onChange={(e) => {
                        setSelectedSection(e.target.value);
                        setFormData({ ...formData, subjectId: '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                    >
                      <option value="">-- Select Section --</option>
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 5. Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                  <select
                    required
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    disabled={!matchedClassRow}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">-- Select Subject --</option>
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subjectName}</option>
                    ))}
                  </select>
                  {matchedClassRow && availableSubjects.length === 0 && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      No subjects configured for this class setup.
                    </span>
                  )}
                </div>

                {/* 6. Academic Session */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Academic Session</label>
                  <input
                    readOnly
                    type="text"
                    name="academicSession"
                    value={formData.academicSession}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none text-gray-500"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Assignment</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
