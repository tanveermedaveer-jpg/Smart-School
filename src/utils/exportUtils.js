import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const exportToCSV = (tableId, filename) => {
  const table = document.getElementById(tableId);
  if (!table) {
    toast.error('Could not find data to export.');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  
  const csvData = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    let rowData = cells.map(cell => {
      let text = cell.innerText || cell.textContent;
      text = text.replace(/"/g, '""');
      text = text.replace(/(\r\n|\n|\r)/gm, ' ');
      return `"${text.trim()}"`;
    });
    
    return rowData.join(',');
  }).join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success('Excel (CSV) exported successfully.');
};

export const exportToPDF = (tableId, filename, title) => {
  try {
    const table = document.getElementById(tableId);
    if (!table) {
      toast.error('Could not find data table to export.');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title || filename || 'Report', 40, 40);

    let schoolName = '';
    try {
      const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
      schoolName = authUser.schoolName || authUser.name || '';
    } catch (e) {}

    if (schoolName) {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${schoolName} | Generated: ${new Date().toLocaleDateString()}`, 40, 54);
    }

    autoTable(doc, {
      html: `#${tableId}`,
      startY: schoolName ? 65 : 55,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      didParseCell: function(data) {
        if (data.column.index === data.table.columns.length - 1) {
          const rawCell = data.cell.raw;
          if (rawCell && (rawCell.querySelector('button') || (rawCell.innerText || '').toLowerCase().includes('action'))) {
            data.cell.text = [];
          }
        }
      }
    });

    const safeName = (filename || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully.');
  } catch (err) {
    console.error('PDF Generation Error:', err);
    toast.error('Failed to generate PDF document.');
  }
};

export const printPage = () => {
  window.print();
};
