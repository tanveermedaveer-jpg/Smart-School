import React, { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';

const ReportCardTemplate = ({ result, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:overflow-visible">
      {/* Action Bar - Hidden during print */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 print:hidden shadow-sm">
        <h2 className="text-base sm:text-xl font-bold text-gray-800">Report Card Preview</h2>
        <div className="flex items-center justify-end space-x-2 sm:space-x-3">
          <button 
            onClick={handlePrint}
            className="bg-darkBlue hover:bg-blue-900 text-white px-3 sm:px-5 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1.5 text-xs sm:text-sm"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="py-4 sm:py-8 px-2 sm:px-4 print:p-0 flex justify-center max-w-full">
        <div 
          ref={printRef}
          className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none print:w-full print:h-auto print:border-none p-4 sm:p-8 md:p-12 relative overflow-x-hidden"
        >
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full border-[12px] sm:border-[20px] border-darkBlue/20 flex items-center justify-center">
               <span className="text-3xl sm:text-6xl font-bold text-darkBlue/20 tracking-tighter">SMART</span>
            </div>
          </div>

          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-darkBlue pb-6 mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-darkBlue rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-3xl shadow-md shrink-0">
                  SS
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Smart School</h1>
                  <p className="text-gray-600 font-medium text-xs sm:text-base">123 Education Boulevard, Knowledge City, NY 10001</p>
                  <p className="text-gray-500 text-xs">Phone: (555) 123-4567 | Email: info@smartschool.edu</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-lg sm:text-2xl font-bold text-darkBlue uppercase tracking-widest">Report Card</h2>
                <p className="text-gray-700 font-semibold text-xs sm:text-sm mt-0.5">Academic Year: {result.academicYear}</p>
                <p className="text-gray-500 font-medium text-xs">{result.examName}</p>
              </div>
            </div>

            {/* Student Information Section */}
            <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-3 w-full sm:w-3/4">
                <div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Student Name</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-lg">{result.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Parent / Guardian</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-lg">{result.parentName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Class & Section</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-base">{result.className} - '{result.section}'</span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Roll Number</span>
                  <span className="font-bold text-gray-800 text-xs sm:text-base">{result.rollNumber}</span>
                </div>
              </div>
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                 <span className="text-gray-400 font-medium text-[10px] sm:text-xs text-center px-2">Photo</span>
              </div>
            </div>

            {/* Marks Table */}
            <div className="mb-6 sm:mb-8 border border-gray-300 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[320px]">
                <thead>
                  <tr className="bg-darkBlue text-white">
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold uppercase tracking-wide text-xs sm:text-sm border-r border-blue-800">Subject</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold uppercase tracking-wide text-xs sm:text-sm text-center border-r border-blue-800">Total Marks</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold uppercase tracking-wide text-xs sm:text-sm text-center border-r border-blue-800">Obtained Marks</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold uppercase tracking-wide text-xs sm:text-sm text-center">Subject Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjectBreakdown && result.subjectBreakdown.map((subject, idx) => {
                    const subPercentage = subject.totalMarks > 0 ? ((subject.marksObtained / subject.totalMarks) * 100) : 0;
                    let subGrade = 'F';
                    if (subPercentage >= 90) subGrade = 'A+';
                    else if (subPercentage >= 80) subGrade = 'A';
                    else if (subPercentage >= 70) subGrade = 'B';
                    else if (subPercentage >= 60) subGrade = 'C';
                    else if (subPercentage >= 50) subGrade = 'D';

                    return (
                      <tr key={idx} className="border-b border-gray-200 last:border-0 even:bg-gray-50 text-xs sm:text-sm">
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-gray-800 border-r border-gray-200">{subject.subjectName}</td>
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center text-gray-600 font-medium border-r border-gray-200">{subject.totalMarks}</td>
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center font-bold text-gray-900 border-r border-gray-200">{subject.marksObtained}</td>
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center font-bold text-darkBlue">{subGrade}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary & Positions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="border-2 border-darkBlue rounded-xl p-0 overflow-hidden">
                <div className="bg-darkBlue text-white text-center py-2 font-bold uppercase tracking-wider text-xs sm:text-sm">
                  Overall Performance
                </div>
                <div className="p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div>
                     <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Total Marks</div>
                     <div className="text-base sm:text-xl font-bold text-gray-900">{result.totalMarks}</div>
                  </div>
                  <div>
                     <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Obtained</div>
                     <div className="text-base sm:text-xl font-bold text-gray-900">{result.obtainedMarks}</div>
                  </div>
                  <div>
                     <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Percentage</div>
                     <div className="text-base sm:text-xl font-bold text-gray-900">{result.percentage}%</div>
                  </div>
                  <div>
                     <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Final Grade</div>
                     <div className="text-xl sm:text-2xl font-black text-darkBlue">{result.grade}</div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-greenAccent rounded-xl p-0 overflow-hidden">
                 <div className="bg-greenAccent text-white text-center py-2 font-bold uppercase tracking-wider text-xs sm:text-sm">
                  Rankings & Status
                </div>
                <div className="p-3 sm:p-4 flex flex-col justify-center gap-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                     <span className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Class Position:</span>
                     <span className="text-sm sm:text-lg font-bold text-gray-900">{result.classPosition || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                     <span className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Section Position:</span>
                     <span className="text-sm sm:text-lg font-bold text-gray-900">{result.sectionPosition || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Result Status:</span>
                     <span className={`px-2.5 py-1 rounded-full text-xs font-black ${result.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.status === 'PASS' ? 'PASSED' : 'FAILED'}
                     </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end pt-8 sm:pt-12 mt-8 sm:mt-12 border-t-2 border-gray-200 gap-6 sm:gap-0">
               <div className="text-center w-full sm:w-48">
                  <div className="border-b border-gray-400 mb-2"></div>
                  <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase">Class Teacher</span>
               </div>
               <div className="text-center w-full sm:w-48">
                  <div className="border-b border-gray-400 mb-2"></div>
                  <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase">Principal</span>
               </div>
               <div className="text-center w-full sm:w-48">
                  <div className="border-b border-gray-400 mb-2"></div>
                  <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase">Parent Signature</span>
               </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 sm:mt-12 text-[10px] sm:text-xs text-gray-400 font-medium">
               Generated by Smart School Management System | Date: {new Date().toLocaleDateString()}
            </div>

          </div>
        </div>
      </div>
      
      {/* CSS specific for print hiding scrollbars and forcing background colors */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:bg-white, .print\\:bg-white * {
            visibility: visible;
          }
          .print\\:bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
};

export default ReportCardTemplate;
