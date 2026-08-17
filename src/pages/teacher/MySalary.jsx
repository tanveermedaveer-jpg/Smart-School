import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calendar, CreditCard, CheckCircle, Clock, 
  AlertCircle, TrendingUp, Filter, Eye, ChevronDown, ChevronUp 
} from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';

const MySalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [defaultSalary, setDefaultSalary] = useState(0);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const teacherId = authUser.teacherId || authUser.id;
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    const loadSalaryData = async () => {
      if (!teacherId || !schoolId) return;

      let savedSalaries = [];
      let savedUsers = [];

      try {
        const { getCollection } = await import('../../utils/db');
        const [remoteSalaries, remoteUsers] = await Promise.all([
          getCollection('schoolAdminTeacherSalaries', schoolId),
          getCollection('schoolAdminUsers', schoolId)
        ]);

        if (remoteSalaries && Array.isArray(remoteSalaries) && remoteSalaries.length > 0) {
          savedSalaries = remoteSalaries;
          localStorage.setItem('schoolAdminTeacherSalaries', JSON.stringify(remoteSalaries));
        } else {
          savedSalaries = JSON.parse(localStorage.getItem('schoolAdminTeacherSalaries') || '[]');
        }

        if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          savedUsers = remoteUsers;
          localStorage.setItem('schoolAdminUsers', JSON.stringify(remoteUsers));
        } else {
          savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
        }
      } catch (e) {
        savedSalaries = JSON.parse(localStorage.getItem('schoolAdminTeacherSalaries') || '[]');
        savedUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      }

      // Find logged-in teacher profile to extract default monthly salary
      const teacherProfile = savedUsers.find(u => 
        u.id?.toString() === teacherId.toString() && 
        (!u.schoolId || u.schoolId.toString() === schoolId.toString())
      );
      const defSalary = teacherProfile ? (parseFloat(teacherProfile.monthlySalary || teacherProfile.salary) || 0) : 0;
      setDefaultSalary(defSalary);

      // Filter salaries strictly by schoolId AND teacherId (never by teacherName or email)
      const mySalaries = savedSalaries.filter(s => 
        s.teacherId?.toString() === teacherId.toString() &&
        (!s.schoolId || s.schoolId.toString() === schoolId.toString())
      );

      // Check if current month entry exists; if not and defSalary > 0, include synthesized current month record
      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'long' });
      const currentYear = now.getFullYear();

      const hasCurrentMonth = mySalaries.some(s => 
        s.month === currentMonth && parseInt(s.year) === currentYear
      );

      if (!hasCurrentMonth && defSalary > 0) {
        mySalaries.push({
          id: `sal-current-${teacherId}-${currentMonth}-${currentYear}`,
          teacherId: teacherId,
          schoolId: schoolId,
          month: currentMonth,
          year: currentYear,
          monthlySalary: defSalary,
          paidAmount: 0,
          remainingAmount: defSalary,
          status: 'Pending',
          paymentDate: '—',
          paymentMethod: '—',
          paymentHistory: []
        });
      }

      // Sort by newest year & month
      mySalaries.sort((a, b) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
        return months.indexOf(b.month) - months.indexOf(a.month);
      });

      setSalaries(mySalaries);
    };

    loadSalaryData();
  }, [teacherId, schoolId]);

  const yearsList = [...new Set(salaries.map(s => s.year).filter(Boolean))];

  const filteredSalaries = salaries.filter(s => {
    const matchesYear = filterYear === 'All' || s.year?.toString() === filterYear.toString();
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesYear && matchesStatus;
  });

  // Calculate summary stats
  const totalExpected = filteredSalaries.reduce((acc, curr) => acc + (parseFloat(curr.monthlySalary) || 0), 0);
  const totalPaid = filteredSalaries.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
  const totalRemaining = filteredSalaries.reduce((acc, curr) => acc + (parseFloat(curr.remainingAmount) || 0), 0);

  const toggleExpand = (id) => {
    setExpandedRecordId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 font-poppins text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Salary Ledger</h2>
          <p className="text-gray-500 text-sm mt-1">
            View your official monthly salary disbursements, paid amounts, and payment history.
          </p>
        </div>
        {salaries.length > 0 && (
          <ExportButtons tableId="export-table" filename={`My_Salary_Ledger_${authUser.name || 'Teacher'}`} />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Default Monthly Base</div>
            <div className="text-xl font-black text-gray-800">
              Rs. {defaultSalary > 0 ? defaultSalary.toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Expected</div>
            <div className="text-xl font-black text-gray-800">
              Rs. {totalExpected.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Paid</div>
            <div className="text-xl font-black text-green-700">
              Rs. {totalPaid.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Outstanding Balance</div>
            <div className="text-xl font-black text-red-600">
              Rs. {totalRemaining.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-600">Filters:</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {yearsList.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl outline-none bg-white text-xs font-semibold"
            >
              <option value="All">All Years</option>
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl outline-none bg-white text-xs font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partially Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredSalaries.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CreditCard className="w-12 h-12 text-gray-300 mb-3 animate-pulse" />
            <p className="font-semibold text-slate-700 text-base">No Salary Records Found</p>
            <p className="text-slate-400 text-xs mt-1">
              No salary disbursements have been recorded for your account yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Salary Month</th>
                  <th className="p-4 font-bold">Expected Salary</th>
                  <th className="p-4 font-bold">Paid Amount</th>
                  <th className="p-4 font-bold">Remaining Balance</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Payment Date</th>
                  <th className="p-4 font-bold text-center">Payment History</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {filteredSalaries.map((sal) => {
                  const isExpanded = expandedRecordId === sal.id;
                  const history = sal.paymentHistory || [];

                  return (
                    <React.Fragment key={sal.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-darkBlue">
                          {sal.month} {sal.year}
                        </td>
                        <td className="p-4 font-semibold text-gray-800">
                          Rs. {(parseFloat(sal.monthlySalary) || 0).toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold text-green-700">
                          Rs. {(parseFloat(sal.paidAmount) || 0).toLocaleString()}
                        </td>
                        <td className={`p-4 font-bold ${(parseFloat(sal.remainingAmount) || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          Rs. {(parseFloat(sal.remainingAmount) || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center ${
                              sal.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sal.status === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {sal.status === 'Paid' ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : sal.status === 'Partial' ? (
                              <Clock size={12} className="mr-1" />
                            ) : (
                              <AlertCircle size={12} className="mr-1" />
                            )}
                            {sal.status === 'Partial' ? 'Partially Paid' : sal.status}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-600 font-mono">
                          {sal.paymentDate || '—'}
                        </td>
                        <td className="p-4 text-center">
                          {history.length > 0 ? (
                            <button
                              onClick={() => toggleExpand(sal.id)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{history.length} Installment{history.length > 1 ? 's' : ''}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">No payments yet</span>
                          )}
                        </td>
                      </tr>

                      {/* Payment History Expandable Row */}
                      {isExpanded && history.length > 0 && (
                        <tr className="bg-slate-50/70 border-b border-gray-100">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner space-y-2 max-w-2xl mx-auto">
                              <h4 className="font-bold text-xs text-darkBlue border-b border-gray-100 pb-2 flex items-center gap-2">
                                <CreditCard size={14} />
                                <span>Payment Installment Breakdown ({sal.month} {sal.year})</span>
                              </h4>
                              <div className="divide-y divide-gray-100 text-xs">
                                {history.map((ph, idx) => (
                                  <div key={idx} className="py-2 flex justify-between items-center">
                                    <div>
                                      <span className="font-semibold text-gray-800">
                                        Rs. {(parseFloat(ph.paidAmount) || 0).toLocaleString()}
                                      </span>
                                      <span className="text-gray-400 ml-2 font-mono text-[11px]">
                                        ({ph.paymentMethod || 'Bank Transfer'})
                                      </span>
                                      {ph.paymentNote && (
                                        <p className="text-[10px] text-gray-500 italic mt-0.5">{ph.paymentNote}</p>
                                      )}
                                    </div>
                                    <span className="text-gray-500 font-mono text-[11px]">
                                      {ph.paymentDate || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MySalary;
