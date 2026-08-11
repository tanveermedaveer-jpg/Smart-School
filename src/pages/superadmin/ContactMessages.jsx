import React, { useEffect, useState } from 'react';
import ExportButtons from '../../components/ExportButtons';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    setMessages(data);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Delete this message?')) {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      localStorage.setItem('contactMessages', JSON.stringify(updated));
      toast.success('Message deleted');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Contact Messages</h2>
      
      <ExportButtons tableId="export-table" filename="Contact Messages" /></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No contact messages found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="export-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4 font-semibold w-1/6">Date</th>
                  <th className="p-4 font-semibold w-1/6">Sender</th>
                  <th className="p-4 font-semibold w-1/6">Email</th>
                  <th className="p-4 font-semibold w-2/6">Message</th>
                  <th className="p-4 font-semibold w-1/6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {messages.map((msg) => (
                  <tr key={msg.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(msg.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-darkBlue">{msg.name}</td>
                    <td className="p-4">{msg.email}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800 mb-1">{msg.subject}</div>
                      <p className="text-gray-600 line-clamp-2">{msg.message}</p>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(msg.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Delete">
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
    </div>
  );
};

export default ContactMessages;
