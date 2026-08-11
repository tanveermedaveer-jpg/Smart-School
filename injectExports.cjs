const fs = require('fs');

const allFiles = [
  // Super Admin
  'src/pages/superadmin/Schools.jsx',
  'src/pages/superadmin/DemoRequests.jsx',
  'src/pages/superadmin/ContactMessages.jsx',
  'src/pages/superadmin/AdmissionsManagement.jsx',

  // School Admin
  'src/pages/schooladmin/UserManagement.jsx',
  'src/pages/schooladmin/Attendance.jsx',
  'src/pages/schooladmin/FeeManagement.jsx',
  'src/pages/schooladmin/Examinations.jsx',
  'src/pages/schooladmin/Timetable.jsx',
  'src/pages/schooladmin/Reports.jsx',

  // Teacher
  'src/pages/teacher/Attendance.jsx',
  'src/pages/teacher/Marks.jsx',
  'src/pages/teacher/Homework.jsx',

  // Student
  'src/pages/student/Results.jsx',
  'src/pages/student/Attendance.jsx',
  'src/pages/student/Timetable.jsx',

  // Parent
  'src/pages/parent/ChildResults.jsx',
  'src/pages/parent/Attendance.jsx',
  'src/pages/parent/FeeStatus.jsx'
];

allFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping missing file: ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // 1. Import ExportButtons if not present
  if (!content.includes('ExportButtons')) {
    // Attempt to insert after the first import React
    content = content.replace(/(import React.*?;\n)/, `$1import ExportButtons from '../../components/ExportButtons';\n`);
  }

  // 2. Add ExportButtons to the header. We look for the first flex justify-between or similar header.
  if (content.includes('flex justify-between items-center mb-6')) {
     const titleMatch = content.match(/<h2[^>]*>(.*?)<\/h2>/);
     const title = titleMatch ? titleMatch[1] : 'Export';
     
     // We inject ExportButtons before the Add button, or inside the flex container if no Add button
     // Usually there is a <div><div><h2>...</h2>...</div> <button>...</button></div>
     // Or just <div><h2>...</h2></div>
     
     content = content.replace(
       /(<div className=\"flex justify-between items-center mb-6\">[\s\S]*?)(<\/div>\s*<div className=\"bg-white rounded-2xl)/,
       (match, p1, p2) => {
         if (p1.includes('<ExportButtons')) return match; // already injected
         
         if (p1.includes('</button>')) {
           return p1.replace(/<button/, `<div className="flex items-center space-x-3">\n        <ExportButtons tableId="export-table" filename="${title}" />\n        <button`) + `</div>\n` + p2;
         } else {
           return p1 + `\n      <ExportButtons tableId="export-table" filename="${title}" />` + p2;
         }
       }
     );
  }

  // 3. Add id='export-table' to the main table, if not already
  if (!content.includes('id="export-table"')) {
    content = content.replace(/<table([^>]*)>/, '<table id="export-table"$1>');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  }
});

allFiles.push('src/pages/parent/Results.jsx');

