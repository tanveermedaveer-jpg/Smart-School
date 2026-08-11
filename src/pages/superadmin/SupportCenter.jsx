import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCollection, saveCollection } from '../../utils/db';

const SupportCenter = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const list = await getCollection('supportTickets');
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setTickets(list);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      toast.error('Failed to load support tickets from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
      await saveCollection('supportTickets', null, updated);
      setTickets(updated);

      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (err) {
      console.error('Error changing ticket status:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply = {
      id: Date.now().toString(),
      sender: 'Super Admin',
      text: replyText,
      timestamp: new Date().toLocaleString()
    };

    try {
      const updatedReplies = [...(selectedTicket.replies || []), newReply];
      const newStatus = selectedTicket.status === 'Open' ? 'In Progress' : selectedTicket.status;

      const updated = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            replies: updatedReplies,
            status: newStatus
          };
        }
        return t;
      });

      await saveCollection('supportTickets', null, updated);
      setTickets(updated);

      const updatedTicket = updated.find(t => t.id === selectedTicket.id);
      setSelectedTicket(updatedTicket);
      setReplyText('');
      toast.success('Reply sent successfully');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply.');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm('Are you absolutely sure you want to permanently delete this Support Ticket and all of its replies? This action cannot be undone.')) {
      try {
        const updated = tickets.filter(t => t.id !== id);
        await saveCollection('supportTickets', null, updated);

        setTickets(updated);
        if (selectedTicket && selectedTicket.id === id) {
          setSelectedTicket(null);
        }
        toast.success('Ticket permanently deleted.');
      } catch (err) {
        console.error('Error deleting ticket:', err);
        toast.error('Failed to delete ticket.');
      }
    }
  };

  const filteredTickets = tickets.filter(t => {
    const subjectStr = t.subject ? t.subject.toString() : '';
    const schoolNameStr = t.schoolName ? t.schoolName.toString() : '';
    const statusStr = t.status ? t.status.toString() : '';

    const matchesSearch = 
      subjectStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      schoolNameStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || statusStr === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 font-bold';
      case 'Medium': return 'text-yellow-600 font-bold';
      case 'Low': return 'text-green-600 font-bold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Panel: Ticket List */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-darkBlue mb-4">Support Tickets</h2>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm flex justify-center items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-darkBlue"></span>
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No tickets found.
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b border-gray-55 cursor-pointer hover:bg-gray-50 transition-colors relative group ${selectedTicket?.id === ticket.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-800 text-sm truncate pr-8">{ticket.subject}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2 truncate">{ticket.schoolName}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className={getPriorityColor(ticket.priority)}>{ticket.priority} Priority</span>
                  <span className="text-gray-400">{ticket.date}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTicket(ticket.id);
                  }}
                  className="absolute right-4 bottom-2.5 p-1.5 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Support Ticket"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Ticket Details */}
      <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-darkBlue mb-1">{selectedTicket.subject}</h2>
                  <div className="text-sm text-gray-500">From: {selectedTicket.schoolName} ({selectedTicket.category})</div>
                </div>
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-greenAccent outline-none ${getStatusColor(selectedTicket.status)}`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                    title="Delete Support Ticket"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">Original Message</span>
                  <span className="text-xs text-gray-500">{selectedTicket.date}</span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                <div className="text-center text-gray-400 text-sm mt-8">No replies yet. Start the conversation below.</div>
              ) : (
                selectedTicket.replies.map(reply => (
                  <div key={reply.id} className={`flex flex-col ${reply.sender === 'Super Admin' ? 'items-end' : 'items-start'}`}>
                    <div className="text-xs text-gray-500 mb-1 px-1">{reply.sender} • {reply.timestamp}</div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      reply.sender === 'Super Admin' 
                        ? 'bg-darkBlue text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              {selectedTicket.status === 'Closed' ? (
                <div className="text-center text-gray-500 text-sm py-2">This ticket is closed. You cannot reply.</div>
              ) : (
                <form onSubmit={handleReply} className="flex space-x-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-greenAccent focus:border-transparent outline-none"
                  />
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="bg-greenAccent hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Send size={18} />
                    <span>Reply</span>
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
            <MessageSquare size={48} className="mb-4 text-gray-300" />
            <p>Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;
