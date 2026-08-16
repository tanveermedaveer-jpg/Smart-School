import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { 
  DollarSign, Search, Calendar, FileText, TrendingUp, 
  AlertTriangle, ShieldCheck, Printer, X, Eye, Edit2, 
  User, Plus, CreditCard, Award, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherSalaries = () => {
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);

  // Active Tab: 'teachers' | 'history' | 'dashboard'
  const [activeTab, setActiveTab] = useState('teachers');

  // Month & Year Selector
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentYearNum = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals / Details states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTeacherForPayment, setSelectedTeacherForPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState(null);
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [selectedTeacherForSalaryEdit, setSelectedTeacherForSalaryEdit] = useState(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [customMonthlySalary, setCustomMonthlySalary] = useState('');

  // Default Salary Edit State
  const [newDefaultSalary, setNewDefaultSalary] = useState('');

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 1. Load users and filter for teachers belonging ONLY to the school
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const activeTeachers = users.filter(u => 
      u.role?.toLowerCase() === 'teacher' && 
      (u.schoolId?.toString() === schoolId.toString())
    );
    setTeachers(activeTeachers);

    const activeStudents = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.schoolId?.toString() === schoolId.toString())
    );
    setStudents(activeStudents);

    // 2. Load salary records
    const savedSalaries = JSON.parse(localStorage.getItem('schoolAdminTeacherSalaries') || '[]');
    // Filter for current school
    const schoolSalaries = savedSalaries.filter(s => s.schoolId?.toString() === schoolId.toString());
    setSalaries(schoolSalaries);

    // 3. Load classes
    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses.filter(c => c.schoolId?.toString() === schoolId.toString()));

    // 4. Load subjects
    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects.filter(s => s.schoolId?.toString() === schoolId.toString()));

    // 5. Load assignments
    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    setAssignments(savedAssignments.filter(a => a.schoolId?.toString() === schoolId.toString()));

    // 6. Load student attendance (to compute teacher attendance summaries)
    const savedAttendance = JSON.parse(localStorage.getItem('schoolAdminAttendance') || '[]');
    setAttendanceRecords(savedAttendance.filter(att => att.schoolId?.toString() === schoolId.toString()));
  };

  // Helper to get class name
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : `Class ${classId}`;
  };

  // Helper to get subject name
  const getSubjectName = (subjectId) => {
    const sub = subjects.find(s => s.id.toString() === subjectId?.toString());
    return sub ? sub.subjectName : `Subject ${subjectId}`;
  };

  // Helper to get assignments for a teacher
  const getTeacherAssignmentsList = (teacherId) => {
    return assignments.filter(a => a.teacherId?.toString() === teacherId?.toString());
  };

  // Get active salary record for a teacher + month + year
  const getSalaryRecord = (teacherId, month, year) => {
    return salaries.find(s => 
      s.teacherId?.toString() === teacherId?.toString() &&
      s.month === month &&
      s.year === parseInt(year)
    );
  };

  // Compute calculated values for list
  const getTeacherSalaryInfo = (teacher, month, year) => {
    const defaultSalary = parseFloat(teacher.monthlySalary || teacher.salary) || 0;
    const record = getSalaryRecord(teacher.id, month, year);

    if (record) {
      return {
        monthlySalary: record.monthlySalary,
        paidAmount: record.paidAmount || 0,
        remainingAmount: record.remainingAmount ?? (record.monthlySalary - (record.paidAmount || 0)),
        status: record.status || 'Pending'
      };
    }

    return {
      monthlySalary: defaultSalary,
      paidAmount: 0,
      remainingAmount: defaultSalary,
      status: 'Pending'
    };
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id?.toString().includes(searchQuery) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const info = getTeacherSalaryInfo(t, selectedMonth, selectedYear);
    const matchesStatus = filterStatus === 'All' || info.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate Dashboard Stats for selected Month/Year
  const getDashboardStats = () => {
    let totalMonthlySalaries = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    teachers.forEach(t => {
      const info = getTeacherSalaryInfo(t, selectedMonth, selectedYear);
      totalMonthlySalaries += info.monthlySalary;
      totalPaid += info.paidAmount;
      totalRemaining += info.remainingAmount;

      if (info.status === 'Paid') paidCount++;
      else if (info.status === 'Partial') partialCount++;
      else pendingCount++;
    });

    return {
      totalTeachers: teachers.length,
      totalMonthlySalaries,
      totalPaid,
      totalRemaining,
      pendingCount,
      partialCount,
      paidCount
    };
  };

  const stats = getDashboardStats();

  // Action: Open pay modal
  const handleOpenPayModal = (teacher) => {
    const info = getTeacherSalaryInfo(teacher, selectedMonth, selectedYear);
    setSelectedTeacherForPayment(teacher);
    setCustomMonthlySalary(info.monthlySalary || '');
    setPaymentAmount(info.remainingAmount || '');
    setPaymentMethod('Bank Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  // Action: Save payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForPayment) return;

    const salaryVal = parseFloat(customMonthlySalary) || 0;
    const payAmount = parseFloat(paymentAmount) || 0;
    
    if (salaryVal <= 0) {
      toast.error('Monthly salary must be greater than zero.');
      return;
    }

    const info = getTeacherSalaryInfo(selectedTeacherForPayment, selectedMonth, selectedYear);
    // Max allowable pay is remaining balance
    if (payAmount <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    if (payAmount > info.remainingAmount) {
      toast.error(`Payment amount (Rs. ${payAmount.toLocaleString()}) cannot exceed the remaining salary (Rs. ${info.remainingAmount.toLocaleString()}).`);
      return;
    }

    try {
      const savedSalaries = JSON.parse(localStorage.getItem('schoolAdminTeacherSalaries') || '[]');
      const existingIndex = savedSalaries.findIndex(s => 
        s.teacherId?.toString() === selectedTeacherForPayment.id?.toString() &&
        s.month === selectedMonth &&
        s.year === parseInt(selectedYear)
      );

      const paymentObj = {
        paymentDate,
        paidAmount: payAmount,
        paymentMethod,
        paymentNote
      };

      let updatedSalaries = [...savedSalaries];

      if (existingIndex > -1) {
        const existing = savedSalaries[existingIndex];
        const newPaidAmount = (existing.paidAmount || 0) + payAmount;
        const newRemainingAmount = salaryVal - newPaidAmount;

        let newStatus = 'Pending';
        if (newPaidAmount >= salaryVal) {
          newStatus = 'Paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'Partial';
        }

        updatedSalaries[existingIndex] = {
          ...existing,
          monthlySalary: salaryVal,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paymentDate,
          paymentMethod,
          paymentNote,
          paymentHistory: [...(existing.paymentHistory || []), paymentObj]
        };
      } else {
        const newPaidAmount = payAmount;
        const newRemainingAmount = salaryVal - newPaidAmount;

        let newStatus = 'Pending';
        if (newPaidAmount >= salaryVal) {
          newStatus = 'Paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'Partial';
        }

        const newRecord = {
          id: `sal-${selectedTeacherForPayment.id}-${selectedMonth}-${selectedYear}-${Date.now()}`,
          teacherId: selectedTeacherForPayment.id,
          teacherName: selectedTeacherForPayment.name,
          schoolId: schoolId,
          month: selectedMonth,
          year: parseInt(selectedYear),
          monthlySalary: salaryVal,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paymentDate,
          paymentMethod,
          paymentNote,
          paymentHistory: [paymentObj]
        };

        updatedSalaries.push(newRecord);
      }

      // If the salary changed, update the teacher profile default salary in schoolAdminUsers
      const savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const userIndex = savedUsers.findIndex(u => u.id?.toString() === selectedTeacherForPayment.id?.toString());
      if (userIndex > -1) {
        savedUsers[userIndex].monthlySalary = salaryVal;
        localStorage.setItem('schoolAdminUsers', JSON.stringify(savedUsers));
        const { saveSchoolUsers } = await import('../../utils/db');
        await saveSchoolUsers(schoolId, savedUsers);
      }

      localStorage.setItem('schoolAdminTeacherSalaries', JSON.stringify(updatedSalaries));
      const { saveCollection } = await import('../../utils/db');
      await saveCollection('schoolAdminTeacherSalaries', schoolId, updatedSalaries);

      toast.success(`Payment of Rs. ${payAmount.toLocaleString()} recorded!`);
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save payment.');
    }
  };

  // Action: Open default salary modal
  const handleOpenSalaryEditModal = (teacher) => {
    setSelectedTeacherForSalaryEdit(teacher);
    setNewDefaultSalary(teacher.monthlySalary || teacher.salary || '');
    setShowEditSalaryModal(true);
  };

  // Action: Save default salary
  const handleSaveDefaultSalary = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForSalaryEdit) return;

    const newSalary = parseFloat(newDefaultSalary) || 0;
    if (newSalary <= 0) {
      toast.error('Please enter a valid salary amount.');
      return;
    }

    try {
      const savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const userIndex = savedUsers.findIndex(u => u.id?.toString() === selectedTeacherForSalaryEdit.id?.toString());
      
      if (userIndex > -1) {
        savedUsers[userIndex].monthlySalary = newSalary;
        localStorage.setItem('schoolAdminUsers', JSON.stringify(savedUsers));
        const { saveSchoolUsers } = await import('../../utils/db');
        await saveSchoolUsers(schoolId, savedUsers);
        
        toast.success(`Default monthly salary updated for ${selectedTeacherForSalaryEdit.name}.`);
        setShowEditSalaryModal(false);
        loadData();
      } else {
        toast.error('Teacher record not found.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save updated salary.');
    }
  };

  // Action: View teacher details
  const handleOpenDetails = (teacher) => {
    const tAssignments = getTeacherAssignmentsList(teacher.id);
    const assignedClassIds = tAssignments.map(a => a.classId?.toString());
    
    // Students count
    const teacherStudents = students.filter(s => assignedClassIds.includes(s.classId?.toString()));
    
    // Attendance sessions
    const teacherAttendanceSessions = attendanceRecords.filter(att => 
      assignedClassIds.includes(att.classId?.toString())
    );

    const info = getTeacherSalaryInfo(teacher, selectedMonth, selectedYear);

    // Complete salary history for this teacher
    const teacherSalariesList = salaries.filter(s => s.teacherId?.toString() === teacher.id?.toString());

    // Gather all historical payments
    let allPayments = [];
    teacherSalariesList.forEach(s => {
      if (s.paymentHistory) {
        s.paymentHistory.forEach(ph => {
          allPayments.push({
            ...ph,
            month: s.month,
            year: s.year
          });
        });
      }
    });

    setSelectedTeacherDetails({
      teacher,
      info,
      assignments: tAssignments,
      totalStudents: teacherStudents.length,
      attendanceSessionsCount: teacherAttendanceSessions.length,
      salariesHistory: teacherSalariesList,
      paymentsHistory: allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    });
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 font-poppins text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-darkBlue">Teacher Salary Management</h1>
          <p className="text-gray-500 text-xs mt-1">Manage, disburse, and audit salaries for your school's teaching staff.</p>
        </div>
        
        {/* Month & Year Filter */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-150 shadow-sm">
          <Calendar size={16} className="text-darkBlue" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-semibold outline-none bg-transparent cursor-pointer text-gray-700"
          >
            {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-semibold outline-none bg-transparent cursor-pointer text-gray-700"
          >
            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 gap-6">
        {[
          { id: 'teachers', label: 'Teacher Salaries' },
          { id: 'dashboard', label: 'Dashboard Summary' },
          { id: 'history', label: 'Monthly History Ledger' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-all duration-200 ${activeTab === tab.id ? 'text-darkBlue font-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-greenAccent rounded-full animate-fade-in"></span>
            )}
          </button>
        ))}
      </div>

      {/* --- TAB 1: TEACHER LIST --- */}
      {activeTab === 'teachers' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search teacher by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-darkBlue transition-all shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white outline-none font-semibold text-gray-700 shadow-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partial">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredTeachers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                No teacher salary records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider border-b border-gray-100">
                      <th className="p-4">Teacher</th>
                      <th className="p-4">Assigned Workload</th>
                      <th className="p-4">Default Salary</th>
                      <th className="p-4">Paid So Far</th>
                      <th className="p-4">Remaining Balance</th>
                      <th className="p-4">Salary Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {filteredTeachers.map(t => {
                      const info = getTeacherSalaryInfo(t, selectedMonth, selectedYear);
                      const tAssignments = getTeacherAssignmentsList(t.id);
                      
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-darkBlue font-black border border-gray-100 uppercase">
                                {t.name ? t.name[0] : 'T'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{t.name}</div>
                                <div className="text-[10px] text-gray-400">ID: {t.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {tAssignments.length === 0 ? (
                              <span className="text-gray-400 italic">No assignments</span>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-gray-700">
                                  {Array.from(new Set(tAssignments.map(a => getClassName(a.classId)))).join(', ')}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {Array.from(new Set(tAssignments.map(a => getSubjectName(a.subjectId)))).join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-800">Rs. {info.monthlySalary.toLocaleString()}</span>
                              <button 
                                onClick={() => handleOpenSalaryEditModal(t)}
                                className="text-gray-400 hover:text-darkBlue"
                                title="Edit default salary"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-green-700 font-semibold">
                            Rs. {info.paidAmount.toLocaleString()}
                          </td>
                          <td className={`p-4 font-bold ${info.remainingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            Rs. {info.remainingAmount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              info.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : info.status === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {info.status === 'Partial' ? 'Partially Paid' : info.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleOpenPayModal(t)}
                                disabled={info.status === 'Paid'}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] tracking-wide transition-all shadow-sm flex items-center gap-1 ${
                                  info.status === 'Paid'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-darkBlue text-white hover:bg-darkBlue/90'
                                }`}
                              >
                                <DollarSign size={12} />
                                Pay Salary
                              </button>
                              <button
                                onClick={() => handleOpenDetails(t)}
                                className="p-1.5 text-gray-500 hover:text-darkBlue hover:bg-slate-100 rounded-lg transition-all"
                                title="View Details & Ledger"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
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

      {/* --- TAB 2: DASHBOARD SUMMARY --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <User size={22} />
              </div>
              <div>
                <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Teachers</div>
                <div className="text-2xl font-black text-gray-800">{stats.totalTeachers}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <DollarSign size={22} />
              </div>
              <div>
                <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Expected Salaries</div>
                <div className="text-2xl font-black text-gray-800">Rs. {stats.totalMonthlySalaries.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Paid</div>
                <div className="text-2xl font-black text-green-700">Rs. {stats.totalPaid.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Outstanding</div>
                <div className="text-2xl font-black text-red-600">Rs. {stats.totalRemaining.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Disbursement Status Breakdown ({selectedMonth} {selectedYear})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Fully Paid Card */}
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">Fully Paid</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Paid</span>
                </div>
                <div className="text-3xl font-black text-emerald-700">{stats.paidCount}</div>
                <div className="text-[10px] text-emerald-600 font-medium">Teachers have received their full salaries.</div>
              </div>

              {/* Partially Paid Card */}
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-800">Partially Paid</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">Partial</span>
                </div>
                <div className="text-3xl font-black text-amber-700">{stats.partialCount}</div>
                <div className="text-[10px] text-amber-600 font-medium">Teachers have received partial payments.</div>
              </div>

              {/* Pending Card */}
              <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-800">Pending</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">Unpaid</span>
                </div>
                <div className="text-3xl font-black text-red-700">{stats.pendingCount}</div>
                <div className="text-[10px] text-red-600 font-medium">Teachers have received zero payment so far.</div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: MONTHLY HISTORY --- */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-4 gap-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Monthly Salaries Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Showing all processed monthly records for {selectedMonth} {selectedYear}.</p>
            </div>
            <ExportButtons tableId="salaries-ledger-table" filename={`Salaries_Ledger_${selectedMonth}_${selectedYear}`} />
          </div>

          <div className="overflow-x-auto">
            <table id="salaries-ledger-table" className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <th className="p-3">Teacher ID</th>
                  <th className="p-3">Teacher Name</th>
                  <th className="p-3">Salary Month</th>
                  <th className="p-3">Expected Salary</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Remaining Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latest Method</th>
                  <th className="p-3">Last Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {teachers.map(t => {
                  const info = getTeacherSalaryInfo(t, selectedMonth, selectedYear);
                  const record = getSalaryRecord(t.id, selectedMonth, selectedYear);

                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-darkBlue font-semibold">{t.id}</td>
                      <td className="p-3 font-semibold text-gray-800">{t.name}</td>
                      <td className="p-3 text-gray-500">{selectedMonth} {selectedYear}</td>
                      <td className="p-3 font-bold text-gray-800">Rs. {info.monthlySalary.toLocaleString()}</td>
                      <td className="p-3 text-green-700">Rs. {info.paidAmount.toLocaleString()}</td>
                      <td className={`p-3 font-bold ${info.remainingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        Rs. {info.remainingAmount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          info.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                            : info.status === 'Partial'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : 'bg-red-50 text-red-800 border border-red-100'
                        }`}>
                          {info.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{record?.paymentMethod || '—'}</td>
                      <td className="p-3 text-gray-400">{record?.paymentDate || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* --- MODAL: PAY SALARY --- */}
      {showPaymentModal && selectedTeacherForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-scale-up">
            <div className="bg-darkBlue text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm">Disburse Salary</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{selectedTeacherForPayment.name} - {selectedMonth} {selectedYear}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              
              {/* Custom Salary Field (Can override default) */}
              <div>
                <label className="block text-gray-500 font-bold mb-1">Monthly Salary Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={customMonthlySalary}
                  onChange={(e) => setCustomMonthlySalary(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white text-xs font-semibold"
                />
              </div>

              {/* Details Alert */}
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-1.5 font-semibold text-[11px] text-gray-600">
                <div className="flex justify-between">
                  <span>Current Month Total Salary:</span>
                  <span className="text-gray-800 font-bold">Rs. {(parseFloat(customMonthlySalary) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid So Far:</span>
                  <span className="text-green-700 font-bold">Rs. {getTeacherSalaryInfo(selectedTeacherForPayment, selectedMonth, selectedYear).paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-1.5 text-xs font-black">
                  <span>Remaining Balance:</span>
                  <span className="text-red-600 font-bold">Rs. {((parseFloat(customMonthlySalary) || 0) - getTeacherSalaryInfo(selectedTeacherForPayment, selectedMonth, selectedYear).paidAmount).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-gray-500 font-bold mb-1">Amount to Pay Now (Rs.)</label>
                <input
                  type="number"
                  required
                  max={Math.max(0, (parseFloat(customMonthlySalary) || 0) - getTeacherSalaryInfo(selectedTeacherForPayment, selectedMonth, selectedYear).paidAmount)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-darkBlue text-xs font-semibold"
                />
              </div>

              {/* Method & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white outline-none font-semibold text-gray-700"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Portal">Online Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 font-bold mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:border-darkBlue"
                  />
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-gray-500 font-bold mb-1">Payment Note (Optional)</label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="E.g. Bank Reference ID, Remarks..."
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-darkBlue resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-greenAccent text-white hover:bg-greenAccent/95 rounded-xl font-bold transition-all shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT DEFAULT SALARY --- */}
      {showEditSalaryModal && selectedTeacherForSalaryEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 animate-scale-up">
            <div className="bg-darkBlue text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm">Set Monthly Salary</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{selectedTeacherForSalaryEdit.name}</p>
              </div>
              <button 
                onClick={() => setShowEditSalaryModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDefaultSalary} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">Standard Monthly Salary (Rs.)</label>
                <input
                  type="number"
                  required
                  value={newDefaultSalary}
                  onChange={(e) => setNewDefaultSalary(e.target.value)}
                  placeholder="E.g. 45000"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-darkBlue text-xs font-semibold"
                />
                <p className="text-[10px] text-gray-400 mt-1">This amount will be used as the default value when generating monthly salary records.</p>
              </div>

              <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditSalaryModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-darkBlue text-white hover:bg-darkBlue/95 rounded-xl font-bold transition-all shadow-sm"
                >
                  Save Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TEACHER DETAILS & LEDGER --- */}
      {showDetailsModal && selectedTeacherDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-scale-up">
            
            <div className="bg-darkBlue text-white p-6 flex justify-between items-start sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl font-black uppercase text-white border border-white/15">
                  {selectedTeacherDetails.teacher.name ? selectedTeacherDetails.teacher.name[0] : 'T'}
                </div>
                <div>
                  <h2 className="text-lg font-black">{selectedTeacherDetails.teacher.name}</h2>
                  <p className="text-xs text-slate-300">Teacher ID: {selectedTeacherDetails.teacher.id} | Email: {selectedTeacherDetails.teacher.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-gray-700">

              {/* Grid 1: Profile & Workload Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Profile Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><User size={14} className="text-darkBlue" /> Profile Details</h4>
                  <div className="space-y-1">
                    <div><span className="text-gray-400 font-semibold">Phone:</span> <span className="font-medium">{selectedTeacherDetails.teacher.phone || 'N/A'}</span></div>
                    <div><span className="text-gray-400 font-semibold">Address:</span> <span className="font-medium">{selectedTeacherDetails.teacher.address || 'N/A'}</span></div>
                    <div><span className="text-gray-400 font-semibold">Status:</span> <span className="font-bold text-emerald-600">{selectedTeacherDetails.teacher.status || 'Active'}</span></div>
                  </div>
                </div>

                {/* Assigned Workload */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><CreditCard size={14} className="text-darkBlue" /> Workload</h4>
                  <div className="space-y-1">
                    <div><span className="text-gray-400 font-semibold">Classes:</span> <span className="font-medium">{selectedTeacherDetails.assignments.length > 0 ? Array.from(new Set(selectedTeacherDetails.assignments.map(a => getClassName(a.classId)))).join(', ') : 'None'}</span></div>
                    <div><span className="text-gray-400 font-semibold">Subjects:</span> <span className="font-medium">{selectedTeacherDetails.assignments.length > 0 ? Array.from(new Set(selectedTeacherDetails.assignments.map(a => getSubjectName(a.subjectId)))).join(', ') : 'None'}</span></div>
                    <div><span className="text-gray-400 font-semibold">Total Students:</span> <span className="font-bold text-darkBlue">{selectedTeacherDetails.totalStudents}</span></div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Award size={14} className="text-darkBlue" /> Attendance Summary</h4>
                  <div className="space-y-1">
                    <div><span className="text-gray-400 font-semibold">Total Sessions Recorded:</span> <span className="font-bold text-darkBlue">{selectedTeacherDetails.attendanceSessionsCount}</span></div>
                    <p className="text-[10px] text-gray-400">Total attendance check-ins saved for their assigned classes.</p>
                  </div>
                </div>

              </div>

              {/* Grid 2: Active Month Salary Status */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-black text-gray-800 text-xs uppercase tracking-wider">Salary Status for {selectedMonth} {selectedYear}</h4>
                  <p className="text-[10px] text-gray-400">Current status based on latest disbursed amounts.</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Expected</div>
                    <div className="font-black text-gray-800">Rs. {selectedTeacherDetails.info.monthlySalary.toLocaleString()}</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Paid</div>
                    <div className="font-black text-green-700">Rs. {selectedTeacherDetails.info.paidAmount.toLocaleString()}</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Remaining</div>
                    <div className="font-black text-red-600">Rs. {selectedTeacherDetails.info.remainingAmount.toLocaleString()}</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 flex items-center justify-center">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                      selectedTeacherDetails.info.status === 'Paid' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                        : selectedTeacherDetails.info.status === 'Partial'
                        ? 'bg-amber-50 text-amber-800 border border-amber-100'
                        : 'bg-red-50 text-red-800 border border-red-100'
                    }`}>
                      {selectedTeacherDetails.info.status === 'Partial' ? 'Partially Paid' : selectedTeacherDetails.info.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary History Ledger Table */}
              <div className="space-y-2.5">
                <h3 className="font-black text-darkBlue text-xs uppercase tracking-wider">Salary History by Month</h3>
                <div className="bg-white rounded-xl border border-gray-150 overflow-hidden">
                  {selectedTeacherDetails.salariesHistory.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 italic">No monthly salary ledger records generated yet.</div>
                  ) : (
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-2.5">Month & Year</th>
                          <th className="p-2.5">Monthly Salary</th>
                          <th className="p-2.5">Paid So Far</th>
                          <th className="p-2.5">Remaining Balance</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Last Payment Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium">
                        {selectedTeacherDetails.salariesHistory.map(h => (
                          <tr key={h.id}>
                            <td className="p-2.5 text-gray-800 font-semibold">{h.month} {h.year}</td>
                            <td className="p-2.5 text-gray-700">Rs. {h.monthlySalary.toLocaleString()}</td>
                            <td className="p-2.5 text-green-700">Rs. {h.paidAmount.toLocaleString()}</td>
                            <td className={`p-2.5 font-bold ${h.remainingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              Rs. {h.remainingAmount.toLocaleString()}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                h.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : h.status === 'Partial'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-red-50 text-red-800'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-400">{h.paymentMethod || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Payment History Receipts list */}
              <div className="space-y-2.5">
                <h3 className="font-black text-darkBlue text-xs uppercase tracking-wider">Disbursement Payment Receipts</h3>
                <div className="bg-white rounded-xl border border-gray-150 overflow-hidden">
                  {selectedTeacherDetails.paymentsHistory.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 italic">No disbursement history recorded yet.</div>
                  ) : (
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="p-2.5">Payment Date</th>
                          <th className="p-2.5">Salary Month</th>
                          <th className="p-2.5">Disbursed Amount</th>
                          <th className="p-2.5">Method</th>
                          <th className="p-2.5">Payment Note / Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium">
                        {selectedTeacherDetails.paymentsHistory.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 text-gray-800 font-semibold">{p.paymentDate}</td>
                            <td className="p-2.5 text-gray-500">{p.month} {p.year}</td>
                            <td className="p-2.5 text-green-700 font-bold">Rs. {p.paidAmount.toLocaleString()}</td>
                            <td className="p-2.5 text-gray-600">{p.paymentMethod}</td>
                            <td className="p-2.5 text-gray-400 italic max-w-xs truncate" title={p.paymentNote}>
                              {p.paymentNote || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherSalaries;
