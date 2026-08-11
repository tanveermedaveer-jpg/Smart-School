import React, { useState, useEffect } from 'react';
import { PieChart, BarChart2, TrendingUp, TrendingDown, Users, CheckCircle, XCircle, Search } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';

const ResultReports = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Report results
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [passRate, setPassRate] = useState(0);
  
  const [highestPercentage, setHighestPercentage] = useState(0);
  const [lowestPercentage, setLowestPercentage] = useState(0);
  const [averagePercentage, setAveragePercentage] = useState(0);

  const [gradeDistribution, setGradeDistribution] = useState({});
  const [classResults, setClassResults] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const allClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const allSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    
    setExams(allExams);
    setClasses(allClasses);
    setSubjects(allSubjects);
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
    setSelectedSubjectId('');
  }, [selectedExamId]);

  // Populate subjects when Class changes
  useEffect(() => {
    if (selectedClassId) {
      const classSubjects = subjects.filter(s => s.classId?.toString() === selectedClassId.toString());
      setAvailableSubjects(classSubjects);
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubjectId('');
  }, [selectedClassId]);

  // Compute reports analytics
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
      const filtered = allResults.filter(r => 
        r.examId?.toString() === selectedExamId.toString() &&
        r.classId?.toString() === selectedClassId.toString() &&
        r.published === true
      );

      setClassResults(filtered);

      if (filtered.length > 0) {
        const total = filtered.length;
        const passed = filtered.filter(r => r.status === 'PASS').length;
        const failed = total - passed;
        
        setPassCount(passed);
        setFailCount(failed);
        setPassRate(parseFloat(((passed / total) * 100).toFixed(1)));

        const percentages = filtered.map(r => parseFloat(r.overallPercentage) || 0);
        setHighestPercentage(Math.max(...percentages));
        setLowestPercentage(Math.min(...percentages));
        setAveragePercentage(parseFloat((percentages.reduce((a, b) => a + b, 0) / total).toFixed(1)));

        // Compute Grade Distribution
        const distribution = {};
        filtered.forEach(r => {
          distribution[r.overallGrade] = (distribution[r.overallGrade] || 0) + 1;
        });
        setGradeDistribution(distribution);

        // Compute Subject Performance (average obtained marks per subject)
        const subMap = {};
        filtered.forEach(res => {
          (res.subjectBreakdown || []).forEach(sub => {
            const subName = sub.subjectName;
            if (!subMap[subName]) {
              subMap[subName] = { totalObtained: 0, count: 0, totalMax: 0 };
            }
            if (sub.marksObtained !== null) {
              subMap[subName].totalObtained += sub.marksObtained;
              subMap[subName].totalMax += sub.totalMarks;
              subMap[subName].count++;
            }
          });
        });

        const subjectReports = Object.keys(subMap).map(name => {
          const stats = subMap[name];
          const avgPct = stats.totalMax > 0 ? (stats.totalObtained / stats.totalMax) * 100 : 0;
          return {
            subjectName: name,
            avgPercentage: parseFloat(avgPct.toFixed(1)),
            count: stats.count
          };
        });

        setSubjectPerformance(subjectReports);
      } else {
        resetAnalytics();
      }
    } else {
      resetAnalytics();
    }
  }, [selectedExamId, selectedClassId]);

  const resetAnalytics = () => {
    setClassResults([]);
    setPassCount(0);
    setFailCount(0);
    setPassRate(0);
    setHighestPercentage(0);
    setLowestPercentage(0);
    setAveragePercentage(0);
    setGradeDistribution({});
    setSubjectPerformance([]);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id.toString() === classId.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Results Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Audit class pass/fail ratios, grade distributions, and subject performance metrics.</p>
        </div>
        <ExportButtons tableId="export-table" filename="Exam_Results_Analytics" />
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

      {classResults.length > 0 ? (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Class Topper score</span>
                <h3 className="text-xl font-black text-green-600 mt-1">{highestPercentage}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-green-50 text-green-600"><TrendingUp size={20} /></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Class Average Score</span>
                <h3 className="text-xl font-black text-darkBlue mt-1">{averagePercentage}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><BarChart2 size={20} /></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Class pass rate</span>
                <h3 className="text-xl font-black text-greenAccent mt-1">{passRate}%</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={20} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase border-b border-gray-100 pb-2">Grade Distribution</h3>
              <div className="space-y-3">
                {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(grade => {
                  const count = gradeDistribution[grade] || 0;
                  const pct = classResults.length > 0 ? (count / classResults.length) * 100 : 0;
                  return (
                    <div key={grade} className="flex items-center text-xs gap-3">
                      <span className="font-bold text-gray-600 w-8">{grade}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="bg-darkBlue h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="font-bold text-gray-700 w-10 text-right">{count} S.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject Averages */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase border-b border-gray-100 pb-2">Subject Performance Averages</h3>
              <div className="space-y-3">
                {subjectPerformance.map((sub, idx) => (
                  <div key={idx} className="flex items-center text-xs gap-3">
                    <span className="font-bold text-gray-600 w-28 truncate">{sub.subjectName}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${sub.avgPercentage}%` }}></div>
                    </div>
                    <span className="font-bold text-gray-700 w-12 text-right">{sub.avgPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roster detail sheet */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-xs uppercase tracking-wider text-gray-700">Detailed Student Results List</div>
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead>
                <tr className="bg-white text-gray-600 border-b border-gray-100">
                  <th className="p-4 font-bold">Roll Number</th>
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold text-center">Score</th>
                  <th className="p-4 font-bold text-center">Percentage</th>
                  <th className="p-4 font-bold text-center">Grade</th>
                  <th className="p-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classResults.map(r => (
                  <tr key={r.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-darkBlue">{r.rollNumber}</td>
                    <td className="p-4 font-semibold text-gray-800">{r.studentName}</td>
                    <td className="p-4 text-center font-bold text-gray-600">{r.totalObtainedMarks} / {r.totalPossibleMarks}</td>
                    <td className="p-4 text-center font-semibold">{r.overallPercentage}%</td>
                    <td className="p-4 text-center font-bold text-darkBlue">{r.overallGrade}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.status === 'PASS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center text-gray-400 border-dashed text-xs">
          <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold">Select an Exam and Class with published results to generate reports.</p>
        </div>
      )}
    </div>
  );
};

export default ResultReports;
