import React, { useState, useEffect } from 'react';
import { Award, Search, Calendar, BookOpen, AlertCircle, FileText } from 'lucide-react';
import ReportCardTemplate from '../../components/ReportCardTemplate';

const Results = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Report Card Modal State
  const [viewingResult, setViewingResult] = useState(null);

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const parentId = authUser.id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const myChildren = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.parentId?.toString() === parentId?.toString() || 
       (users.find(p => p.id?.toString() === parentId?.toString())?.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );
    setChildren(myChildren);

    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id?.toString() || '');
    }
  };

  // Load results for selected child
  useEffect(() => {
    if (selectedChildId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      const myResults = allResults.filter(r => 
        r.studentId?.toString() === selectedChildId.toString() && 
        r.published === true
      );

      const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
      const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
      const allUsers = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');

      const enriched = myResults.map(res => {
        const exam = allExams.find(e => e.id?.toString() === res.examId?.toString()) || {};
        const classObj = allClasses.find(c => c.id?.toString() === res.classId?.toString()) || {};
        const studentInfo = allUsers.find(u => u.id?.toString() === res.studentId?.toString()) || {};
        const parentInfo = allUsers.find(u => u.id?.toString() === studentInfo.parentId?.toString()) || {};

        // Determine rank position within the class
        const classResults = allResults.filter(r => 
          r.examId?.toString() === res.examId?.toString() && 
          r.classId?.toString() === res.classId?.toString() &&
          r.published === true
        ).sort((a, b) => parseFloat(b.overallPercentage || 0) - parseFloat(a.overallPercentage || 0));
        
        const rank = classResults.findIndex(r => r.studentId?.toString() === res.studentId?.toString()) + 1;
        const rankText = rank + (
          rank % 10 === 1 && rank !== 11 ? 'st' :
          rank % 10 === 2 && rank !== 12 ? 'nd' :
          rank % 10 === 3 && rank !== 13 ? 'rd' : 'th'
        );

        return {
          ...res,
          examName: exam.examName || 'Unknown Exam',
          academicSession: exam.academicSession || '2026-2027',
          className: classObj.className ? `${classObj.className} - ${classObj.section}` : 'Unknown',
          parentName: parentInfo.name || authUser.name,
          classPosition: rankText
        };
      });

      setResults(enriched);
      setFilteredResults(enriched);
    } else {
      setResults([]);
      setFilteredResults([]);
    }
  }, [selectedChildId]);

  useEffect(() => {
    let filtered = results;
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.examName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredResults(filtered);
  }, [searchTerm, results]);

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold">No children profiles are linked to your parent account.</p>
      </div>
    );
  }

  const getClassName = (classId) => {
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = classes.find(c => c.id?.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Children Results Standings</h2>
          <p className="text-gray-500 text-sm mt-1">Review official progress cards and academic metrics for your children.</p>
        </div>
      </div>

      {/* Select Child Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id?.toString() || '')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${selectedChildId === child.id?.toString() ? 'bg-white text-darkBlue shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {child.name} ({getClassName(child.classId)})
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search by Exam Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none text-xs"
          />
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 border-dashed text-xs">
          <Award size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold">No published results found for this student profile.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredResults.map(result => (
            <div key={result.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-darkBlue p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Award size={16} />
                    {result.examName}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1 text-[10px] text-blue-200 font-semibold uppercase">
                    <span>Session: {result.academicSession}</span>
                    <span>Class: {result.className}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingResult(result)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-3 py-1.5 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1"
                >
                  <FileText size={12} />
                  <span>Report Card</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100 text-xs">
                <div className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Max Marks</span>
                  <strong className="text-lg font-bold text-gray-700">{result.totalPossibleMarks}</strong>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Obtained</span>
                  <strong className="text-lg font-bold text-gray-700">{result.totalObtainedMarks}</strong>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Percentage</span>
                  <strong className="text-lg font-black text-gray-800">{result.overallPercentage}%</strong>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Final Grade</span>
                  <strong className="text-xl font-black text-darkBlue block">{result.overallGrade}</strong>
                </div>
                <div className="p-4 text-center flex flex-col justify-center items-center col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</span>
                  <span className={`px-3 py-1 rounded text-[10px] font-bold ${result.status === 'PASS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{result.status}</span>
                </div>
              </div>

              {/* Subject Breakdown Detail */}
              <div className="p-5">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Subject Performance Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <th className="p-3 font-semibold">Subject</th>
                        <th className="p-3 font-semibold text-center">Max Marks</th>
                        <th className="p-3 font-semibold text-center">Obtained Marks</th>
                        <th className="p-3 font-semibold text-center">Percentage</th>
                        <th className="p-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(result.subjectBreakdown || []).map((sub, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-gray-700">{sub.subjectName}</td>
                          <td className="p-3 text-center font-medium text-gray-500">{sub.totalMarks}</td>
                          <td className="p-3 text-center font-bold text-gray-800">{sub.status === 'Present' ? sub.marksObtained : sub.status}</td>
                          <td className="p-3 text-center font-semibold text-gray-600">{sub.status === 'Present' ? `${sub.percentage}%` : '—'}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sub.passed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {sub.passed ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
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

export default Results;
