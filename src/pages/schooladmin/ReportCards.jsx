import React, { useState, useEffect } from 'react';
import { FileText, Search, Printer, Users } from 'lucide-react';
import ReportCardTemplate from '../../components/ReportCardTemplate';

const ReportCards = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Available options
  const [availableClasses, setAvailableClasses] = useState([]);

  const [enrichedResults, setEnrichedResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Report Card Modal State
  const [viewingResult, setViewingResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setExams(allExams);
    setClasses(allClasses);
  };

  // Populate participating classes when Exam changes
  useEffect(() => {
    if (selectedExamId) {
      const exam = exams.find(e => e.id.toString() === selectedExamId.toString());
      if (exam) {
        const participatingIds = exam.participatingClasses || [];
        const matching = classes.filter(c => participatingIds.includes(c.id.toString()));
        setAvailableClasses(matching);
      } else {
        setAvailableClasses([]);
      }
    } else {
      setAvailableClasses([]);
    }
    setSelectedClassId('');
    setEnrichedResults([]);
  }, [selectedExamId]);

  // Load and enrich results
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      
      // Load results for this class and exam (published only)
      const currentClassResults = allResults.filter(r => 
        r.examId?.toString() === selectedExamId.toString() && 
        r.classId?.toString() === selectedClassId.toString() &&
        r.published === true
      );

      if (currentClassResults.length > 0) {
        const allUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
        const examObj = exams.find(e => e.id.toString() === selectedExamId.toString());
        const classObj = classes.find(c => c.id.toString() === selectedClassId.toString());

        // Sort by percentage to calculate Position
        const sortedByPercent = [...currentClassResults].sort((a, b) => parseFloat(b.overallPercentage) - parseFloat(a.overallPercentage));

        const enriched = sortedByPercent.map((res, index) => {
          const studentInfo = allUsers.find(u => u.id?.toString() === res.studentId?.toString());
          const parentInfo = allUsers.find(u => u.id?.toString() === studentInfo?.parentId?.toString());
          
          const rank = index + 1;
          const posText = rank + (
            rank % 10 === 1 && rank !== 11 ? 'st' :
            rank % 10 === 2 && rank !== 12 ? 'nd' :
            rank % 10 === 3 && rank !== 13 ? 'rd' : 'th'
          );

          return {
            ...res,
            examName: examObj?.examName,
            academicSession: examObj?.academicSession,
            className: classObj ? `${classObj.className} - ${classObj.section}` : 'Unknown',
            parentName: parentInfo ? parentInfo.name : 'Unknown',
            classPosition: posText,
            subjectBreakdown: res.subjectBreakdown || []
          };
        });

        setEnrichedResults(enriched);
      } else {
        setEnrichedResults([]);
      }
    } else {
      setEnrichedResults([]);
    }
  }, [selectedExamId, selectedClassId]);

  const filteredData = enrichedResults.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Student Report Cards</h2>
          <p className="text-gray-500 text-sm mt-1">Generate and print high-quality progress cards using actual result databases.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam</label>
          <select 
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold"
          >
            <option value="">-- Select Exam --</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.examName} ({e.academicSession})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class Section</label>
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={!selectedExamId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold disabled:bg-gray-50"
          >
            <option value="">-- Select Class --</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedExamId && selectedClassId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {enrichedResults.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xs font-bold text-gray-700">No Published Results Found</h3>
              <p className="text-[11px] text-gray-400 mt-1">Ensure the results for this class have been processed, locked, and published.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 gap-4 flex-wrap">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none text-xs bg-white"
                  />
                </div>
                <div className="flex items-center text-xs font-bold text-gray-600 space-x-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Users size={14} className="text-darkBlue" />
                  <span>{filteredData.length} Students Listed</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white text-gray-600 text-xs border-b border-gray-100">
                      <th className="p-4 font-bold">Roll Number</th>
                      <th className="p-4 font-bold">Student Name</th>
                      <th className="p-4 font-bold text-center">Class Position</th>
                      <th className="p-4 font-bold text-center">Grade</th>
                      <th className="p-4 font-bold text-center">Average %</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    {filteredData.map((result) => (
                      <tr key={result.studentId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-darkBlue bg-gray-50/50">{result.rollNumber}</td>
                        <td className="p-4 font-semibold text-gray-800">{result.studentName}</td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded font-bold text-[10px]">{result.classPosition}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-darkBlue">{result.overallGrade}</td>
                        <td className="p-4 text-center font-bold text-gray-600">{result.overallPercentage}%</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setViewingResult(result)}
                            className="bg-darkBlue text-white hover:bg-blue-900 px-3 py-1.5 rounded font-bold transition-all shadow-sm text-[10px] inline-flex items-center gap-1"
                          >
                            <Printer size={12} />
                            <span>View Report Card</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Render Template Overlay */}
      {viewingResult && (
        <ReportCardTemplate 
          result={viewingResult} 
          onClose={() => setViewingResult(null)} 
        />
      )}
    </div>
  );
};

export default ReportCards;
