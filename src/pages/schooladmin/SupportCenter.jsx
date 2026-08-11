import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCollection, saveCollection } from '../../utils/db';

const STORAGE_KEY = 'parentSupportConversations';
const STATUS_OPTIONS = ['New', 'In Progress', 'Resolved'];

const SupportCenterSA = () => {
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const schoolId = authUser.schoolId?.toString() || '';

  const [conversations, setConversations]   = useState([]);
  const [selectedConv,  setSelectedConv]    = useState(null);
  const [replyText,     setReplyText]       = useState('');
  const [isLoading,     setIsLoading]       = useState(true);

  // Fetch support conversations
  const fetchConversations = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsLoading(true);
      const all = await getCollection('parentSupportConversations');
      const filtered = all.filter(c => c.schoolId?.toString() === schoolId);
      const sorted = filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      setConversations(sorted);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      
      if (showToast) toast.success('Support requests refreshed');
    } catch (err) {
      console.error('Error fetching support conversations:', err);
      // Fallback
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = all.filter(c => c.schoolId?.toString() === schoolId);
      setConversations(filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Keep selectedConv in sync when conversations list updates
  useEffect(() => {
    if (selectedConv) {
      const fresh = conversations.find(c => c.id === selectedConv.id);
      if (fresh) setSelectedConv(fresh);
    }
  }, [conversations]); // eslint-disable-line

  // ── Admin Reply ────────────────────────────────────────────────────────────
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const now = new Date().toISOString();
    const newMsg = {
      id:         `msg_${Date.now()}`,
      senderId:   authUser.id?.toString() || 'schoolAdmin',
      senderRole: 'schoolAdmin',
      senderName: authUser.name || 'School Admin',
      message:    replyText.trim(),
      createdAt:  now
    };

    const newStatus = selectedConv.status === 'New' ? 'In Progress' : selectedConv.status;
    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMsg],
      updatedAt: now,
      status: newStatus
    };

    try {
      const updated = conversations.map(c => {
        if (c.id !== selectedConv.id) return c;
        return updatedConv;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      const all = await getCollection('parentSupportConversations');
      const otherSchools = all.filter(c => c.schoolId?.toString() !== schoolId);
      const updatedAll = [...otherSchools, ...updated];

      await saveCollection('parentSupportConversations', null, updatedAll);

      setConversations(updated);
      setReplyText('');
      toast.success('Reply sent to parent.');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply.');
    }
  };

  // ── Status Change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!selectedConv) return;
    const now = new Date().toISOString();
    const updatedConv = {
      ...selectedConv,
      status: newStatus,
      updatedAt: now
    };

    try {
      const updated = conversations.map(c => {
        if (c.id !== selectedConv.id) return c;
        return updatedConv;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      const all = await getCollection('parentSupportConversations');
      const otherSchools = all.filter(c => c.schoolId?.toString() !== schoolId);
      const updatedAll = [...otherSchools, ...updated];

      await saveCollection('parentSupportConversations', null, updatedAll);

      setConversations(updated);
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
    }
  };

  // ── Status helpers ─────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      'New':         'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Resolved':    'bg-green-100 text-green-800'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const statusIcon = (status) => {
    if (status === 'Resolved')    return <CheckCircle size={13} className="text-green-600" />;
    if (status === 'In Progress') return <Clock size={13} className="text-yellow-600" />;
    return <AlertCircle size={13} className="text-blue-600" />;
  };

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  const refresh = () => {
    fetchConversations(true);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">

      {/* ── Left: Conversation List ───────────────────────────────────────── */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-darkBlue">Parent Support Requests</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={refresh}
            title="Refresh"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-darkBlue"></span>
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3">
              <MessageSquare size={36} className="text-gray-200" />
              <p>No parent support requests yet.</p>
              <p className="text-xs">They will appear here once a parent submits a query.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              const lastMsg    = conv.messages[conv.messages.length - 1];
              return (
                <div
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv); setReplyText(''); }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/60 border-l-4 border-l-darkBlue' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 text-xs truncate">{conv.subject}</h4>
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge(conv.status)}`}>
                      {statusIcon(conv.status)} {conv.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-darkBlue">{conv.parentName}</p>
                  {conv.studentName && conv.studentName !== 'N/A' && (
                    <p className="text-[10px] text-gray-400">Student: {conv.studentName}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 truncate">{lastMsg?.message}</p>
                  <p className="text-[9px] text-gray-300 mt-1">{fmt(conv.updatedAt)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Conversation Detail ────────────────────────────────────── */}
      <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-lg font-bold text-darkBlue mb-0.5">{selectedConv.subject}</h2>
                  <div className="text-xs text-gray-500 space-x-3">
                    <span>From: <strong className="text-gray-700">{selectedConv.parentName}</strong></span>
                    {selectedConv.studentName && selectedConv.studentName !== 'N/A' && (
                      <span>Student: <strong className="text-gray-700">{selectedConv.studentName}</strong></span>
                    )}
                    <span>{fmt(selectedConv.createdAt)}</span>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 font-medium">Status:</span>
                  <select
                    value={selectedConv.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${statusBadge(selectedConv.status)}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedConv.messages.map(msg => {
                const isParent = msg.senderRole === 'parent';
                return (
                  <div key={msg.id} className={`flex flex-col ${isParent ? 'items-start' : 'items-end'}`}>
                    <span className="text-[10px] text-gray-400 mb-1 px-1">
                      {isParent ? `${msg.senderName} (Parent)` : `${msg.senderName} (School Admin)`} • {fmt(msg.createdAt)}
                    </span>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      isParent
                        ? 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                        : 'bg-darkBlue text-white rounded-br-none shadow-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              {selectedConv.status === 'Resolved' ? (
                <div className="text-center text-sm text-green-600 font-medium py-2">
                  ✅ Conversation resolved. Change status to reply again.
                </div>
              ) : (
                <form onSubmit={handleReply} className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply to the parent…"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-greenAccent hover:bg-green-600 disabled:bg-green-300 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <Send size={16} />
                    Send Reply
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
            <MessageSquare size={52} className="mb-4" />
            <p className="text-gray-400 font-medium">Select a conversation to view</p>
            <p className="text-gray-300 text-xs mt-1">Parent requests appear in the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenterSA;
