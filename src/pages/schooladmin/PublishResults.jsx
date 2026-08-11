import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { logSystemAction } from '../../utils/logger';

const PublishResults = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);

  // Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Available options
  const [availableClasses, setAvailableClasses] = useState([]);

  // Data
  const [lockedResults, setLockedResults] = useState([]);
  const [allProcessedResults, setAllProcessedResults] = useState([]); // includes processed-but-not-locked
  const [publishStatus, setPublishStatus] = useState(null); // null | 'Processed' | 'Locked' | 'Published'
  const [publishDate, setPublishDate] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

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
    setLockedResults([]);
    setAllProcessedResults([]);
    setPublishStatus(null);
  }, [selectedExamId]);

  // Load results — distinguish processed-but-not-locked vs locked vs published
  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');

      // All results for this exam + class (regardless of lock state)
      const processed = allResults.filter(r =>
        r.examId?.toString() === selectedExamId.toString() &&
        r.classId?.toString() === selectedClassId.toString()
      );

      // Subset that are locked
      const locked = processed.filter(r => r.locked === true);

      setAllProcessedResults(processed);
      setLockedResults(locked);

      if (locked.length > 0) {
        const isPublished = locked[0].published === true;
        setPublishStatus(isPublished ? 'Published' : 'Locked');
        setPublishDate(locked[0].publishedAt || '');
      } else if (processed.length > 0) {
        // Results exist but have not been locked yet
        setPublishStatus('Processed');
        setPublishDate('');
      } else {
        setPublishStatus(null);
        setPublishDate('');
      }
    } else {
      setLockedResults([]);
      setAllProcessedResults([]);
      setPublishStatus(null);
      setPublishDate('');
    }
  }, [selectedExamId, selectedClassId]);

  const handlePublishToggle = (isPublishing) => {
    if (lockedResults.length === 0) return;

    const actionText = isPublishing ? 'publish' : 'unpublish';
    if (!window.confirm(`Are you sure you want to ${actionText} these results?`)) {
      return;
    }

    const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
    const updated = allResults.map(r => {
      if (r.examId?.toString() === selectedExamId.toString() && r.classId?.toString() === selectedClassId.toString()) {
        return {
          ...r,
          published: isPublishing,
          publishedAt: isPublishing ? new Date().toISOString() : null,
          publishedBy: authUser.name || 'School Admin'
        };
      }
      return r;
    });

    localStorage.setItem('schoolAdminResults', JSON.stringify(updated));

    // Update Exam status to Published or back to Processing
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const updatedExams = allExams.map(ex => {
      if (ex.id.toString() === selectedExamId.toString()) {
        return { ...ex, status: isPublishing ? 'Published' : 'Processing' };
      }
      return ex;
    });
    localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));

    // Refresh all processed results state so table reflects new published status
    const refreshed = updated.filter(r =>
      r.examId?.toString() === selectedExamId.toString() &&
      r.classId?.toString() === selectedClassId.toString()
    );
    setExams(updatedExams);
    setAllProcessedResults(refreshed);
    setLockedResults(refreshed.filter(r => r.locked === true));
    setPublishStatus(isPublishing ? 'Published' : 'Locked');
    setPublishDate(isPublishing ? new Date().toISOString() : '');

    toast.success(`Results ${isPublishing ? 'published successfully! Students and parents can now view results.' : 'unpublished successfully.'}`);
    logSystemAction(isPublishing ? 'Results Published' : 'Results Recalled', authUser.name || 'School Admin', 'School Admin', `Exam ID: ${selectedExamId}, Class ID: ${selectedClassId}`);
  };

  // Lock all processed results then immediately publish — one-step shortcut
  const handleLockAndPublish = () => {
    if (allProcessedResults.length === 0) return;
    if (!window.confirm('This will lock and publish the results in one step. Students and parents will be able to view them. Continue?')) return;

    const now = new Date().toISOString();
    const allResults = JSON.parse(localStorage.getItem('schoolAdminResults') || '[]');
    const updated = allResults.map(r => {
      if (r.examId?.toString() === selectedExamId.toString() && r.classId?.toString() === selectedClassId.toString()) {
        return {
          ...r,
          locked: true,
          lockedAt: now,
          lockedBy: authUser.name || 'School Admin',
          published: true,
          publishedAt: now,
          publishedBy: authUser.name || 'School Admin'
        };
      }
      return r;
    });
    localStorage.setItem('schoolAdminResults', JSON.stringify(updated));

    // Update Exam status
    const allExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    const updatedExams = allExams.map(ex =>
      ex.id.toString() === selectedExamId.toString() ? { ...ex, status: 'Published' } : ex
    );
    localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));

    const refreshed = updated.filter(r =>
      r.examId?.toString() === selectedExamId.toString() &&
      r.classId?.toString() === selectedClassId.toString()
    );
    setExams(updatedExams);
    setAllProcessedResults(refreshed);
    setLockedResults(refreshed.filter(r => r.locked === true));
    setPublishStatus('Published');
    setPublishDate(now);

    toast.success('Results locked and published! Students and parents can now view them.');
    logSystemAction('Results Locked & Published', authUser.name || 'School Admin', 'School Admin', `Exam ID: ${selectedExamId}, Class ID: ${selectedClassId}`);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Publish Results Batch</h2>
          <p className="text-gray-500 text-sm mt-1">Make locked overall student marks visible to parents and student portals.</p>
        </div>
        <ExportButtons tableId="export-table" filename="Published_Exam_Report" />
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
        <div className="mb-6">

          {/* Results processed but not yet locked — offer one-step Lock & Publish */}
          {publishStatus === 'Processed' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
                <div>
                  <h3 className="text-xs font-bold text-amber-900 uppercase">Results Processed — Not Yet Published</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Results are processed but not yet locked or published. You can lock them first in <strong>Result Processing</strong>, or use the shortcut below to lock and publish in one step.
                  </p>
                </div>
              </div>
              <button
                onClick={handleLockAndPublish}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap flex items-center gap-2"
              >
                <Send size={13} />
                Lock &amp; Publish Now
              </button>
            </div>
          )}

          {/* Locked and ready to publish */}
          {publishStatus === 'Locked' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-blue-900 uppercase">Results ready to publish</h3>
                <p className="text-xs text-blue-700 mt-1">Processed results have been verified and locked. Ready to push to portals.</p>
              </div>
              <button onClick={() => handlePublishToggle(true)} className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                Publish Results
              </button>
            </div>
          )}

          {/* Published and live */}
          {publishStatus === 'Published' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-green-900 uppercase">Results live on portals</h3>
                <p className="text-xs text-green-700 mt-1">Published on {new Date(publishDate).toLocaleString()}. Portal access is active.</p>
              </div>
              <button onClick={() => handlePublishToggle(false)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                Recall / Unpublish Results
              </button>
            </div>
          )}

          {/* No results at all */}
          {publishStatus === null && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex items-start">
              <AlertTriangle className="text-orange-600 mr-3 mt-0.5" size={16} />
              <div>
                <h3 className="text-xs font-bold text-orange-900 uppercase">No Processed Results</h3>
                <p className="text-xs text-orange-700 mt-1">No results found for this exam and class. Go to <strong>Result Processing</strong>, select the exam and class, click <strong>Process Results</strong>, then <strong>Lock Results Batch</strong>.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result table — shown for Processed (read-only preview), Locked, or Published states */}
      {allProcessedResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {publishStatus === 'Processed' && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
              Preview (Read-only — Lock results before publishing)
            </div>
          )}
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Roll Number</th>
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold text-center">Total Obtained</th>
                  <th className="p-4 font-bold text-center">Total Marks</th>
                  <th className="p-4 font-bold text-center">Percentage</th>
                  <th className="p-4 font-bold text-center">Grade</th>
                  <th className="p-4 font-bold text-center">Publish Status</th>
                  <th className="p-4 font-bold text-right">Pass/Fail</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {allProcessedResults.map((result) => (
                  <tr key={result.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-darkBlue bg-gray-50/50">{result.rollNumber}</td>
                    <td className="p-4 font-semibold text-gray-800">{result.studentName}</td>
                    <td className="p-4 text-center font-bold text-gray-700">{result.totalObtainedMarks}</td>
                    <td className="p-4 text-center font-bold text-gray-500">{result.totalPossibleMarks}</td>
                    <td className="p-4 text-center font-semibold">{result.overallPercentage}%</td>
                    <td className="p-4 text-center font-bold text-darkBlue">{result.overallGrade}</td>
                    <td className="p-4 text-center">
                      {result.published
                        ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Published</span>
                        : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">Not Published</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${result.status === 'PASS' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishResults;
