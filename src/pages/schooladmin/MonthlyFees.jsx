import React, { useState, useEffect } from 'react';
import { DollarSign, Search, RefreshCw, CreditCard, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { generateMonthlyFees } from '../../utils/feeGenerator';

const MonthlyFees = () => {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  const loadData = () => {
    const savedFees = JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');
    setFees(savedFees);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);
  };

  useEffect(() => {
    // Automatically check for missing fees on mount
    const generated = generateMonthlyFees();
    if (generated > 0) {
      toast.success(`Automatically generated ${generated} missing fee records for the current month.`);
    }
    loadData();
  }, []);

  const handleManualGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateMonthlyFees();
      if (generated > 0) {
        toast.success(`Generated ${generated} new fee records.`);
      } else {
        toast.info('All active students already have fee records generated for this month.');
      }
      loadData();
      setIsGenerating(false);
    }, 600);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  const availableMonths = [...new Set(fees.map(f => f.month))];

  const filteredFees = fees.filter(f => {
    const matchesSearch = 
      f.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = filterClass === 'All' || f.classId?.toString() === filterClass.toString();
    const matchesMonth = filterMonth === 'All' || f.month === filterMonth;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;

    return matchesSearch && matchesClass && matchesMonth && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Monthly Fees</h2>
          <p className="text-gray-500 text-sm mt-1">View and generate automated monthly student fee records.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <ExportButtons tableId="export-table" filename="Monthly Fees" />
          <button 
            onClick={handleManualGenerate} 
            disabled={isGenerating}
            className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm whitespace-nowrap disabled:opacity-70 text-xs"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            <span>Generate Monthly Fees</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-2.5 text-gray-400"><Search size={16} /></span>
          <input 
            type="text" 
            placeholder="Search by Name or Roll No..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none text-xs"
          />
        </div>
        
        <div className="w-full md:w-auto flex space-x-2">
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs"
          >
            <option value="All">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
            ))}
          </select>

          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs"
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredFees.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No monthly fee records found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-semibold">Student ID</th>
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Class placement</th>
                  <th className="p-4 font-semibold">Month</th>
                  <th className="p-4 font-semibold">Total Fee</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-darkBlue">{fee.rollNumber}</td>
                    <td className="p-4 font-medium text-gray-800">{fee.studentName}</td>
                    <td className="p-4">{getClassName(fee.classId)}</td>
                    <td className="p-4 font-medium text-gray-600">
                      {fee.month} {fee.year}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">Rs. {parseFloat(fee.totalAmount || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          fee.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          fee.status === 'Pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {fee.status}
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
  );
};

export default MonthlyFees;
