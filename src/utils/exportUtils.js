import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

export const exportToCSV = (tableId, filename) => {
  const table = document.getElementById(tableId);
  if (!table) {
    toast.error('Could not find data to export.');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  
  const csvData = rows.map(row => {
    // Only get th or td, but avoid the last column if it's "Actions"
    const cells = Array.from(row.querySelectorAll('th, td'));
    
    // We want to skip columns that represent "Actions" typically the last one.
    // Let's filter out text content if we detect action buttons (like Edit/Delete)
    // Actually, it's safer to just extract text and let it be, but if the header says "Actions" or "Action", we should ideally skip it.
    
    // Instead, let's just grab all text
    let rowData = cells.map(cell => {
      let text = cell.innerText || cell.textContent;
      text = text.replace(/"/g, '""'); // escape quotes
      // Remove newline chars for cleaner csv
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
  const table = document.getElementById(tableId);
  if (!table) {
    toast.error('Could not find data to export.');
    return;
  }

  const doc = new jsPDF('p', 'pt', 'a4');
  
  doc.setFontSize(16);
  doc.text(title || filename, 40, 40);
  
  doc.autoTable({
    html: `#${tableId}`,
    startY: 60,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 23, 42] }, // darkBlue color roughly
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  toast.success('PDF downloaded successfully.');
};

export const printPage = () => {
  window.print();
};
