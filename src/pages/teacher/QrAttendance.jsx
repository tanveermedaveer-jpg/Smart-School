import React, { useState, useEffect } from 'react';
import { QrCode, Users, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BASE_URL } from '../../utils/db';
// Using Node.js HTTP endpoints for session handling

const QrAttendance = () => {
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  
  // Load classes/subjects assigned to this teacher
  const assignments = JSON.parse(localStorage.getItem('schoolAdminTeacherAssignments') || '[]');
  const myAssignments = assignments.filter(a => a.teacherId?.toString() === authUser.id?.toString());
  
  const classesList = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
  const subjectsList = JSON.parse(localStorage.getItem('schoolAdminSubjects') || '[]');

  const assignedOptions = myAssignments.map(a => {
    const cls = classesList.find(c => c.id.toString() === a.classId?.toString());
    const sub = subjectsList.find(s => s.id.toString() === a.subjectId?.toString());
    return {
      assignmentId: a.id,
      classId: a.classId,
      subjectId: a.subjectId,
      label: cls ? `${cls.className} - ${cls.section} (${sub?.subjectName || 'General'})` : 'Unknown'
    };
  }).filter(o => o.label !== 'Unknown');

  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [qrSession, setQrSession] = useState(null);
  const [scannedList, setScannedList] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const handleGenerateQR = async () => {
    if (!selectedOptionId) {
      toast.error('Please select an assigned class & subject.');
      return;
    }
    
    const selected = assignedOptions.find(o => o.assignmentId === selectedOptionId);
    if (!selected) return;

    const sessionId = `qr_session_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes
    
    const sessionData = {
      id: sessionId,
      teacherId: authUser.id,
      teacherName: authUser.name || 'Teacher',
      classId: selected.classId,
      subjectId: selected.subjectId,
      className: selected.label,
      schoolId: authUser.schoolId || 'global',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      scannedStudents: []
    };
    
    try {
      const token = sessionStorage.getItem('jwtToken');
      const res = await fetch(`${BASE_URL}/qr-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });
      
      const localSessions = JSON.parse(localStorage.getItem('qrSessions') || '[]');
      localStorage.setItem('qrSessions', JSON.stringify([sessionData, ...localSessions.filter(s => s.id !== sessionId)]));

      setQrSession(sessionData);
      setScannedList([]);
      setSecondsLeft(120);
      toast.success('QR Code generated! Valid for 2 minutes.');
    } catch (err) {
      console.error(err);
      const localSessions = JSON.parse(localStorage.getItem('qrSessions') || '[]');
      localStorage.setItem('qrSessions', JSON.stringify([sessionData, ...localSessions.filter(s => s.id !== sessionId)]));

      setQrSession(sessionData);
      setScannedList([]);
      setSecondsLeft(120);
      toast.success('QR Code generated! Valid for 2 minutes.');
    }
  };

  useEffect(() => {
    if (!qrSession?.id) return;
    
    const fetchSession = async () => {
      try {
        const token = sessionStorage.getItem('jwtToken');
        const res = await fetch(`${BASE_URL}/qr-sessions/${qrSession.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setScannedList(data.scannedStudents || []);
          return;
        }
      } catch (err) {}

      const localSessions = JSON.parse(localStorage.getItem('qrSessions') || '[]');
      const currentLoc = localSessions.find(s => s.id === qrSession.id);
      if (currentLoc) {
        setScannedList(currentLoc.scannedStudents || []);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    
    return () => clearInterval(interval);
  }, [qrSession?.id]);

  useEffect(() => {
    if (!qrSession?.expiresAt) return;
    
    const interval = setInterval(() => {
      const remainingMs = new Date(qrSession.expiresAt) - Date.now();
      if (remainingMs <= 0) {
        setSecondsLeft(0);
        clearInterval(interval);
      } else {
        setSecondsLeft(Math.round(remainingMs / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [qrSession?.expiresAt]);

  const qrUrl = qrSession && secondsLeft > 0
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrSession.id)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">QR Code Attendance</h2>
        <p className="text-gray-500 text-sm mt-1">Generate a dynamic, secure QR Code for students to scan and mark their attendance instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Generator Controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 md:col-span-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center">
            <QrCode className="mr-2 text-greenAccent animate-pulse" size={20} />
            Setup Session
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Assignment</label>
            <select
              value={selectedOptionId}
              onChange={(e) => {
                setSelectedOptionId(e.target.value);
                setQrSession(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none appearance-none bg-white text-sm"
            >
              <option value="">-- Choose Assigned Class & Subject --</option>
              {assignedOptions.map(c => (
                <option key={c.assignmentId} value={c.assignmentId}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateQR}
            disabled={!selectedOptionId}
            className="w-full bg-darkBlue hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            <QrCode size={16} />
            <span>Generate QR Code</span>
          </button>

          {qrSession && secondsLeft > 0 && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100/50 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <Clock size={14} className="text-emerald-600 animate-spin" />
                <span>Time Remaining: {secondsLeft} seconds</span>
              </div>
              <p>Students must scan this QR code on their dashboard before the timer expires.</p>
            </div>
          )}

          {qrSession && secondsLeft === 0 && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100/50 text-xs flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>This QR Code session has expired. Please generate a new one.</span>
            </div>
          )}
        </div>

        {/* QR Display */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center md:col-span-1 min-h-[350px]">
          {qrUrl ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl shadow-inner inline-block">
                <img src={qrUrl} alt="QR Code" className="w-56 h-56 object-contain" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scan Me</p>
            </div>
          ) : (
            <div className="text-slate-300 flex flex-col items-center">
              <QrCode size={64} className="mb-4" />
              <p className="text-gray-400 text-sm font-medium">No active QR Code</p>
              <p className="text-gray-300 text-xs mt-1 px-4">Select a class and click generate to show code here.</p>
            </div>
          )}
        </div>

        {/* Live List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:col-span-1 min-h-[350px]">
          <h3 className="text-base font-bold text-slate-800 flex items-center justify-between mb-4">
            <span className="flex items-center"><Users className="mr-2 text-blue-500" size={20} /> Live Scans</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold">{scannedList.length}</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2">
            {scannedList.length > 0 ? (
              scannedList.map((stud, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-greenAccent/10 text-greenAccent font-bold flex items-center justify-center uppercase text-[10px]">
                      {stud.studentName?.charAt(0)}
                    </div>
                    <span className="text-slate-800">{stud.studentName}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(stud.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-300 py-8 select-none">
                <Users size={36} className="mb-2" />
                <p className="text-xs text-gray-400 font-medium">Waiting for scans...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default QrAttendance;
