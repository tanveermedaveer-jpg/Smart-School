import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { DollarSign, Search, Calendar, FileText, TrendingUp, AlertTriangle, ShieldCheck, Printer, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Tab State: 'records' | 'pending' | 'reports'
  const [activeTab, setActiveTab] = useState('records');

  // Filters for Payment History (Records)
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [recordsFilterClass, setRecordsFilterClass] = useState('All');
  const [recordsFilterMethod, setRecordsFilterMethod] = useState('All');

  // Filters for Pending Fees
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [pendingFilterClass, setPendingFilterClass] = useState('All');

  // Report Specific States
  const [reportType, setReportType] = useState('daily'); // daily | monthly | classwise | student
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Selected receipt to view/print
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedFees = JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');
    setFees(savedFees);

    const savedReceipts = JSON.parse(localStorage.getItem('schoolAdminReceipts') || '[]');
    setReceipts(savedReceipts.reverse()); // Show newest transactions first

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    setStudents(users.filter(u => u.role?.toLowerCase() === 'student'));
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  // --- TAB 1: Payment History Filtering ---
  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = 
      r.studentName?.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      r.rollNumber?.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      r.receiptNumber?.toLowerCase().includes(recordsSearchQuery.toLowerCase());
    
    const matchesClass = recordsFilterClass === 'All' || r.classId?.toString() === recordsFilterClass.toString();
    const matchesMethod = recordsFilterMethod === 'All' || r.paymentMethod === recordsFilterMethod;

    return matchesSearch && matchesClass && matchesMethod;
  });

  // --- TAB 2: Pending Fees Calculations ---
  // A student has pending fees if there are records in `schoolAdminMonthlyFees` with status !== 'Paid'
  const pendingFees = fees.filter(f => f.status !== 'Paid');
  
  const filteredPending = pendingFees.filter(f => {
    const matchesSearch = 
      f.studentName?.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
      f.rollNumber?.toLowerCase().includes(pendingSearchQuery.toLowerCase());
    const matchesClass = pendingFilterClass === 'All' || f.classId?.toString() === pendingFilterClass.toString();
    
    return matchesSearch && matchesClass;
  });

  // --- TAB 3: Reports Summary Calculations ---
  // 1. Daily Collection
  const dailyReceipts = receipts.filter(r => r.paymentDate?.startsWith(reportDate));
  const dailyTotalCollected = dailyReceipts.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);

  // 2. Monthly Collection
  const monthlyReceipts = receipts.filter(r => r.month === reportMonth);
  const monthlyTotalCollected = monthlyReceipts.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);

  // 3. Class-wise summaries
  const classwiseReports = classes.map(c => {
    const classMonthlyFees = fees.filter(f => f.classId?.toString() === c.id.toString());
    const collected = classMonthlyFees.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    const pendingVal = classMonthlyFees.reduce((acc, curr) => acc + (parseFloat(curr.remainingAmount) || 0), 0);
    
    return {
      className: `${c.className} - ${c.section}`,
      collected,
      pending: pendingVal
    };
  });

  // 4. Student Ledger History
  const filteredStudentsForSearch = students.filter(s => 
    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );
  
  const activeStudentReport = students.find(s => s.id.toString() === selectedStudentId.toString());
  const activeStudentLedger = fees.filter(f => f.studentId?.toString() === selectedStudentId.toString());

  // Overall Financial Counters
  const totalOutstandingAmount = fees.reduce((acc, curr) => acc + (parseFloat(curr.remainingAmount) || 0), 0);
  const totalReceivedAmount = receipts.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);

  const availableMonths = [...new Set(fees.map(f => f.month))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fees Control Deck</h2>
          <p className="text-gray-500 text-sm mt-1">Supervise collections audit trail, pending balance ledgers, and financial reports.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Grand Total Collected</span>
            <h3 className="text-xl font-black text-greenAccent mt-1">Rs. {totalReceivedAmount.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Outstanding Balances</span>
            <h3 className="text-xl font-black text-red-500 mt-1">Rs. {totalOutstandingAmount.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-500"><AlertTriangle size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Active Logged Receipts</span>
            <h3 className="text-xl font-black text-darkBlue mt-1">{receipts.length} Transactions</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={24} /></div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-3 text-center border-r border-gray-50 transition-all ${activeTab === 'records' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Payment Transactions ({receipts.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-center border-r border-gray-50 transition-all ${activeTab === 'pending' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pending Balances ({pendingFees.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 text-center transition-all ${activeTab === 'reports' ? 'bg-blue-50/50 text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Collections Reports
          </button>
        </div>
      </div>

      {/* TAB 1: PAYMENT TRANSACTIONS RECORDS */}
      {activeTab === 'records' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap md:flex-nowrap gap-3 items-center">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-2.5 text-gray-400"><Search size={16} /></span>
              <input 
                type="text" 
                placeholder="Search Receipt, Name, ID..." 
                value={recordsSearchQuery}
                onChange={(e) => setRecordsSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-gray-50/50"
              />
            </div>
            <select
              value={recordsFilterClass}
              onChange={(e) => setRecordsFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
              ))}
            </select>
            <select
              value={recordsFilterMethod}
              onChange={(e) => setRecordsFilterMethod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Easypaisa">Easypaisa</option>
              <option value="JazzCash">JazzCash</option>
            </select>
            <button
              onClick={() => { setRecordsSearchQuery(''); setRecordsFilterClass('All'); setRecordsFilterMethod('All'); }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold px-2 py-2"
            >
              Reset
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredReceipts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold">No payment history transaction logs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-4 font-bold">Receipt ID</th>
                      <th className="p-4 font-bold">Student</th>
                      <th className="p-4 font-bold">Class Section</th>
                      <th className="p-4 font-bold">Month / Year</th>
                      <th className="p-4 font-bold">Amount Paid</th>
                      <th className="p-4 font-bold">Method</th>
                      <th className="p-4 font-bold">Transaction Date</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {filteredReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-darkBlue">{r.receiptNumber}</td>
                        <td className="p-4 font-semibold text-gray-800">{r.studentName}</td>
                        <td className="p-4 font-medium text-gray-500">{getClassName(r.classId)}</td>
                        <td className="p-4 font-semibold text-gray-600">{r.month} {r.year}</td>
                        <td className="p-4 font-bold text-green-700">Rs. {r.paidAmount.toFixed(2)}</td>
                        <td className="p-4 font-semibold text-gray-600">{r.paymentMethod}</td>
                        <td className="p-4 text-gray-400 font-medium">{new Date(r.paymentDate).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setViewingReceipt(r)}
                            className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            Receipt
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

      {/* TAB 2: PENDING OUTSTANDING BALANCE SHEET */}
      {activeTab === 'pending' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap md:flex-nowrap gap-3 items-center">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-2.5 text-gray-400"><Search size={16} /></span>
              <input 
                type="text" 
                placeholder="Search Pending student or ID..." 
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-gray-50/50"
              />
            </div>
            <select
              value={pendingFilterClass}
              onChange={(e) => setPendingFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 outline-none"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredPending.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold">No students with pending balance dues found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-4 font-bold">Student ID</th>
                      <th className="p-4 font-bold">Student Name</th>
                      <th className="p-4 font-bold">Class Section</th>
                      <th className="p-4 font-bold">Month</th>
                      <th className="p-4 font-bold">Total Bill</th>
                      <th className="p-4 font-bold">Paid So Far</th>
                      <th className="p-4 font-bold">Outstanding Balance</th>
                      <th className="p-4 font-bold">Due Date</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {filteredPending.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-darkBlue">{f.rollNumber}</td>
                        <td className="p-4 font-semibold text-gray-800">{f.studentName}</td>
                        <td className="p-4 font-medium text-gray-500">{getClassName(f.classId)}</td>
                        <td className="p-4 font-semibold text-gray-600">{f.month} {f.year}</td>
                        <td className="p-4 font-bold text-gray-800">Rs. {f.totalAmount.toFixed(2)}</td>
                        <td className="p-4 font-semibold text-green-700">Rs. {(f.paidAmount || 0).toFixed(2)}</td>
                        <td className="p-4 font-black text-red-600">Rs. {(f.remainingAmount || 0).toFixed(2)}</td>
                        <td className="p-4 text-gray-400 font-semibold">{f.dueDate || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${f.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                            {f.status}
                          </span>
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

      {/* TAB 3: COLLECTIONS REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Tab Controls */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            {['daily', 'monthly', 'classwise', 'student'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${reportType === type ? 'bg-white text-darkBlue shadow' : 'text-gray-500'}`}
              >
                {type} Report
              </button>
            ))}
          </div>

          {/* REPORT VIEW: DAILY COLLECTIONS */}
          {reportType === 'daily' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Daily Collections Report</h3>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="mt-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white outline-none"
                  />
                </div>
                <ExportButtons tableId="daily-collection-table" filename={`Daily_Collection_${reportDate}`} />
              </div>

              <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-800">Total Collected Amount Today:</span>
                <strong className="text-xl font-black text-emerald-700">Rs. {dailyTotalCollected.toLocaleString()}</strong>
              </div>

              <table id="daily-collection-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="p-3 font-semibold">Receipt</th>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Class Section</th>
                    <th className="p-3 font-semibold">Paid Amount</th>
                    <th className="p-3 font-semibold">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dailyReceipts.map(r => (
                    <tr key={r.id}>
                      <td className="p-3 font-mono font-bold text-darkBlue">{r.receiptNumber}</td>
                      <td className="p-3 font-semibold">{r.studentName}</td>
                      <td className="p-3 font-medium text-gray-500">{getClassName(r.classId)}</td>
                      <td className="p-3 font-bold text-green-600">Rs. {r.paidAmount.toFixed(2)}</td>
                      <td className="p-3 font-medium text-gray-600">{r.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT VIEW: MONTHLY COLLECTIONS */}
          {reportType === 'monthly' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Monthly Collections Report</h3>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="mt-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white outline-none"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <ExportButtons tableId="monthly-collection-table" filename={`Monthly_Collection_${reportMonth}`} />
              </div>

              <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-800">Total Collected Amount in {reportMonth}:</span>
                <strong className="text-xl font-black text-emerald-700">Rs. {monthlyTotalCollected.toLocaleString()}</strong>
              </div>

              <table id="monthly-collection-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="p-3 font-semibold">Receipt</th>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Class Section</th>
                    <th className="p-3 font-semibold">Paid Amount</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlyReceipts.map(r => (
                    <tr key={r.id}>
                      <td className="p-3 font-mono font-bold text-darkBlue">{r.receiptNumber}</td>
                      <td className="p-3 font-semibold">{r.studentName}</td>
                      <td className="p-3 font-medium text-gray-500">{getClassName(r.classId)}</td>
                      <td className="p-3 font-bold text-green-600">Rs. {r.paidAmount.toFixed(2)}</td>
                      <td className="p-3 text-gray-400">{new Date(r.paymentDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT VIEW: CLASS-WISE COLLECTIONS */}
          {reportType === 'classwise' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                <h3 className="font-bold text-gray-800 text-sm">Class-wise Revenue Collections Summary</h3>
                <ExportButtons tableId="class-revenue-table" filename="Class_Revenue_Collection" />
              </div>

              <table id="class-revenue-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="p-3 font-semibold">Class Section</th>
                    <th className="p-3 font-semibold">Revenue Collected</th>
                    <th className="p-3 font-semibold">Outstanding Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classwiseReports.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-darkBlue">{row.className}</td>
                      <td className="p-3 font-bold text-green-600">Rs. {row.collected.toFixed(2)}</td>
                      <td className="p-3 font-bold text-red-500">Rs. {row.pending.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT VIEW: STUDENT LEDGER LOOKUP */}
          {reportType === 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="lg:col-span-4 border-r border-gray-100 pr-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search student ledger..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none bg-gray-50"
                  />
                </div>
                <div className="h-[350px] overflow-y-auto space-y-1 pr-1">
                  {filteredStudentsForSearch.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${selectedStudentId.toString() === s.id.toString() ? 'bg-darkBlue text-white border-darkBlue' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                    >
                      {s.name} ({s.rollNumber})
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4 pl-4 min-h-[350px]">
                {activeStudentReport ? (
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{activeStudentReport.name}'s Fee Ledger</h4>
                        <span className="text-[10px] text-gray-400 font-semibold">Roll No: {activeStudentReport.rollNumber} | Class: {getClassName(activeStudentReport.classId)}</span>
                      </div>
                      <ExportButtons tableId="student-ledger-table" filename={`Student_${activeStudentReport.rollNumber}_Ledger`} />
                    </div>

                    <table id="student-ledger-table" className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                          <th className="p-3 font-semibold">Billing Month</th>
                          <th className="p-3 font-semibold">Total Amount</th>
                          <th className="p-3 font-semibold">Paid Amount</th>
                          <th className="p-3 font-semibold">Dues Balance</th>
                          <th className="p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeStudentLedger.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 font-bold text-gray-700">{item.month} {item.year}</td>
                            <td className="p-3 font-semibold">Rs. {item.totalAmount.toFixed(2)}</td>
                            <td className="p-3 font-semibold text-green-700">Rs. {item.paidAmount.toFixed(2)}</td>
                            <td className="p-3 font-bold text-red-500">Rs. {item.remainingAmount.toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200'
                                : item.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                              }`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 text-gray-400 h-64">
                    <Search className="w-12 h-12 text-gray-200 mb-2" />
                    <p className="text-xs font-semibold">Select a student from the left panel to load their financial ledger statement.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRINT RECEIPT DISPLAY MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-gray-200 my-8">
            <button onClick={() => setViewingReceipt(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold transition-colors">
              <X className="w-6 h-6" />
            </button>

            {/* Receipt Printable Wrapper */}
            <div id="printable-receipt" className="space-y-6 p-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-darkBlue">SMART SCHOOL SYSTEM</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Official Payment Receipt</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-gray-400 font-bold block uppercase">Receipt Number</span><span className="font-mono font-bold text-gray-800">{viewingReceipt.receiptNumber}</span></div>
                <div className="text-right"><span className="text-gray-400 font-bold block uppercase">Date Received</span><span className="font-semibold text-gray-800">{new Date(viewingReceipt.paymentDate).toLocaleString()}</span></div>
              </div>

              <div className="border-t border-b border-gray-100 py-3 grid grid-cols-2 gap-y-2 text-xs">
                <div><span className="text-gray-400 font-semibold block">Student Name:</span><span className="font-bold text-gray-800">{viewingReceipt.studentName}</span></div>
                <div><span className="text-gray-400 font-semibold block">Student ID:</span><span className="font-bold text-gray-800">{viewingReceipt.rollNumber}</span></div>
                <div><span className="text-gray-400 font-semibold block">Class Section:</span><span className="font-bold text-gray-800">{viewingReceipt.className}</span></div>
                <div><span className="text-gray-400 font-semibold block">Billing Period:</span><span className="font-bold text-gray-800">{viewingReceipt.month} {viewingReceipt.year}</span></div>
              </div>

              <div className="space-y-2 border-b border-gray-200 pb-4 text-xs">
                <div className="flex justify-between"><span>Subtotal Base Fee:</span><span className="font-semibold">Rs. {viewingReceipt.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-600"><span>Adjusted Discounts:</span><span className="font-semibold">-Rs. {viewingReceipt.discount.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-500"><span>Assessed Fines:</span><span className="font-semibold">+Rs. {viewingReceipt.fine.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-darkBlue text-sm">
                  <span>Grand Total Paid:</span>
                  <span>Rs. {viewingReceipt.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                  <span>Outstanding Balance:</span>
                  <span>Rs. {viewingReceipt.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-500">
                <div>
                  <span className="font-semibold block">Payment Method:</span>
                  <span>{viewingReceipt.paymentMethod} {viewingReceipt.refNumber ? `(${viewingReceipt.refNumber})` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold block">Authorized Signature:</span>
                  <span>{viewingReceipt.receivedBy}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
              <button onClick={() => setViewingReceipt(null)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-darkBlue text-white hover:bg-blue-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
