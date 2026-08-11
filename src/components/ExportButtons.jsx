import React from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToCSV, exportToPDF, printPage } from '../utils/exportUtils';

const ExportButtons = ({ tableId, filename, title }) => {
  return (
    <div className="flex space-x-2 no-print">
      <button 
        onClick={() => exportToPDF(tableId, filename, title || filename)}
        className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-100"
        title="Download PDF"
      >
        <Download size={16} />
        <span className="hidden sm:inline">PDF</span>
      </button>
      
      <button 
        onClick={() => exportToCSV(tableId, filename)}
        className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-100"
        title="Export Excel"
      >
        <FileSpreadsheet size={16} />
        <span className="hidden sm:inline">Excel</span>
      </button>
      
      <button 
        onClick={printPage}
        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200"
        title="Print"
      >
        <Printer size={16} />
        <span className="hidden sm:inline">Print</span>
      </button>
    </div>
  );
};

export default ExportButtons;
