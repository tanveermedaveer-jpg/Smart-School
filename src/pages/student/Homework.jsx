import React, { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';

const Homework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

  useEffect(() => {
    const hw = JSON.parse(localStorage.getItem('teacherHomework') || '[]');
    // Filter to show only homework for this student's class
    setHomeworkList(hw.filter(h => !authUser.classId || h.classId?.toString() === authUser.classId?.toString()));

    const savedSubjects = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');
    setSubjects(savedSubjects);
  }, [authUser.classId]);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id.toString() === id?.toString());
    return sub ? sub.subjectName : 'Unknown Subject';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Homework</h2>
          <p className="text-gray-500 text-sm mt-1">View your assigned homework and tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homeworkList.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No homework assigned at the moment.
          </div>
        ) : (
          homeworkList.map((hw) => (
            <div key={hw.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {getSubjectName(hw.subjectId)}
                </span>
                <span className="text-xs text-gray-400 flex items-center">
                  <Calendar size={12} className="mr-1" />
                  {hw.dateAssigned}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{hw.title}</h3>
              <p className="text-gray-600 text-sm flex-grow mb-4 whitespace-pre-wrap">{hw.description}</p>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                <span className="text-sm font-medium text-red-500 flex items-center">
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
