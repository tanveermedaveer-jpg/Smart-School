import React, { useState, useEffect } from 'react';
import { Search, DollarSign, X, CheckCircle, Receipt, Printer, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { logSystemAction } from '../../utils/logger';

const CollectFees = () => {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  const [fine, setFine] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [refNumber, setRefNumber] = useState('');

  // Receipt Modal State
  const [showReceiptRecord, setShowReceiptRecord] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedFees = JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');
    setFees(savedFees);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);
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

  const openPaymentModal = (fee) => {
    setSelectedFee(fee);
    setFine(fee.fine || 0);
    setDiscount(fee.discount || 0);
    setPaidAmount('');
    setPaymentMethod('Cash');
    setRefNumber('');
    setIsModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedFee(null);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedFee) return;

    const baseAmount = selectedFee.totalAmount || 0;
    const previousPaid = selectedFee.paidAmount || 0;
    
    const currentFine = parseFloat(fine) || 0;
    const currentDiscount = parseFloat(discount) || 0;
    const currentPaid = parseFloat(paidAmount) || 0;

    if (currentPaid <= 0 || currentFine < 0 || currentDiscount < 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    const finalTotal = baseAmount + currentFine - currentDiscount;
    const totalPaidNow = previousPaid + currentPaid;
    const remainingAmount = Math.max(0, finalTotal - totalPaidNow);

    if (totalPaidNow > finalTotal) {
      toast.error('Total paid amount cannot exceed adjusted total amount.');
      return;
    }

    let newStatus = 'Pending';
    if (totalPaidNow >= finalTotal) {
      newStatus = 'Paid';
    } else if (totalPaidNow > 0) {
      newStatus = 'Partially Paid';
    }

    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const schoolId = authUser.schoolId ? authUser.schoolId.toString() : '';

    // Create receipt
    const receiptRecord = {
      id: Date.now(),
      receiptNumber,
      studentId: selectedFee.studentId,
      studentName: selectedFee.studentName,
      rollNumber: selectedFee.rollNumber,
      classId: selectedFee.classId,
      className: getClassName(selectedFee.classId),
      section: selectedFee.section,
      month: selectedFee.month,
      year: selectedFee.year,
      paidAmount: currentPaid,
      fine: currentFine,
      discount: currentDiscount,
      total: finalTotal,
      balance: remainingAmount,
      paymentMethod,
      refNumber,
      paymentDate: new Date().toISOString(),
      receivedBy: authUser.name || 'School Admin',
      schoolId: schoolId
    };

    const existingReceipts = JSON.parse(localStorage.getItem('schoolAdminReceipts') || '[]');
    localStorage.setItem('schoolAdminReceipts', JSON.stringify([...existingReceipts, receiptRecord]));

    // Update Fee Record in monthly fees list
    const updatedFees = fees.map(f => {
      if (f.id === selectedFee.id) {
        return {
          ...f,
          fine: currentFine,
          discount: currentDiscount,
          paidAmount: totalPaidNow,
          remainingAmount: remainingAmount,
          totalAmount: finalTotal,
          status: newStatus,
          lastPaymentDate: new Date().toISOString(),
          lastReceiptNumber: receiptNumber
        };
      }
      return f;
    });

    localStorage.setItem('schoolAdminMonthlyFees', JSON.stringify(updatedFees));
    setFees(updatedFees);
    
    logSystemAction(
      `Fee Collected: $${currentPaid} for ${selectedFee.studentName} (${selectedFee.month})`,
      authUser.name || 'School Admin',
      'School Admin',
      authUser.schoolName || 'School',
      schoolId
    );

    toast.success(`Payment collected. Receipt ${receiptNumber} generated.`);
    closePaymentModal();
    setShowReceiptRecord(receiptRecord); // Open receipt printout view immediately!
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Collect Fees</h2>
          <p className="text-gray-500 text-sm mt-1">Receive fee payments, apply class or student discount balances, and log collections.</p>
        </div>
        <ExportButtons tableId="export-table" filename="Fee Collection" />
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
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredFees.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No fee records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Student ID</th>
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Class placement</th>
                  <th className="p-4 font-semibold">Month</th>
                  <th className="p-4 font-semibold">Total Fee</th>
                  <th className="p-4 font-semibold">Balance Due</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {filteredFees.map((fee) => {
                  const baseAmt = parseFloat(fee.totalAmount || 0);
                  const currFine = parseFloat(fee.fine || 0);
                  const currDiscount = parseFloat(fee.discount || 0);
                  const paid = parseFloat(fee.paidAmount || 0);
                  
                  const finalTotal = baseAmt + currFine - currDiscount;
                  const balance = Math.max(0, finalTotal - paid);

                  return (
                    <tr key={fee.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-darkBlue">{fee.rollNumber}</td>
                      <td className="p-4 font-medium text-gray-800">{fee.studentName}</td>
                      <td className="p-4">{getClassName(fee.classId)}</td>
                      <td className="p-4 font-medium text-gray-600">{fee.month} {fee.year}</td>
                      <td className="p-4 font-semibold text-gray-800">Rs. {finalTotal.toFixed(2)}</td>
                      <td className="p-4 font-bold text-red-600">Rs. {balance.toFixed(2)}</td>
                      <td className="p-4">
                        <span 
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            fee.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            fee.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {fee.status !== 'Paid' ? (
                          <button 
                            onClick={() => openPaymentModal(fee)} 
                            className="bg-darkBlue hover:bg-blue-900 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                          >
                            Collect Payment
                          </button>
                        ) : (
                          <span className="text-green-600 font-bold text-xs flex items-center justify-end">
                            <CheckCircle size={14} className="mr-1" /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COLLECT PAYMENT MODAL */}
      {isModalOpen && selectedFee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold flex items-center uppercase tracking-wider"><Receipt className="mr-2" size={18}/> Collect Payment</h3>
              <button onClick={closePaymentModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><span className="text-gray-400 block font-bold uppercase">Student</span><span className="font-semibold text-gray-800">{selectedFee.studentName}</span></div>
                <div><span className="text-gray-400 block font-bold uppercase">Student ID</span><span className="font-semibold text-gray-800">{selectedFee.rollNumber}</span></div>
                <div><span className="text-gray-400 block font-bold uppercase">Billing Month</span><span className="font-semibold text-gray-800">{selectedFee.month} {selectedFee.year}</span></div>
                <div><span className="text-gray-400 block font-bold uppercase">Base Fee</span><span className="font-semibold text-gray-800">Rs. {parseFloat(selectedFee.totalAmount || 0).toFixed(2)}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add Fine (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={14}/></span>
                    <input type="number" min="0" step="0.01" value={fine} onChange={(e) => setFine(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400/20 focus:border-red-400 outline-none text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apply Discount (-)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={14}/></span>
                    <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400/20 focus:border-green-400 outline-none text-xs" />
                  </div>
                </div>
              </div>

              {(() => {
                const baseAmt = parseFloat(selectedFee.totalAmount || 0);
                const currFine = parseFloat(fine) || 0;
                const currDiscount = parseFloat(discount) || 0;
                const paidSoFar = parseFloat(selectedFee.paidAmount || 0);
                
                const finalTotal = baseAmt + currFine - currDiscount;
                const balanceDue = Math.max(0, finalTotal - paidSoFar);
                
                return (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-blue-900">Adjusted Total: Rs. {finalTotal.toFixed(2)}</div>
                      <div className="text-[10px] text-blue-600 mt-1 font-semibold">Previously Paid: Rs. {paidSoFar.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Balance Due</div>
                      <div className="text-xl font-bold text-darkBlue">Rs. {balanceDue.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Collected Amount (Required)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500"><DollarSign size={14}/></span>
                    <input required type="number" min="0.01" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs" placeholder="e.g. 1000" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none bg-white text-xs">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference / Transaction Number (Optional)</label>
                <input type="text" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-greenAccent/20 focus:border-greenAccent outline-none text-xs bg-white" placeholder="TXN-12345" />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
                <button type="button" onClick={closePaymentModal} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>Collect Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT DISPLAY MODAL */}
      {showReceiptRecord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-gray-200 my-8">
            <button onClick={() => setShowReceiptRecord(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold transition-colors">
              <X className="w-6 h-6" />
            </button>

            {/* Receipt Printable Wrapper */}
            <div id="printable-receipt" className="space-y-6 p-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-darkBlue">SMART SCHOOL SYSTEM</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Official Payment Receipt</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-gray-400 font-bold block uppercase">Receipt Number</span><span className="font-mono font-bold text-gray-800">{showReceiptRecord.receiptNumber}</span></div>
                <div className="text-right"><span className="text-gray-400 font-bold block uppercase">Date Received</span><span className="font-semibold text-gray-800">{new Date(showReceiptRecord.paymentDate).toLocaleString()}</span></div>
              </div>

              <div className="border-t border-b border-gray-100 py-3 grid grid-cols-2 gap-y-2 text-xs">
                <div><span className="text-gray-400 font-semibold block">Student Name:</span><span className="font-bold text-gray-800">{showReceiptRecord.studentName}</span></div>
                <div><span className="text-gray-400 font-semibold block">Student ID:</span><span className="font-bold text-gray-800">{showReceiptRecord.rollNumber}</span></div>
                <div><span className="text-gray-400 font-semibold block">Class Section:</span><span className="font-bold text-gray-800">{showReceiptRecord.className}</span></div>
                <div><span className="text-gray-400 font-semibold block">Billing Period:</span><span className="font-bold text-gray-800">{showReceiptRecord.month} {showReceiptRecord.year}</span></div>
              </div>

              <div className="space-y-2 border-b border-gray-200 pb-4 text-xs">
                <div className="flex justify-between"><span>Subtotal Base Fee:</span><span className="font-semibold">Rs. {showReceiptRecord.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-600"><span>Adjusted Discounts:</span><span className="font-semibold">-Rs. {showReceiptRecord.discount.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-500"><span>Assessed Fines:</span><span className="font-semibold">+Rs. {showReceiptRecord.fine.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-darkBlue text-sm">
                  <span>Grand Total Paid:</span>
                  <span>Rs. {showReceiptRecord.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                  <span>Outstanding Balance:</span>
                  <span>Rs. {showReceiptRecord.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-500">
                <div>
                  <span className="font-semibold block">Payment Method:</span>
                  <span>{showReceiptRecord.paymentMethod} {showReceiptRecord.refNumber ? `(${showReceiptRecord.refNumber})` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold block">Authorized Signature:</span>
                  <span>{showReceiptRecord.receivedBy}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
              <button onClick={() => setShowReceiptRecord(null)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all">Close</button>
              <button onClick={handlePrint} className="px-4 py-2 bg-darkBlue text-white hover:bg-blue-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
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

export default CollectFees;
