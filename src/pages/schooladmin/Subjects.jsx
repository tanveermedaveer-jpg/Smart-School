import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, FileText, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  const initialFormState = {
    subjectName: '',
    subjectCode: '',
    teacherId: '',
    classId: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setTeachers(users.filter(u => u.role?.toLowerCase() === 'teacher'));

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    setAssignments(savedAssignments);
  };

  const saveToLocal = (updatedSubjects) => {
    setSubjects(updatedSubjects);
    localStorage.setItem('schoolAdminSubjects', JSON.stringify(updatedSubjects));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getSubjectTeacherId = (subId, classId) => {
    const assign = assignments.find(a => 
      a.subjectId?.toString() === subId?.toString() && 
      a.classId?.toString() === classId?.toString() &&
      a.academicSession === '2026-2027'
    );
    return assign ? assign.teacherId?.toString() : '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let savedSubId = editingId;
    const subjectPayload = {
      subjectName: formData.subjectName,
      subjectCode: formData.subjectCode,
      classId: formData.classId,
      enabled: true,
      schoolId: schoolId
    };

    let updatedSubjects = [];
    if (editingId) {
      updatedSubjects = subjects.map(s => s.id === editingId ? { ...subjectPayload, id: editingId } : s);
      saveToLocal(updatedSubjects);
      toast.success('Subject updated successfully');
    } else {
      savedSubId = Date.now();
      const newSubject = { ...subjectPayload, id: savedSubId };
      updatedSubjects = [...subjects, newSubject];
      saveToLocal(updatedSubjects);
      toast.success('Subject created successfully');
    }

    // Synchronize assignment
    const allAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    const filteredAssignments = allAssignments.filter(a => 
      !(a.subjectId?.toString() === savedSubId?.toString() && 
        a.classId?.toString() === formData.classId?.toString() && 
        a.academicSession === '2026-2027')
    );

    if (formData.teacherId) {
      const newAssignment = {
        id: Date.now() + Math.random(),
        teacherId: formData.teacherId,
        classId: formData.classId,
        subjectId: savedSubId,
        academicSession: '2026-2027',
        schoolId: schoolId
      };
      localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify([...filteredAssignments, newAssignment]));
    } else {
      localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(filteredAssignments));
    }

    loadData();
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      const updated = subjects.filter(s => s.id !== id);
      saveToLocal(updated);

      // Clean up assignments
      const allAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
      const filteredAssignments = allAssignments.filter(a => a.subjectId?.toString() !== id.toString());
      localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(filteredAssignments));
      
      loadData();
      toast.success('Subject deleted');
    }
  };

  const openModal = (sub = null) => {
    if (sub) {
      const teacherId = getSubjectTeacherId(sub.id, sub.classId);
      setFormData({
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        classId: sub.classId,
        teacherId: teacherId
      });
      setEditingId(sub.id);
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
    const teacher = teachers.find(t => t.id.toString() === id.toString());
    return teacher ? teacher.name : 'Not Assigned';
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Not Assigned';
  };

  // Derived filtered subjects
  const filteredSubjects = subjects.filter(sub => {
    const teacherId = getSubjectTeacherId(sub.id, sub.classId);

    // 1. Search Query Match
    const q = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (q) {
      const subjectName = (sub.subjectName || '').toLowerCase();
      const subjectCode = (sub.subjectCode || '').toLowerCase();
      const teacherName = getTeacherName(teacherId).toLowerCase();
      const className = getClassName(sub.classId).toLowerCase();
      matchesSearch = subjectName.includes(q) ||
                      subjectCode.includes(q) ||
                      teacherName.includes(q) ||
                      className.includes(q);
    }

    // 2. Class Filter Match
    let matchesClass = true;
    if (selectedClassId) {
      matchesClass = sub.classId.toString() === selectedClassId.toString();
    }

    // 3. Teacher Filter Match
    let matchesTeacher = true;
    if (selectedTeacherId) {
      matchesTeacher = teacherId.toString() === selectedTeacherId.toString();
    }

    return matchesSearch && matchesClass && matchesTeacher;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Subjects Management</h2>
          <p className="text-gray-500 text-sm mt-1">Create subjects and assign them to classes and teachers.</p>
        </div>
        <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm text-xs">
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Toolbar - Responsive Search & Filters */}
      {subjects.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Field */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search subjects, codes, teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-white transition-all text-gray-700"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-white transition-all text-gray-700"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} - {cls.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Filter Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-white transition-all text-gray-700"
              >
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClassId('');
                setSelectedTeacherId('');
              }}
              className="flex items-center justify-center space-x-2 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Result Count Indicator */}
          <div className="text-xs text-gray-500 font-medium">
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {subjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No subjects added yet.
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 text-gray-400 mb-3">
              <Search size={24} />
            </div>
            <h4 className="text-base font-semibold text-gray-800">No subjects found</h4>
            <p className="text-gray-500 text-sm mt-1">Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Subject Info</th>
                  <th className="p-4 font-semibold">Assigned Teacher</th>
                  <th className="p-4 font-semibold">Class</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {filteredSubjects.map((sub) => {
                  const teacherId = getSubjectTeacherId(sub.id, sub.classId);
                  return (
                    <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-darkBlue flex items-center space-x-2">
                          <FileText size={16} className="text-gray-400" />
                          <span>{sub.subjectName}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 ml-6">Code: {sub.subjectCode}</div>
                      </td>
                      <td className="p-4 font-bold text-gray-700">{getTeacherName(teacherId)}</td>
                      <td className="p-4 font-medium text-gray-600">{getClassName(sub.classId)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex">
                          <Trash2 size={16} />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Name</label>
                <input required type="text" name="subjectName" value={formData.subjectName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Code</label>
                <input required type="text" name="subjectCode" value={formData.subjectCode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Teacher</label>
                <select name="teacherId" value={formData.teacherId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs bg-white">
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Class</label>
                <select required name="classId" value={formData.classId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs bg-white">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
