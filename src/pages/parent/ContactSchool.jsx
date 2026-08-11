import React, { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Phone, Mail, MapPin, Plus, ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSchools, getCollection } from '../../utils/db';

const STORAGE_KEY = 'parentSupportConversations';

const ContactSchool = () => {
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const parentId  = authUser.id?.toString()   || '';
  const schoolId  = authUser.schoolId?.toString() || '';

  const [view, setView] = useState('list'); // 'list' | 'new' | 'conversation'
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText]        = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [schoolContact, setSchoolContact] = useState({
    email: 'info@school.com',
    phone: '+92 300 1234567',
    address: 'Main Campus, Sector H-8, Islamabad'
  });

  const [formData, setFormData] = useState({ subject: '', message: '' });

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const all = await getCollection('parentSupportConversations');
      const filtered = all.filter(c => c.parentId?.toString() === parentId && c.schoolId?.toString() === schoolId);
      setConversations(filtered);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Error fetching parent support conversations:', err);
      // Fallback
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = all.filter(c => c.parentId?.toString() === parentId && c.schoolId?.toString() === schoolId);
      setConversations(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [parentId, schoolId]);

  const saveAllLocal = (updatedConv) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const others = all.filter(
      c => !(c.parentId?.toString() === parentId && c.schoolId?.toString() === schoolId)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...updatedConv]));
  };

  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const schools = await getSchools();
        const mySchool = schools.find(s => s.id?.toString() === schoolId);
        if (mySchool) {
          setSchoolContact({
            email: mySchool.email || 'info@school.com',
            phone: mySchool.phone || '+92 300 1234567',
            address: mySchool.address || 'Main Campus, Sector H-8, Islamabad'
          });
        }
      } catch (err) {
        console.error('Error loading school info:', err);
      }
    };
    
    loadSchoolInfo();
    loadAll();
  }, [loadAll, schoolId]);

  useEffect(() => {
    if (selectedConv) {
      const refreshed = conversations.find(c => c.id === selectedConv.id);
      if (refreshed) setSelectedConv(refreshed);
    }
  }, [conversations]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    const users   = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    const parent  = users.find(u => u.id?.toString() === parentId) || authUser;
    const student = users.find(u =>
      u.role?.toLowerCase() === 'student' &&
      (u.id?.toString() === parent.studentId?.toString() ||
       u.parentId?.toString() === parentId ||
       (parent.childIds || []).map(c => c.toString()).includes(u.id?.toString()))
    );

    const now = new Date().toISOString();
    const convId = `conv_${Date.now()}`;
    const newConv = {
      id:           convId,
      schoolId,
      parentId,
      parentName:   parent.name || authUser.name || 'Parent',
      studentId:    student?.id?.toString() || '',
      studentName:  student?.name || 'N/A',
      subject:      formData.subject.trim(),
      status:       'New',
      createdAt:    now,
      updatedAt:    now,
      messages: [
        {
          id:         `msg_${Date.now()}`,
          senderId:   parentId,
          senderRole: 'parent',
          senderName: parent.name || authUser.name || 'Parent',
          message:    formData.message.trim(),
          createdAt:  now
        }
      ]
    };

    try {
      const updated = [newConv, ...conversations];
      setConversations(updated);
      saveAllLocal(updated);

      toast.success('Your message has been sent to the school administration.');
      setFormData({ subject: '', message: '' });
      setView('list');
    } catch (err) {
      console.error('Error sending query:', err);
      toast.error('Failed to send support request.');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const now = new Date().toISOString();
    const newMsg = {
      id:         `msg_${Date.now()}`,
      senderId:   parentId,
      senderRole: 'parent',
      senderName: authUser.name || 'Parent',
      message:    replyText.trim(),
      createdAt:  now
    };

    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMsg],
      updatedAt: now
    };

    try {
      const updated = conversations.map(c => {
        if (c.id !== selectedConv.id) return c;
        return updatedConv;
      });

      setConversations(updated);
      saveAllLocal(updated);
      setReplyText('');
      toast.success('Follow-up sent.');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      'New':         'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved':    'bg-green-100 text-green-800'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const statusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle size={14} className="text-green-600" />;
    if (status === 'In Progress') return <Clock size={14} className="text-yellow-600" />;
    return <AlertCircle size={14} className="text-blue-600" />;
  };

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  const renderNewForm = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('list')}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">New Support Request</h2>
          <p className="text-gray-500 text-sm mt-1">Submit a new inquiry to the school administration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Phone size={18} /></div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Phone Support</span>
              <strong className="text-gray-800 font-semibold mt-0.5 block">{schoolContact.phone}</strong>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600"><Mail size={18} /></div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Email Address</span>
              <strong className="text-gray-800 font-semibold mt-0.5 block">{schoolContact.email}</strong>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600"><MapPin size={18} /></div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Campus Address</span>
              <strong className="text-gray-800 font-semibold mt-0.5 block leading-normal">{schoolContact.address}</strong>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-darkBlue px-8 py-5 text-white flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/25">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Send an Instant Message</h3>
              <p className="text-blue-200 text-[10px] uppercase font-semibold">Typical response within 24 hours.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject / Query Topic</label>
              <input
                required
                type="text"
                name="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="E.g., Fee structure queries, leaves, credentials..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detailed Message</label>
              <textarea
                required
                name="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="5"
                placeholder="Explain your inquiry in detail..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs resize-none"
              />
            </div>
            <div className="pt-4 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                className="bg-darkBlue hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2"
              >
                <Send size={14} />
                <span>Submit Query</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderConversation = () => {
    if (!selectedConv) return null;
    const adminReplied = selectedConv.messages.some(m => m.senderRole === 'schoolAdmin');
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('list'); setSelectedConv(null); }}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{selectedConv.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span>Started {fmt(selectedConv.createdAt)}</span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(selectedConv.status)}`}>
                {statusIcon(selectedConv.status)} {selectedConv.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
            {selectedConv.messages.map(msg => {
              const isMe = msg.senderRole === 'parent';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-1 px-1">
                    {isMe ? 'You' : 'School Admin'} • {fmt(msg.createdAt)}
                  </span>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    isMe
                      ? 'bg-darkBlue text-white rounded-br-none shadow-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              );
            })}
            {!adminReplied && (
              <p className="text-center text-xs text-gray-400 pt-2">
                Waiting for the school administration to reply…
              </p>
            )}
          </div>

          {selectedConv.status !== 'Resolved' && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <form onSubmit={handleReply} className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a follow-up message…"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-darkBlue hover:bg-blue-900 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Send size={13} />
                  Send
                </button>
              </form>
            </div>
          )}
          {selectedConv.status === 'Resolved' && (
            <div className="border-t border-gray-100 bg-green-50 p-4 text-center text-xs text-green-700 font-medium">
              ✅ This conversation has been marked as Resolved by the school.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contact School</h2>
          <p className="text-gray-500 text-sm mt-1">View your support requests and school replies.</p>
        </div>
        <button
          onClick={() => setView('new')}
          className="bg-darkBlue hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={14} />
          New Request
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 flex justify-center items-center gap-2">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-darkBlue"></span>
          Loading requests...
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm font-medium">No support requests yet.</p>
          <p className="text-gray-400 text-xs mt-1">Click "New Request" to contact the school administration.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const hasAdminReply = conv.messages.some(m => m.senderRole === 'schoolAdmin');
            return (
              <div
                key={conv.id}
                onClick={() => { setSelectedConv(conv); setView('conversation'); }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-darkBlue/20 hover:shadow-md transition-all flex justify-between items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{conv.subject}</h4>
                    {hasAdminReply && (
                      <span className="text-[9px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Reply Received
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{lastMsg?.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{fmt(conv.updatedAt)}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge(conv.status)}`}>
                  {conv.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (view === 'new')          return renderNewForm();
  if (view === 'conversation') return renderConversation();
  return renderList();
};

export default ContactSchool;
