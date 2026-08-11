import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Plus, Edit, Trash2, X, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const Examinations = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    examName: '',
    date: '',
    classId: '',
    subjectId: '',
    maxMarks: '100'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const savedExams = JSON.parse(localStorage.getItem('schoolAdminExams') || '[]');
    setExams(savedExams);

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses);

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  }, []);

  const saveToLocal = (updatedExams) => {
    setExams(updatedExams);
    localStorage.setItem('schoolAdminExams', JSON.stringify(updatedExams));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = exams.map(e => e.id === editingId ? { ...formData, id: editingId } : e);
      saveToLocal(updated);
      toast.success('Exam updated successfully');
    } else {
      const newExam = { ...formData, id: Date.now() };
      saveToLocal([...exams, newExam]);
      toast.success('Exam created successfully');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      saveToLocal(exams.filter(e => e.id !== id));
      toast.success('Exam deleted');
    }
  };

  const openModal = (exam = null) => {
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

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Examinations</h2>
          <p className="text-gray-500 text-sm mt-1">Schedule and manage examinations.</p>
        </div>
        <div className="flex items-center space-x-3">
        <ExportButtons tableId="export-table" filename="Examinations" />
        <button onClick={() => openModal()} className="bg-greenAccent hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>Add Exam</span>
        </button>
      </div>
</div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {exams.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No exams scheduled yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Exam Name</th>
                  <th className="p-4 font-semibold">Class</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Max Marks</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-darkBlue flex items-center space-x-2">
                      <ClipboardList size={16} className="text-gray-400" />
                      <span>{exam.examName}</span>
                    </td>
                    <td className="p-4">{getClassName(exam.classId)}</td>
                    <td className="p-4">{getSubjectName(exam.subjectId)}</td>
                    <td className="p-4">{exam.date}</td>
                    <td className="p-4">{exam.maxMarks}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openModal(exam)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Exam' : 'Schedule Exam'}</h3>
              <button onClick={closeModal} className="text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name (e.g. Mid Term)</label>
                <input required type="text" name="examName" value={formData.examName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select required name="classId" value={formData.classId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select required name="subjectId" value={formData.subjectId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                  <option value="">-- Select Subject --</option>
                  {subjects.filter(s => formData.classId === '' || s.classId === formData.classId).map(s => (
                    <option key={s.id} value={s.id}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                  <input required type="number" min="1" name="maxMarks" value={formData.maxMarks} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Save Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Examinations;
