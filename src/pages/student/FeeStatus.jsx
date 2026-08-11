import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';

const StudentFeeStatus = () => {
  const [fees, setFees] = useState([]);
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const studentId = authUser.studentId || authUser.id;
    if (studentId) {
      const allFees = JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');
      const myFees = allFees.filter(f => f.studentId?.toString() === studentId.toString());
      
      myFees.sort((a, b) => {
        const dateA = new Date(`${a.month} 1, ${a.year}`);
        const dateB = new Date(`${b.month} 1, ${b.year}`);
        return dateB - dateA; // Newest first
      });
      setFees(myFees);
    }
  }, [authUser.id, authUser.studentId]);

  const availableMonths = [...new Set(fees.map(f => f.month))];

  const filteredFees = fees.filter(f => {
    const matchesMonth = filterMonth === 'All' || f.month === filterMonth;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    return matchesMonth && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Fee Details</h2>
          <p className="text-gray-500 text-sm mt-1">Check your monthly tuition invoices, discount benefits, and transaction history.</p>
        </div>
        <ExportButtons tableId="export-table" filename="My_Fees_Ledger" />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="w-full md:w-auto flex space-x-2">
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs font-semibold"
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredFees.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CreditCard className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-xs font-semibold">No fee history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Month / Year</th>
                  <th className="p-4 font-bold">Base Tuition</th>
                  <th className="p-4 font-bold">Adjusted Fines/Discounts</th>
                  <th className="p-4 font-bold">Total Amount</th>
                  <th className="p-4 font-bold">Amount Paid</th>
                  <th className="p-4 font-bold">Outstanding Balance</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Receipt ID</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {filteredFees.map((fee) => {
                  const baseAmt = parseFloat(fee.totalAmount || 0);
                  const fine = parseFloat(fee.fine || 0);
                  const discount = parseFloat(fee.discount || 0);
                  const finalTotal = baseAmt + fine - discount;
                  const paid = parseFloat(fee.paidAmount || 0);
                  const balance = Math.max(0, finalTotal - paid);

                  return (
                    <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-darkBlue">
                        {fee.month} {fee.year}
                      </td>
                      <td className="p-4 font-medium text-gray-800">Rs. {baseAmt.toFixed(2)}</td>
                      <td className="p-4 font-medium">
                        {fine > 0 && <span className="text-red-500 block">+Rs. {fine.toFixed(2)} Fine</span>}
                        {discount > 0 && <span className="text-green-600 block">-Rs. {discount.toFixed(2)} Discount</span>}
                        {fine === 0 && discount === 0 && <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-4 font-bold text-gray-800">Rs. {finalTotal.toFixed(2)}</td>
                      <td className="p-4 font-semibold text-green-700">Rs. {paid.toFixed(2)}</td>
                      <td className="p-4 font-black text-red-500">Rs. {balance.toFixed(2)}</td>
                      <td className="p-4">
                        <span 
                          className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center w-max ${
                            fee.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            fee.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {fee.status === 'Paid' ? <CheckCircle size={12} className="mr-1"/> : <Clock size={12} className="mr-1" />}
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-500 font-mono text-[10px] font-bold">
                        {fee.lastReceiptNumber || 'N/A'}
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
  );
};

export default StudentFeeStatus;
