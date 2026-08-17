import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, X, ClipboardList, Calendar, CheckSquare, Settings2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButtons from '../../components/ExportButtons';
import { logSystemAction } from '../../utils/logger';

const ExamManagement = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSession, setFilterSession] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Configuration Steps in Modal: 'basic' | 'classes' | 'subjects'
  const [modalTab, setModalTab] = useState('basic');

  const initialFormState = {
    examName: '',
    academicSession: '2026-2027',
    startDate: '',
    endDate: '',
    description: '',
    status: 'Draft',
    participatingClasses: [], // Array of class IDs
    subjectConfigs: {} // { [classId]: { [subjectId]: { totalMarks: 100, passingMarks: 40 } } }
  };

  const [formData, setFormData] = useState(initialFormState);

  const statuses = ['Draft', 'Scheduled', 'Marks Entry', 'Processing', 'Published', 'Closed'];

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId || 'global';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    setExams(savedExams);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  };

  const saveToLocal = async (updatedExams) => {
    setExams(updatedExams);
    localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));
    try {
      const { saveCollection } = await import('../../utils/db');
      await saveCollection('schoolAdminExams', schoolId, updatedExams);
    } catch (e) {
      console.warn('Error syncing exams to backend:', e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassToggle = (classId) => {
    const classIdStr = classId.toString();
    const updated = formData.participatingClasses.includes(classIdStr)
      ? formData.participatingClasses.filter(id => id !== classIdStr)
      : [...formData.participatingClasses, classIdStr];
    
    // Initialize configs for the new class
    const newConfigs = { ...formData.subjectConfigs };
    if (!newConfigs[classIdStr]) {
      newConfigs[classIdStr] = {};
      // Auto-populate subjects for this class section
      const classSubjects = subjects.filter(s => s.classId?.toString() === classIdStr);
      classSubjects.forEach(s => {
        newConfigs[classIdStr][s.id.toString()] = { totalMarks: 100, passingMarks: 40 };
      });
    }

    setFormData(prev => ({
      ...prev,
      participatingClasses: updated,
      subjectConfigs: newConfigs
    }));
  };

  const handleSubjectMarkChange = (classId, subjectId, field, value) => {
    const classIdStr = classId.toString();
    const subjectIdStr = subjectId.toString();
    const val = value === '' ? '' : (parseFloat(value) || 0);

    setFormData(prev => ({
      ...prev,
      subjectConfigs: {
        ...prev.subjectConfigs,
        [classIdStr]: {
          ...prev.subjectConfigs[classIdStr],
          [subjectIdStr]: {
            ...prev.subjectConfigs[classIdStr]?.[subjectIdStr],
            [field]: val
          }
        }
      }
    }));
  };

  const openModal = (exam = null) => {
    setModalTab('basic');
    if (exam) {
      setFormData(exam);
      setEditingId(exam.id);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const parseDateOnly = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.toString().split('T')[0].trim();
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    return new Date(dateStr).getTime();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.examName || !formData.academicSession || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required basic fields.');
      return;
    }

    const startTimestamp = parseDateOnly(formData.startDate);
    const endTimestamp = parseDateOnly(formData.endDate);

    if (startTimestamp && endTimestamp && startTimestamp > endTimestamp) {
      toast.error('Start Date cannot be after End Date.');
      return;
    }

    if (formData.participatingClasses.length === 0) {
      toast.error('Please select at least one participating class.');
      return;
    }

    // Verify marks configurations
    let configError = false;
    formData.participatingClasses.forEach(cId => {
      const config = formData.subjectConfigs[cId] || {};
      Object.keys(config).forEach(subId => {
        const { totalMarks, passingMarks } = config[subId] || {};
        if (totalMarks === undefined || passingMarks === undefined || totalMarks <= 0 || passingMarks <= 0) {
          configError = true;
        }
        if (passingMarks > totalMarks) {
          configError = true;
        }
      });
    });

    if (configError) {
      toast.error('Invalid subject marks: total/passing marks must be positive, and passing marks cannot exceed total marks.');
      return;
    }

    const payload = {
      ...formData,
      schoolId: schoolId,
      updatedAt: new Date().toISOString(),
      updatedBy: authUser.name || 'School Admin'
    };

    if (editingId) {
      const updated = exams.map(ex => ex.id === editingId ? { ...payload, id: editingId } : ex);
      await saveToLocal(updated);
      toast.success('Exam structure updated successfully.');
      logSystemAction('Exam Configuration Modified', authUser.name || 'School Admin', authUser.role || 'School Admin', `Exam: ${formData.examName}`);
    } else {
      const newExam = { ...payload, id: Date.now(), createdAt: new Date().toISOString() };
      await saveToLocal([...exams, newExam]);
      toast.success('Exam structure created successfully.');
      logSystemAction('Exam Configuration Created', authUser.name || 'School Admin', authUser.role || 'School Admin', `Exam: ${formData.examName}`);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this exam? All associated marks and results configuration references will be lost.')) {
      const updated = exams.filter(ex => ex.id !== id);
      saveToLocal(updated);
      toast.success('Exam deleted successfully.');
    }
  };

  const filteredExams = exams.filter(ex => {
    const matchesSearch = ex.examName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSession = filterSession === 'All' || ex.academicSession === filterSession;
    const matchesStatus = filterStatus === 'All' || ex.status === filterStatus;
    return matchesSearch && matchesSession && matchesStatus;
  });

  const availableSessions = [...new Set(exams.map(e => e.academicSession))];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam structure Setup</h2>
          <p className="text-gray-500 text-sm mt-1">Configure classes and subjects weight limits for upcoming exams.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <ExportButtons tableId="export-table" filename="Exams_Structure" />
          <button 
            onClick={() => openModal()} 
            className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm text-xs"
          >
            <Plus size={16} />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-2.5 text-gray-400"><Search size={16} /></span>
          <input 
            type="text" 
            placeholder="Search exams by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none text-xs"
          />
        </div>
        
        <div className="w-full md:w-auto flex gap-2">
          <select 
            value={filterSession} 
            onChange={(e) => setFilterSession(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs font-semibold"
          >
            <option value="All">All Sessions</option>
            {availableSessions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white min-w-[120px] text-xs font-semibold"
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredExams.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-xs font-semibold">No exams configured matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                  <th className="p-4 font-bold">Exam Name</th>
                  <th className="p-4 font-bold">Session</th>
                  <th className="p-4 font-bold">Classes count</th>
                  <th className="p-4 font-bold">Timeline</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                {filteredExams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-darkBlue">{ex.examName}</td>
                    <td className="p-4 font-semibold text-gray-500">{ex.academicSession}</td>
                    <td className="p-4 font-bold text-gray-600">{(ex.participatingClasses || []).length} Classes</td>
                    <td className="p-4 font-medium text-gray-400">
                      {ex.startDate} to {ex.endDate}
                    </td>
                    <td className="p-4">
                      <span 
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          ex.status === 'Published' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          ex.status === 'Draft' ? 'bg-gray-50 text-gray-500 border border-gray-200' :
                          'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => navigate('/school-admin/marks-entry', { state: { examId: ex.id } })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex" title="Marks Entry">
                        <CheckSquare size={16} />
                      </button>
                      <button onClick={() => openModal(ex)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(ex.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center">
                <ClipboardList className="mr-2" size={18}/> 
                {editingId ? 'Edit Exam structure' : 'Create Exam structure'}
              </h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-gray-100 flex text-xs font-bold border-b border-gray-200">
              <button onClick={() => setModalTab('basic')} className={`flex-1 py-3 text-center ${modalTab === 'basic' ? 'bg-white text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500'}`}>1. Basic Information</button>
              <button onClick={() => setModalTab('classes')} className={`flex-1 py-3 text-center ${modalTab === 'classes' ? 'bg-white text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500'}`}>2. Classes participation</button>
              <button onClick={() => setModalTab('subjects')} className={`flex-1 py-3 text-center ${modalTab === 'subjects' ? 'bg-white text-darkBlue border-b-2 border-b-darkBlue' : 'text-gray-500'}`} disabled={formData.participatingClasses.length === 0}>3. Subject parameters</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {modalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Name</label>
                      <input required type="text" name="examName" value={formData.examName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" placeholder="e.g. Annual Examination 2026" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Academic Session</label>
                      <input required type="text" name="academicSession" value={formData.academicSession} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs bg-gray-50 text-gray-500" readOnly />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                      <input required type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                      <input required type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs bg-white">
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-xs h-20" placeholder="Exam parameters guidelines..."></textarea>
                  </div>
                </div>
              )}

              {modalTab === 'classes' && (
                <div className="space-y-4">
                  <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg flex items-center gap-1.5 font-semibold">
                    <Info size={14}/>
                    <span>Select which school classes participate in this examination.</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {classes.map(c => {
                      const idStr = c.id.toString();
                      const isChecked = formData.participatingClasses.includes(idStr);
                      return (
                        <label key={c.id} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-blue-50/50 border-darkBlue' : 'bg-white border-gray-200'}`}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleClassToggle(c.id)} className="rounded text-darkBlue focus:ring-darkBlue h-4 w-4" />
                          <span className="text-xs font-bold text-gray-700">{c.className} - {c.section}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {modalTab === 'subjects' && (
                <div className="space-y-6">
                  {formData.participatingClasses.map(cId => {
                    const cRow = classes.find(c => c.id.toString() === cId.toString());
                    if (!cRow) return null;
                    const classSubjects = subjects.filter(s => s.classId?.toString() === cId.toString());

                    return (
                      <div key={cId} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <h4 className="text-xs font-bold text-darkBlue uppercase border-b border-gray-200 pb-1.5">{cRow.className} - {cRow.section} Subjects</h4>
                        {classSubjects.length === 0 ? (
                          <div className="text-xs text-gray-400">No subjects assigned to this class configuration.</div>
                        ) : (
                          <div className="space-y-3">
                            {classSubjects.map(s => {
                              const config = formData.subjectConfigs[cId]?.[s.id.toString()] || { totalMarks: 100, passingMarks: 40 };
                              return (
                                <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                                  <span className="font-bold text-gray-700">{s.subjectName} ({s.subjectCode})</span>
                                  <div className="flex gap-2">
                                    <input type="number" placeholder="Total Marks" value={config.totalMarks ?? ''} onChange={(e) => handleSubjectMarkChange(cId, s.id, 'totalMarks', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none" min="1" />
                                    <input type="number" placeholder="Passing Marks" value={config.passingMarks ?? ''} onChange={(e) => handleSubjectMarkChange(cId, s.id, 'passingMarks', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none" min="1" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex justify-between border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-bold">Cancel</button>
                <div className="flex space-x-2">
                  {modalTab === 'classes' && <button type="button" onClick={() => setModalTab('basic')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">Back</button>}
                  {modalTab === 'subjects' && <button type="button" onClick={() => setModalTab('classes')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">Back</button>}
                  
                  {modalTab === 'basic' && <button type="button" onClick={() => setModalTab('classes')} className="px-4 py-2 bg-darkBlue text-white rounded-lg text-xs font-bold">Next</button>}
                  {modalTab === 'classes' && <button type="button" onClick={() => setModalTab('subjects')} className="px-4 py-2 bg-darkBlue text-white rounded-lg text-xs font-bold" disabled={formData.participatingClasses.length === 0}>Next</button>}
                  
                  {modalTab === 'subjects' && <button type="submit" className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold">Save Exam</button>}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
