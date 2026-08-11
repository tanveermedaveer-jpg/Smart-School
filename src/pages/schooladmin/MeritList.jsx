import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';

const MeritList = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [meritList, setMeritList] = useState([]);

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
    setMeritList([]);
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      
      const relevant = allResults.filter(r => 
        r.examId?.toString() === selectedExamId.toString() && 
        r.classId?.toString() === selectedClassId.toString() &&
        r.published === true
      );

      // Sort by percentage descending
      relevant.sort((a, b) => parseFloat(b.overallPercentage) - parseFloat(a.overallPercentage));

      // Calculate ranks with TIE support
      let currentRank = 0;
      let prevPercent = null;
      let skipCount = 0;

      const processed = relevant.map((r, index) => {
        const pct = parseFloat(r.overallPercentage) || 0;
        if (pct !== prevPercent) {
          currentRank += 1 + skipCount;
          skipCount = 0;
        } else {
          skipCount++;
        }
        prevPercent = pct;

        const posText = currentRank + (
          currentRank % 10 === 1 && currentRank !== 11 ? 'st' :
          currentRank % 10 === 2 && currentRank !== 12 ? 'nd' :
          currentRank % 10 === 3 && currentRank !== 13 ? 'rd' : 'th'
        );

        return {
          ...r,
          position: currentRank,
          posText
        };
      });

      setMeritList(processed);
    } else {
      setMeritList([]);
    }
  }, [selectedExamId, selectedClassId]);

  const getMedalIcon = (position) => {
    if (position === 1) return <Trophy className="text-yellow-500 animate-bounce" size={20} />;
    if (position === 2) return <Medal className="text-gray-400" size={20} />;
    if (position === 3) return <Medal className="text-amber-600" size={20} />;
    return <Star className="text-blue-200" size={16} />;
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="text-yellow-500 mr-2" size={26} /> Merit List Standings
          </h2>
          <p className="text-gray-500 text-sm mt-1">Check class rankings, subject ratios, and toppers list.</p>
        </div>
        <ExportButtons tableId="export-table" filename="Class_Merit_List" />
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
          {meritList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Award className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xs font-bold text-gray-700">No Published Results Found</h3>
              <p className="text-[11px] text-gray-400 mt-1">Results must be processed and published to load rankings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                    <th className="p-4 font-bold text-center w-20">Badge</th>
                    <th className="p-4 font-bold text-center w-20">Rank</th>
                    <th className="p-4 font-bold">Roll Number</th>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold text-center">Marks Obtained</th>
                    <th className="p-4 font-bold text-center">Percentage</th>
                    <th className="p-4 font-bold text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                  {meritList.map((result) => (
                    <tr key={result.studentId} className={result.position === 1 ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">{getMedalIcon(result.position)}</div>
                      </td>
                      <td className="p-4 text-center font-black text-gray-800 text-sm">{result.posText}</td>
                      <td className="p-4 font-bold text-darkBlue bg-white/40">{result.rollNumber}</td>
                      <td className="p-4 font-bold text-gray-900">{result.studentName}</td>
                      <td className="p-4 text-center font-bold text-gray-600">{result.totalObtainedMarks} / {result.totalPossibleMarks}</td>
                      <td className="p-4 text-center font-black text-darkBlue text-sm">{result.overallPercentage}%</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded font-bold ${result.position <= 3 ? 'bg-white border border-gray-200' : 'bg-gray-100 text-gray-600'}`}>{result.overallGrade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeritList;
