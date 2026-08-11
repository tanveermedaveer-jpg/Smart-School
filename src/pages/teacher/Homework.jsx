import React, { useState, useEffect } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { logSystemAction } from '../../utils/logger';

const Homework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: '', classId: '', subjectId: '', dueDate: '', description: '' });

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const hw = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
    // Filter to show only homework created by this teacher
    setHomeworkList(hw.filter(h => h.teacherId?.toString() === authUser.id?.toString()));

    const savedAssignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
    const myAssignments = savedAssignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
    const myClassIds = [...new Set(myAssignments.map(a => a.classId?.toString()))];
    const mySubjectIds = [...new Set(myAssignments.map(a => a.subjectId?.toString()))];

    const savedClasses = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    setClasses(savedClasses.filter(c => myClassIds.includes(c.id.toString())));

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects.filter(s => mySubjectIds.includes(s.id.toString())));
  }, [authUser.id]);

  const saveToLocal = (updated) => {
    // We only have the teacher's homework in `homeworkList`. We need to merge it back with other teachers' homework.
    const allHw = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
    const otherHw = allHw.filter(h => h.teacherId?.toString() !== authUser.id?.toString());
    const newAllHw = [...otherHw, ...updated];
    localStorage.setItem('teacherHomework', JSON.stringify(newAllHw));
    setHomeworkList(updated);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      saveToLocal(homeworkList.map(h => h.id === formData.id ? { ...formData, teacherId: authUser.id } : h));
      toast.success('Homework updated successfully');
    } else {
      saveToLocal([...homeworkList, { ...formData, id: Date.now(), teacherId: authUser.id, dateAssigned: new Date().toISOString().split('T')[0] }]);
      toast.success('Homework assigned successfully');
      logSystemAction('Homework Assigned', authUser.name || 'Teacher', authUser.role || 'Teacher', formData.title);
    }
    setIsModalOpen(false);
    setFormData({ id: null, title: '', classId: '', subjectId: '', dueDate: '', description: '' });
  };

  const handleEdit = (hw) => {
    setFormData(hw);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this homework?')) {
      saveToLocal(homeworkList.filter(h => h.id !== id));
      toast.success('Homework deleted');
    }
  };

  const getClassName = (id) => {
    const cls = classes.find(c => c.id.toString() === id?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id?.toString());
    return sub ? sub.subjectName : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Homework</h2>
          <p className="text-gray-500 text-sm mt-1">Assign and manage student homework.</p>
        </div>
        <div className="flex items-center space-x-3">
        <ExportButtons tableId="export-table" filename="Homework" />
        <button onClick={() => { setFormData({ id: null, title: '', classId: '', subjectId: '', dueDate: '', description: '' }); setIsModalOpen(true); }} className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={20} />
          <span>Assign Homework</span>
        </button>
      </div>
</div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {homeworkList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No homework assigned yet. Click "Assign Homework" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Class</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Assigned On</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {homeworkList.map((hw) => (
                  <tr key={hw.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-darkBlue">{hw.title}</td>
                    <td className="p-4">{getClassName(hw.classId)}</td>
                    <td className="p-4">{getSubjectName(hw.subjectId)}</td>
                    <td className="p-4">{hw.dateAssigned}</td>
                    <td className="p-4 text-red-600 font-medium">{hw.dueDate}</td>
                    <td className="p-4 flex justify-center space-x-2">
                      <button onClick={() => handleEdit(hw)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(hw.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="Delete">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-darkBlue px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-semibold">{formData.id ? 'Edit Homework' : 'Assign Homework'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Homework Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select required name="classId" value={formData.classId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select required name="subjectId" value={formData.subjectId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none bg-white">
                    <option value="">Select Subject</option>
                    {subjects.filter(s => {
                      const assignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
                      return assignments.some(a => 
                        a.teacherId?.toString() === authUser.id?.toString() &&
                        a.subjectId?.toString() === s.id?.toString() &&
                        (formData.classId === '' || a.classId?.toString() === formData.classId?.toString())
                      );
                    }).map(s => (
                      <option key={s.id} value={s.id}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-greenAccent focus:border-greenAccent outline-none resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-darkBlue text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">{formData.id ? 'Save Changes' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homework;
