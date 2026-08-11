import React, { useState, useEffect } from 'react';
import { FileText, Calendar, AlertCircle } from 'lucide-react';

const Homework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const myChildren = users.filter(u => 
      u.role?.toLowerCase() === 'student' && 
      (u.parentId?.toString() === authUser.id?.toString() || 
       (authUser.childIds || []).map(cid => cid.toString()).includes(u.id?.toString()))
    );

    setChildren(myChildren);
    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id?.toString() || '');
    }

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  }, [authUser.id]);

  useEffect(() => {
    if (selectedChildId) {
      const users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
      const child = users.find(u => u.id?.toString() === selectedChildId);
      if (child) {
        const hw = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
        const classHw = hw.filter(h => h.classId?.toString() === child.classId?.toString());
        setHomeworkList(classHw);
      }
    } else {
      setHomeworkList([]);
    }
  }, [selectedChildId]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id?.toString() === id?.toString());
    return sub ? sub.subjectName : 'General Study';
  };

  const getClassName = (classId) => {
    const classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
    const cls = classes.find(c => c.id?.toString() === classId?.toString());
    return cls ? `${cls.className} - ${cls.section}` : 'Unknown';
  };

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 text-xs">
        <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold">No children profiles are linked to your parent account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assigned Homework Assignments</h2>
          <p className="text-gray-500 text-sm mt-1">Review current homework instructions, class schedules, and deadlines for your children.</p>
        </div>
      </div>

      {/* Select Child Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id.toString())}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${selectedChildId === child.id.toString() ? 'bg-white text-darkBlue shadow' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {child.name} ({getClassName(child.classId)})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {homeworkList.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 border-dashed">
            No homework assigned to this student profile.
          </div>
        ) : (
          homeworkList.map((hw) => (
            <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {getSubjectName(hw.subjectId)}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center font-bold uppercase">
                  <Calendar size={12} className="mr-1" />
                  {hw.dateAssigned}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">{hw.title}</h3>
              <p className="text-gray-500 text-xs flex-grow mb-4 whitespace-pre-wrap leading-relaxed">{hw.description}</p>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto font-bold uppercase text-[10px]">
                <span className="text-red-500 flex items-center">
                  Due: {hw.dueDate}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Homework;
