import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Plus, Edit, Trash2, X, Users, UserCheck, BookOpen, Key, Phone, Mail, Award, CheckCircle, ShieldAlert, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/PasswordInput';
import { logSystemAction } from '../../utils/logger';
import { generateMonthlyFees } from '../../utils/feeGenerator';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('teacher'); // teacher, student, parent
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Drill-down View Profile states
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [viewingParentId, setViewingParentId] = useState(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newTempPassword, setNewTempPassword] = useState('');

  // Class Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState(null);
  const [transferClassId, setTransferClassId] = useState('');

  // Delete Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All'); // For compatibility

  // Initial forms state
  const initialFormState = {
    // Basic User Fields
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    status: 'Active',

    // Student Fields
    fatherName: '',
    dob: '',
    gender: 'Male',
    address: '',
    photo: '',
    previousSchool: '',
    rollNumber: '',
    academicSession: '2026-2027',
    classId: '',

    // Parent Mode Selection
    parentMode: 'new', // 'existing' or 'new'
    selectedParentId: '',
    parentName: '',
    parentRelationship: 'Father',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    parentPhoto: '',
    parentPassword: 'Parent123!'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Helper variables for modal dependent dropdowns
  const [selectedClassType, setSelectedClassType] = useState(''); // "Class 9", "Class 5"
  const [selectedGroup, setSelectedGroup] = useState(''); // "Science Group", "Computer Science Group"
  const [selectedSection, setSelectedSection] = useState(''); // "A", "B" etc.

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setUsers(allUsers);
    
    const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(allClasses);

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  };

  const saveToLocal = (updatedUsers) => {
    // Ensure schoolId is always a string and role is lowercase on every save
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = (authUser.schoolId || '').toString();
    const normalized = updatedUsers.map(u => ({
      ...u,
      schoolId: u.schoolId != null ? u.schoolId.toString() : schoolId,
      role: u.role ? u.role.toString() : u.role,
    }));
    setUsers(normalized);
    localStorage.setItem('schoolAdminUsers', JSON.stringify(normalized));
  };

  // Extract distinct class names (e.g. "Class 1", "Class 5", "Class 9")
  const distinctClassNames = Array.from(new Set(classes.map(c => c.className))).sort((a, b) => {
    const numA = parseInt(a.replace(/^\D+/g, '')) || 0;
    const numB = parseInt(b.replace(/^\D+/g, '')) || 0;
    return numA - numB;
  });

  const isClass9Or10 = selectedClassType === 'Class 9' || selectedClassType === 'Class 10';

  const availableGroups = classes
    .filter(c => c.className === selectedClassType && (c.section.includes('Group') || c.section.includes('Science') || c.section.includes('Computer')))
    .map(c => c.section);

  const availableSections = classes
    .filter(c => {
      if (c.className !== selectedClassType) return false;
      if (isClass9Or10) {
        return c.section === selectedGroup;
      }
      return !c.section.includes('Group');
    })
    .map(c => c.section);

  const matchedClassRow = classes.find(c => {
    if (c.className !== selectedClassType) return false;
    if (isClass9Or10) {
      return c.section === selectedGroup;
    }
    return c.section === selectedSection;
  });

  const handleInputChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Core submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';

    if (activeTab === 'student' && !matchedClassRow) {
      toast.error('Please complete the Class & Section assignment.');
      return;
    }

    if (editingId) {
      const existingUser = users.find(u => u.id === editingId);
      const updatedData = { ...existingUser, ...formData, id: editingId, role: activeTab, schoolId };
      
      if (activeTab === 'student') {
        const rollNumber = (formData.rollNumber || '').trim();
        if (!rollNumber) {
          toast.error('Admission ID / Roll Number cannot be empty.');
          return;
        }

        const rollExists = users.some(u => 
          u.id !== editingId &&
          u.schoolId?.toString() === schoolId.toString() &&
          u.rollNumber?.toLowerCase() === rollNumber.toLowerCase()
        );
        if (rollExists) {
          toast.error('Roll Number / Admission ID already exists in this school. Please provide a unique ID.');
          return;
        }

        updatedData.rollNumber = rollNumber;
        updatedData.username = rollNumber;
        updatedData.email = `${rollNumber}@school.com`;
        updatedData.classId = matchedClassRow.id;

        // Sync changes back to parent user profile
        const updatedUsersList = users.map(u => {
          if (u.id?.toString() === existingUser.parentId?.toString()) {
            return {
              ...u,
              name: formData.parentName || u.name,
              relationship: formData.parentRelationship || u.relationship,
              phone: formData.parentPhone || u.phone,
              email: formData.parentEmail || u.email,
              password: formData.parentPassword || u.password,
              photo: formData.parentPhoto || u.photo
            };
          }
          return u;
        });

        const studentIdx = updatedUsersList.findIndex(u => u.id === editingId);
        updatedUsersList[studentIdx] = updatedData;
        saveToLocal(updatedUsersList);
      } else {
        const updated = users.map(u => u.id === editingId ? updatedData : u);
        saveToLocal(updated);
      }
      
      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} updated successfully`);
      closeModal();
    } else {
      // Creating New User
      const newUserId = Date.now();
      let newUser = {
        ...formData,
        id: newUserId,
        role: activeTab,
        schoolId,
        status: formData.status || 'Active'
      };

      if (activeTab === 'teacher') {
        // Enforce username uniqueness
        const usernameExists = users.some(u => u.username?.toLowerCase() === formData.username?.toLowerCase());
        if (usernameExists) {
          toast.error('Username already exists. Please choose a unique username.');
          return;
        }
      }

      if (activeTab === 'student') {
        // Generate roll number / Student ID if not provided
        let rollNumber = formData.rollNumber.trim();
        if (!rollNumber) {
          const studentCount = users.filter(u => u.role === 'student').length;
          rollNumber = `2026-${String(studentCount + 1).padStart(3, '0')}`;
        }

        // Validate Roll Number uniqueness within the same school
        const rollExists = users.some(u => 
          u.schoolId?.toString() === schoolId.toString() &&
          u.rollNumber?.toLowerCase() === rollNumber.toLowerCase()
        );
        if (rollExists) {
          toast.error('Roll Number / Student ID already exists in this school. Please provide a unique ID.');
          return;
        }

        newUser.rollNumber = rollNumber;
        newUser.username = rollNumber; // Login ID is Roll Number
        newUser.email = `${rollNumber}@school.com`;
        newUser.classId = matchedClassRow.id;

        // Process Parent Link
        let parentId = null;
        if (formData.parentMode === 'existing') {
          if (!formData.selectedParentId) {
            toast.error('Please select an existing parent.');
            return;
          }
          parentId = parseInt(formData.selectedParentId);
          
          // Link parent to this student child
          const updatedUsersList = users.map(u => {
            if (u.id === parentId) {
              const childIds = u.childIds ? [...u.childIds, newUserId] : [u.childId, newUserId].filter(Boolean);
              return { ...u, childIds, childId: newUserId };
            }
            return u;
          });
          newUser.parentId = parentId;
          saveToLocal([...updatedUsersList, newUser]);
        } else {
          // Create New Parent
          const newParentId = Date.now() + 1;
          const parentUser = {
            id: newParentId,
            name: formData.parentName,
            relationship: formData.parentRelationship,
            phone: formData.parentPhone,
            email: formData.parentEmail,
            address: formData.parentAddress || formData.address,
            photo: formData.parentPhoto,
            password: formData.parentPassword,
            role: 'parent',
            status: 'Active',
            schoolId: schoolId,
            childId: newUserId,
            childIds: [newUserId]
          };

          newUser.parentId = newParentId;
          saveToLocal([...users, newUser, parentUser]);
        }

        generateMonthlyFees(newUserId);
        toast.success(`Student created successfully. Student ID: ${rollNumber}`);
      } else {
        // Normal Parent or Teacher
        saveToLocal([...users, newUser]);
        toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} created successfully`);
      }
      
      logSystemAction('User Created', authUser.name || 'School Admin', authUser.role || 'School Admin', newUser.name);
      closeModal();
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = users.map(u => u.id === id ? { ...u, status: newStatus } : u);
    saveToLocal(updated);
    toast.success(`User marked as ${newStatus}`);
    
    if (newStatus === 'Active') {
      const generated = generateMonthlyFees(id);
      if (generated > 0) {
        toast.success('Generated fee record for newly activated student.');
      }
    }
  };

  const runCascadingDelete = (uid) => {
    // 1. Filter out user from the active state list and localStorage
    const updatedUsers = users.filter(u => u.id !== uid);
    
    // 2. Cascade delete from parent children lists
    const fullyUpdatedUsers = updatedUsers.map(u => {
      if (u.role === 'parent') {
        const childIds = (u.childIds || []).filter(cid => cid.toString() !== uid.toString());
        return { 
          ...u, 
          childIds, 
          childId: childIds.length > 0 ? childIds[0] : '' 
        };
      }
      return u;
    });
    saveToLocal(fullyUpdatedUsers);

    // 3. Cascade delete from global 'users' list as well
    const globalUsers = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(globalUsers.filter(u => u.id !== uid)));

    // 4. Cascade delete Attendance records
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId || 'global';
    const attKey = schoolId ? `schoolAdminAttendance_${schoolId}` : 'schoolAdminAttendance';
    const attendance = JSON.parse(localStorage.getItem(attKey) || '{}');
    let attChanged = false;
    Object.keys(attendance).forEach(date => {
      if (attendance[date] && attendance[date][uid]) {
        delete attendance[date][uid];
        attChanged = true;
      }
    });
    if (attChanged) {
      localStorage.setItem(attKey, JSON.stringify(attendance));
    }

    // 5. Cascade delete Fee records
    const fees = JSON.parse(localStorage.getItem('schoolAdminFees') || '[]');
    const filteredFees = fees.filter(f => f.studentId?.toString() !== uid.toString());
    if (fees.length !== filteredFees.length) {
      localStorage.setItem('schoolAdminFees', JSON.stringify(filteredFees));
    }

    // 6. Cascade delete Marks
    const marks = JSON.parse(localStorage.getItem('teacherMarks') || '[]');
    const filteredMarks = marks.filter(m => m.studentId?.toString() !== uid.toString() && m.teacherId?.toString() !== uid.toString());
    if (marks.length !== filteredMarks.length) {
      localStorage.setItem('teacherMarks', JSON.stringify(filteredMarks));
    }

    // 7. Cascade delete Results
    const results = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
    const filteredResults = results.filter(r => r.studentId?.toString() !== uid.toString());
    if (results.length !== filteredResults.length) {
      localStorage.setItem('schoolAdminResults', JSON.stringify(filteredResults));
    }

    // 8. Cascade delete Teacher Assignments
    const assignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    const filteredAssignments = assignments.filter(a => a.teacherId?.toString() !== uid.toString());
    if (assignments.length !== filteredAssignments.length) {
      localStorage.setItem('schoolAdminTeacherAssignments', JSON.stringify(filteredAssignments));
    }

    // 9. Cascade delete Timetable References
    const timetable = JSON.parse(localStorage.getItem('schoolAdminTimetable') || '{}');
    let timetableChanged = false;
    Object.keys(timetable).forEach(classId => {
      const classTimetable = timetable[classId];
      if (classTimetable && typeof classTimetable === 'object') {
        Object.keys(classTimetable).forEach(day => {
          const dayTimetable = classTimetable[day];
          if (dayTimetable && typeof dayTimetable === 'object') {
            Object.keys(dayTimetable).forEach(period => {
              const entry = dayTimetable[period];
              if (entry && typeof entry === 'object' && entry.teacherId?.toString() === uid.toString()) {
                dayTimetable[period] = null;
                timetableChanged = true;
              }
            });
          }
        });
      }
    });
    if (timetableChanged) {
      localStorage.setItem('schoolAdminTimetable', JSON.stringify(timetable));
    }
  };

  const handleDelete = (id) => {
    if (activeTab === 'student') {
      setDeleteConfirmId(id);
      setDeleteInput('');
    } else {
      if (window.confirm('Are you sure you want to permanently delete this record?')) {
        setIsDeleting(true);
        setTimeout(() => {
          try {
            runCascadingDelete(id);
            toast.success('Record deleted successfully.');
          } catch (e) {
            toast.error('Unable to delete record. Please try again.');
          } finally {
            setIsDeleting(false);
          }
        }, 300);
      }
    }
  };

  const confirmHardDelete = () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    
    setIsDeleting(true);
    setTimeout(() => {
      try {
        runCascadingDelete(deleteConfirmId);
        setDeleteConfirmId(null);
        toast.success('Record deleted successfully.');
      } catch (e) {
        toast.error('Unable to delete record. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }, 300);
  };

  const cancelHardDelete = () => {
    setDeleteConfirmId(null);
    setDeleteInput('');
  };

  const openResetModal = (id) => {
    setResetUserId(id);
    setNewTempPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!newTempPassword || newTempPassword.length < 8) {
      toast.error('Temporary password must be at least 8 characters');
      return;
    }
    const updatedUsers = users.map(u => u.id === resetUserId ? { ...u, password: newTempPassword, isTemporaryPassword: false } : u);
    saveToLocal(updatedUsers);
    toast.success('Password reset successfully.');
    setIsResetModalOpen(false);
    setResetUserId(null);
  };

  const openModal = (user = null) => {
    if (user) {
      let populatedUser = { ...user };
      if (user.role?.toLowerCase() === 'student') {
        const allUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
        const parent = allUsers.find(u => u.id?.toString() === user.parentId?.toString());
        if (parent) {
          populatedUser.parentName = parent.name || '';
          populatedUser.parentRelationship = parent.relationship || 'Father';
          populatedUser.parentEmail = parent.email || '';
          populatedUser.parentPhone = parent.phone || '';
          populatedUser.parentPassword = parent.password || '';
          populatedUser.parentPhoto = parent.photo || '';
        }
      }
      setFormData(populatedUser);
      setEditingId(user.id);
      const matchedCls = classes.find(c => c.id.toString() === user.classId?.toString());
      if (matchedCls) {
        setSelectedClassType(matchedCls.className);
        if (matchedCls.className === 'Class 9' || matchedCls.className === 'Class 10') {
          setSelectedGroup(matchedCls.section);
        } else {
          setSelectedSection(matchedCls.section);
        }
      }
    } else {
      setFormData(initialFormState);
      setSelectedClassType('');
      setSelectedGroup('');
      setSelectedSection('');
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Class Transfer Handler
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferClassId) {
      toast.error('Please select a target class');
      return;
    }
    const updated = users.map(u => u.id === transferStudentId ? { ...u, classId: transferClassId } : u);
    saveToLocal(updated);
    toast.success('Student transferred successfully. Historical academic marks and fees remain intact.');
    setIsTransferModalOpen(false);
    setTransferStudentId(null);
    setTransferClassId('');
    setViewingStudentId(null); // refresh details
  };

  // Grouping students & parent list
  const teachersList = users.filter(u => u.role?.toLowerCase() === 'teacher');
  const studentsList = users.filter(u => u.role?.toLowerCase() === 'student');
  const parentsList = users.filter(u => u.role?.toLowerCase() === 'parent');

  // Search & Filter arrays
  const filteredUsers = users.filter(u => {
    if (u.role?.toLowerCase() !== activeTab) return false;
    
    // Status filter
    if (activeTab === 'student' && studentStatusFilter !== 'All' && u.status !== studentStatusFilter) return false;
    if (filterStatus && u.status !== filterStatus) return false;

    // Class filter
    if (filterClassId && u.classId?.toString() !== filterClassId.toString()) return false;

    // Search query
    const nameMatch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = (u.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (u.phone || '').includes(searchQuery);

    return nameMatch || rollMatch || emailMatch || phoneMatch;
  });

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'N/A';
  };

  const getParentName = (student) => {
    const parent = parentsList.find(p => p.id === student.parentId || p.childId === student.id || p.linkedStudentId === student.id || (p.childIds && p.childIds.includes(student.id)));
    return parent ? parent.name : 'Unknown';
  };

  const getChildrenOfParent = (parentId) => {
    return studentsList.filter(s => s.parentId === parentId || (parentsList.find(p => p.id === parentId)?.childIds || []).includes(s.id));
  };

  // Calculations for summary cards
  const totalStudentsCount = studentsList.length;
  const activeStudentsCount = studentsList.filter(s => s.status === 'Active').length;
  const maleStudentsCount = studentsList.filter(s => s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'm').length;
  const femaleStudentsCount = studentsList.filter(s => s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'f').length;
  
  const admissions = JSON.parse(localStorage.getItem('admissions') || '[]');
  const pendingAdmissionsCount = admissions.filter(a => a.status === 'Pending').length;

  const totalParentsCount = parentsList.length;
  const activeParentsCount = parentsList.filter(p => p.status === 'Active').length;

  const tabs = [
    { id: 'teacher', label: 'Teachers', icon: <BookOpen size={18} /> },
    { id: 'student', label: 'Students', icon: <UserCheck size={18} /> },
    { id: 'parent', label: 'Parents', icon: <Users size={18} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage details and placements for teachers, students, and parent accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons tableId="export-table" filename={`School_${activeTab}s`} />
          <button
            onClick={() => openModal()}
            className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm animate-fade-in"
          >
            <Plus size={16} />
            <span>Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === 'student' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Total Students</span>
            <h3 className="text-xl font-bold text-darkBlue mt-1">{totalStudentsCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Active Students</span>
            <h3 className="text-xl font-bold text-greenAccent mt-1">{activeStudentsCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Male Students</span>
            <h3 className="text-xl font-bold text-darkBlue mt-1">{maleStudentsCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Female Students</span>
            <h3 className="text-xl font-bold text-darkBlue mt-1">{femaleStudentsCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Pending Admissions</span>
            <h3 className="text-xl font-bold text-amber-600 mt-1">{pendingAdmissionsCount}</h3>
          </div>
        </div>
      )}

      {activeTab === 'parent' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Total Parents</span>
            <h3 className="text-xl font-bold text-darkBlue mt-1">{totalParentsCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Active Parents</span>
            <h3 className="text-xl font-bold text-greenAccent mt-1">{activeParentsCount}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setViewingStudentId(null);
                setViewingParentId(null);
              }}
              className={`flex-1 py-4 flex items-center justify-center space-x-2 font-semibold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'text-darkBlue border-b-2 border-darkBlue bg-blue-50/50' 
                  : 'text-gray-500 hover:text-darkBlue hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VIEW DRILL-DOWN: STUDENT PROFILE VIEW */}
      {activeTab === 'student' && viewingStudentId && (() => {
        const student = studentsList.find(s => s.id.toString() === viewingStudentId.toString());
        if (!student) return null;
        
        const parent = parentsList.find(p => p.id === student.parentId || p.childId === student.id || p.linkedStudentId === student.id || (p.childIds && p.childIds.includes(student.id)));
        const classRow = classes.find(c => c.id.toString() === student.classId?.toString());
        const studentSubjects = classRow ? subjects.filter(s => s.classId.toString() === classRow.id.toString() && s.enabled) : [];

        return (
          <div className="space-y-6 animate-fade-in bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <button onClick={() => setViewingStudentId(null)} className="text-xs font-semibold text-gray-500 hover:text-darkBlue transition-colors">
                &larr; Back to Students List
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTransferStudentId(student.id);
                    setTransferClassId(student.classId || '');
                    setIsTransferModalOpen(true);
                  }}
                  className="bg-darkBlue hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                >
                  <Award size={14} />
                  <span>Transfer / Change Class</span>
                </button>
                <button
                  onClick={() => handleStatusChange(student.id, student.status === 'Active' ? 'Inactive' : 'Active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${student.status === 'Active' ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'}`}
                >
                  {student.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 border-2 border-white shadow-md">
                  {student.photo ? <img src={student.photo} alt="Student" className="w-full h-full object-cover" /> : <UserCheck className="w-full h-full text-gray-400 p-4" />}
                </div>
                <h3 className="text-lg font-bold text-darkBlue">{student.name}</h3>
                <span className="text-xs text-gray-400 font-semibold mt-1">Roll No: {student.rollNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold mt-2 ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {student.status}
                </span>

                <div className="w-full text-left space-y-3 mt-6 border-t border-gray-200 pt-4 text-xs text-gray-600">
                  <div className="flex justify-between"><span className="font-bold text-gray-400 uppercase">Father's Name</span><span className="font-semibold text-gray-800">{student.fatherName || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-gray-400 uppercase">DOB</span><span className="font-semibold text-gray-800">{student.dob || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-gray-400 uppercase">Gender</span><span className="font-semibold text-gray-800">{student.gender || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-gray-400 uppercase">Address</span><span className="font-semibold text-gray-800 truncate max-w-[150px]" title={student.address}>{student.address || 'N/A'}</span></div>
                </div>
              </div>

              {/* Academic Placement */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-50 flex items-center gap-1.5"><Calendar size={16} className="text-greenAccent" />Academic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="font-bold text-gray-400 block uppercase">Session</span><span className="font-semibold text-gray-800 mt-0.5 block">{student.academicSession || '2026-2027'}</span></div>
                    <div><span className="font-bold text-gray-400 block uppercase">Current Class Placement</span><span className="font-semibold text-darkBlue mt-0.5 block">{getClassName(student.classId)}</span></div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="font-bold text-gray-400 block text-xs uppercase mb-2">Assigned Curriculum Subjects</span>
                    {studentSubjects.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No active subjects mapped to this class placement.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {studentSubjects.map(sub => (
                          <span key={sub.id} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                            {sub.subjectName} ({sub.subjectCode})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent Information */}
                <div className="p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-50 flex items-center gap-1.5"><Users size={16} className="text-greenAccent" />Parent / Guardian Information</h4>
                  {parent ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><span className="font-bold text-gray-400 block uppercase">Name</span><span className="font-semibold text-gray-800 mt-0.5 block">{parent.name}</span></div>
                      <div><span className="font-bold text-gray-400 block uppercase">Relationship</span><span className="font-semibold text-gray-800 mt-0.5 block">{parent.relationship || 'Guardian'}</span></div>
                      <div><span className="font-bold text-gray-400 block uppercase">Phone</span><span className="font-semibold text-gray-800 mt-0.5 block">{parent.phone || 'N/A'}</span></div>
                      <div><span className="font-bold text-gray-400 block uppercase">Email</span><span className="font-semibold text-gray-800 mt-0.5 block">{parent.email || 'N/A'}</span></div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No parent account linked to this student profile.</span>
                  )}
                </div>

                {/* Future Module Tabs Placeholder */}
                <div className="bg-gray-50 p-4 border border-dashed border-gray-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Connected Performance Modules (Coming Soon)</span>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-bold">
                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded">Attendance</span>
                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded">Fee Cards</span>
                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded">Exams Ledger</span>
                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded">Report Card</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW DRILL-DOWN: PARENT PROFILE VIEW */}
      {activeTab === 'parent' && viewingParentId && (() => {
        const parent = parentsList.find(p => p.id.toString() === viewingParentId.toString());
        if (!parent) return null;

        const children = getChildrenOfParent(parent.id);

        return (
          <div className="space-y-6 animate-fade-in bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="border-b border-gray-100 pb-4">
              <button onClick={() => setViewingParentId(null)} className="text-xs font-semibold text-gray-500 hover:text-darkBlue transition-colors">
                &larr; Back to Parents List
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1 p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-4 border-2 border-white shadow">
                  {parent.photo ? <img src={parent.photo} alt="Parent" className="w-full h-full object-cover" /> : <Users className="w-full h-full text-gray-400 p-4" />}
                </div>
                <h3 className="text-lg font-bold text-darkBlue">{parent.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold mt-2 ${parent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {parent.status}
                </span>

                <div className="w-full text-left space-y-3 mt-6 border-t border-gray-200 pt-4 text-xs text-gray-600">
                  <div className="flex justify-between flex-col md:flex-row"><span className="font-bold text-gray-400 uppercase">Relationship</span><span className="font-semibold text-gray-800">{parent.relationship || 'Guardian'}</span></div>
                  <div className="flex justify-between flex-col md:flex-row"><span className="font-bold text-gray-400 uppercase">Phone</span><span className="font-semibold text-gray-800">{parent.phone || 'N/A'}</span></div>
                  <div className="flex justify-between flex-col md:flex-row"><span className="font-bold text-gray-400 uppercase">Email</span><span className="font-semibold text-gray-800 truncate max-w-[150px]">{parent.email || 'N/A'}</span></div>
                  <div className="flex justify-between flex-col md:flex-row"><span className="font-bold text-gray-400 uppercase">Address</span><span className="font-semibold text-gray-800 truncate max-w-[150px]" title={parent.address}>{parent.address || 'N/A'}</span></div>
                </div>
              </div>

              {/* Linked Children Card */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-50 flex items-center gap-1.5"><UserCheck size={16} className="text-greenAccent" />Linked Children ({children.length})</h4>
                
                {children.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">No student children accounts linked to this parent.</span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {children.map(child => (
                      <div key={child.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl relative">
                        <h5 className="font-bold text-darkBlue text-sm">{child.name}</h5>
                        <p className="text-gray-400 text-[10px] mt-1 font-semibold">Student ID: {child.rollNumber}</p>
                        <p className="text-gray-500 text-xs mt-2 font-semibold">Class: {getClassName(child.classId)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRIMARY LIST TABLES VIEW */}
      {!viewingStudentId && !viewingParentId && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search name, phone, email, roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs transition-all bg-gray-50/50"
              />
            </div>
            {activeTab === 'student' && (
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                ))}
              </select>
            )}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              {activeTab === 'student' && <option value="Archived">Archived</option>}
            </select>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterClassId('');
                setFilterStatus('');
                setStudentStatusFilter('All');
              }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold px-2 py-2"
            >
              Reset
            </button>
          </div>

          {/* Listing Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No {activeTab}s found matching filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table id="export-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="p-4 font-semibold">User Info</th>
                      {activeTab === 'student' && <th className="p-4 font-semibold">Student ID</th>}
                      {activeTab === 'student' && <th className="p-4 font-semibold">Class placement</th>}
                      {activeTab === 'student' && <th className="p-4 font-semibold">Parent / Guardian</th>}
                      {activeTab === 'teacher' && <th className="p-4 font-semibold">Username</th>}
                      <th className="p-4 font-semibold">Phone</th>
                      {activeTab === 'parent' && <th className="p-4 font-semibold">Linked Children</th>}
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-darkBlue">{user.name}</div>
                          {user.role !== 'student' && <div className="text-gray-500 text-xs">{user.email}</div>}
                        </td>
                        {activeTab === 'student' && <td className="p-4 font-medium text-gray-500">{user.rollNumber}</td>}
                        {activeTab === 'student' && <td className="p-4 font-medium text-darkBlue">{getClassName(user.classId)}</td>}
                        {activeTab === 'student' && <td className="p-4 font-medium text-gray-600">{getParentName(user)}</td>}
                        {activeTab === 'teacher' && <td className="p-4">{user.username}</td>}
                        <td className="p-4">{user.phone}</td>
                        {activeTab === 'parent' && (
                          <td className="p-4 font-semibold text-greenAccent">
                            {getChildrenOfParent(user.id).length} Children
                          </td>
                        )}
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          {activeTab === 'student' && (
                            <button
                              onClick={() => { setViewingStudentId(user.id); setActiveTab('student'); }}
                              className="text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-bold text-gray-600"
                            >
                              Profile
                            </button>
                          )}
                          {activeTab === 'parent' && (
                            <button
                              onClick={() => { setViewingParentId(user.id); setActiveTab('parent'); }}
                              className="text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-bold text-gray-600"
                            >
                              Children
                            </button>
                          )}
                          <button onClick={() => openModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => openResetModal(user.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors inline-flex" title="Reset Password">
                            <Key size={16} />
                          </button>
                          
                          {activeTab === 'student' && (
                            <>
                              {user.status === 'Active' && (
                                <button onClick={() => handleStatusChange(user.id, 'Inactive')} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg hover:bg-yellow-100 transition-colors">Deactivate</button>
                              )}
                              {user.status === 'Inactive' && (
                                <button onClick={() => handleStatusChange(user.id, 'Active')} className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg hover:bg-green-100 transition-colors">Restore</button>
                              )}
                            </>
                          )}

                          <button onClick={() => handleDelete(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors inline-flex" title="Delete">
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
        </div>
      )}

      {/* CORE ADD / EDIT USER MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold capitalize">{editingId ? `Edit ${activeTab}` : `Add New ${activeTab}`}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* SECTION A: Basic Student or User Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-greenAccent" />
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Name" />
                  </div>
                  {activeTab === 'student' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father's Name</label>
                      <input required type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Father's Name" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="email@example.com" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Phone Number" />
                  </div>
                  {activeTab === 'student' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                      <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                      <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                {activeTab === 'student' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Previous School (Optional)</label>
                      <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Previous School" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admission ID / Roll No</label>
                      <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Leave blank to auto-generate" />
                    </div>
                  )}
                  {activeTab === 'teacher' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username (Login ID)</label>
                      <input required type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Username" disabled={editingId} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                    <PasswordInput required name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Photo</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-darkBlue hover:file:bg-blue-100 cursor-pointer" />
                      {formData.photo && <div className="mt-2 w-12 h-12 rounded border overflow-hidden"><img src={formData.photo} alt="Student Preview" className="w-full h-full object-cover" /></div>}
                    </div>
                  )}
                  {activeTab === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Permanent Address</label>
                      <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Permanent Address" />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Academic Info (Student only) */}
              {activeTab === 'student' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-greenAccent" />
                    Academic Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Academic Session</label>
                      <input readOnly type="text" name="academicSession" value={formData.academicSession} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class Placement</label>
                      <select
                        required
                        value={selectedClassType}
                        onChange={(e) => {
                          setSelectedClassType(e.target.value);
                          setSelectedGroup('');
                          setSelectedSection('');
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                      >
                        <option value="">-- Select Class --</option>
                        {distinctClassNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isClass9Or10 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Academic Group</label>
                        <select
                          required
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                        >
                          <option value="">-- Select Academic Group --</option>
                          {availableGroups.map(group => (
                            <option key={group} value={group}>{group}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(!isClass9Or10 || selectedGroup) && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                        <select
                          required
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                        >
                          <option value="">-- Select Section --</option>
                          {availableSections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION C: Parent Association (Student only) */}
              {activeTab === 'student' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                    <Users size={14} className="text-greenAccent" />
                    Parent / Guardian Association
                  </h4>

                  {editingId ? (
                    <div className="space-y-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent's Full Name</label>
                          <input required type="text" name="parentName" value={formData.parentName || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Parent Full Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relationship</label>
                          <select name="parentRelationship" value={formData.parentRelationship || 'Father'} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white">
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Guardian">Guardian</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Email</label>
                          <input required type="email" name="parentEmail" value={formData.parentEmail || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="parent@example.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Phone Number</label>
                          <input required type="tel" name="parentPhone" value={formData.parentPhone || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Parent Phone" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Login Password</label>
                          <PasswordInput required name="parentPassword" value={formData.parentPassword || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Photo (Optional)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'parentPhoto')} className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-darkBlue hover:file:bg-blue-100 cursor-pointer" />
                          {formData.parentPhoto && <div className="mt-2 w-12 h-12 rounded border overflow-hidden"><img src={formData.parentPhoto} alt="Parent Preview" className="w-full h-full object-cover" /></div>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                          <input type="radio" name="parentMode" value="new" checked={formData.parentMode === 'new'} onChange={handleInputChange} />
                          Create New Parent Profile
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                          <input type="radio" name="parentMode" value="existing" checked={formData.parentMode === 'existing'} onChange={handleInputChange} />
                          Link Existing Parent Profile
                        </label>
                      </div>

                      {formData.parentMode === 'existing' ? (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Parent</label>
                          <select
                            required
                            name="selectedParentId"
                            value={formData.selectedParentId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                          >
                            <option value="">-- Select Parent Profile --</option>
                            {parentsList.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent's Full Name</label>
                              <input required={formData.parentMode === 'new'} type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Parent Full Name" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relationship</label>
                              <select name="parentRelationship" value={formData.parentRelationship} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white">
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Email</label>
                              <input required={formData.parentMode === 'new'} type="email" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="parent@example.com" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Phone Number</label>
                              <input required={formData.parentMode === 'new'} type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" placeholder="Parent Phone" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Login Password</label>
                              <PasswordInput required={formData.parentMode === 'new'} name="parentPassword" value={formData.parentPassword} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Photo (Optional)</label>
                              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'parentPhoto')} className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-darkBlue hover:file:bg-blue-100 cursor-pointer" />
                              {formData.parentPhoto && <div className="mt-2 w-12 h-12 rounded border overflow-hidden"><img src={formData.parentPhoto} alt="Parent Preview" className="w-full h-full object-cover" /></div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Transfer / Change Class Placement</h3>
              <button onClick={() => { setIsTransferModalOpen(false); setTransferStudentId(null); }} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Select the new class placement. The student's academic marks history, timetables, and fees remain locked under the respective original class listings.</p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Class placement</label>
                <select
                  required
                  value={transferClassId}
                  onChange={(e) => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white"
                >
                  <option value="">-- Select Class placement --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={() => { setIsTransferModalOpen(false); setTransferStudentId(null); }} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 text-xs font-bold transition-all">Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">Reset Password</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Assign a new login credential password to this profile.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input required minLength={8} type="text" value={newTempPassword} onChange={(e) => setNewTempPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" placeholder="Minimum 8 characters" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Confirm Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-4 border-t-4 border-red-600">
            <h3 className="text-xl font-bold text-red-600">WARNING!</h3>
            <p className="text-sm text-gray-700 text-left">This action will permanently delete: Student Profile, Attendance Records, Marks, Fees, and Timetable references.</p>
            <p className="text-sm text-gray-700">Type <span className="font-bold text-red-600">DELETE</span> to continue.</p>
            <input 
              type="text" 
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-red-300 rounded text-center outline-none focus:ring-red-500 focus:border-red-500 font-bold disabled:opacity-50"
            />
            <div className="flex justify-center space-x-3 pt-4">
              <button 
                onClick={cancelHardDelete} 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmHardDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50" 
                disabled={deleteInput !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
