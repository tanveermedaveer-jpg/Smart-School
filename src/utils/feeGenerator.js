/**
 * feeGenerator.js — Backend-integrated Monthly Fee Generator
 *
 * Generates monthly fee records for students based on fee structures.
 */

import { getCollection, saveCollection } from './db';

export const generateMonthlyFees = async (schoolId, specificStudentId = null) => {
  if (!schoolId) {
    console.error('[feeGenerator] schoolId is required');
    return 0;
  }

  const sid = schoolId.toString();

  // Fetch all required data from backend
  const [users, feeStructures, monthlyFees, classes] = await Promise.all([
    getCollection('schoolAdminUsers', sid),
    getCollection('schoolAdminFeeStructures', sid),
    getCollection('schoolAdminMonthlyFees', sid),
    getCollection('schoolAdminClasses', sid),
  ]);

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const dueDateStr = new Date(currentYear, now.getMonth(), 15).toISOString().split('T')[0];

  const academicSession = '2026-2027';

  // Only active student users
  let studentsToProcess = users.filter(u =>
    u.role?.toLowerCase() === 'student' &&
    u.status === 'Active'
  );

  if (specificStudentId) {
    studentsToProcess = studentsToProcess.filter(u => u.id?.toString() === specificStudentId.toString());
  }

  const newRecords = [];

  for (const student of studentsToProcess) {
    // Check if already exists for this month, year and student
    const exists = monthlyFees.some(f =>
      f.studentId?.toString() === student.id?.toString() &&
      f.month === currentMonth &&
      f.year === currentYear &&
      f.academicSession === academicSession
    ) || newRecords.some(f =>
      f.studentId?.toString() === student.id?.toString() &&
      f.month === currentMonth &&
      f.year === currentYear &&
      f.academicSession === academicSession
    );

    if (exists) continue;

    // Resolve class row details from student.classId
    const classRow = classes.find(c => c.id.toString() === student.classId?.toString());
    if (!classRow) continue;

    // Find fee structure for the student's class
    let structure = feeStructures.find(fs =>
      fs.classId?.toString() === classRow.id?.toString() &&
      fs.status === 'Active'
    );

    // Fallback: match by class name
    if (!structure) {
      structure = feeStructures.find(fs => {
        const fsClass = classes.find(c => c.id.toString() === fs.classId?.toString());
        return fsClass && fsClass.className === classRow.className && fs.status === 'Active';
      });
    }

    if (structure) {
      const monthly = parseFloat(structure.monthlyFee) || 0;
      const admission = parseFloat(structure.admissionFee) || 0;
      const exam = parseFloat(structure.examFee) || 0;
      const computer = parseFloat(structure.computerFee) || 0;
      const transport = parseFloat(structure.transportFee) || 0;
      const annual = parseFloat(structure.annualCharges) || 0;

      const baseAmount = monthly + admission + exam + computer + transport + annual;

      let discountAmount = 0;
      if (student.discountValue) {
        const val = parseFloat(student.discountValue) || 0;
        if (student.discountType === 'percentage') {
          discountAmount = (baseAmount * val) / 100;
        } else {
          discountAmount = val;
        }
      }

      const totalAmount = Math.max(0, baseAmount - discountAmount);

      const feeId = `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newFeeRecord = {
        id: feeId,
        studentId: student.id,
        rollNumber: student.rollNumber || 'N/A',
        studentName: student.name,
        classId: classRow.id,
        className: classRow.className,
        section: classRow.section,
        month: currentMonth,
        year: currentYear,
        academicSession: academicSession,
        monthlyFee: monthly,
        admissionFee: admission,
        examFee: exam,
        computerFee: computer,
        transportFee: transport,
        annualCharges: annual,
        discount: discountAmount,
        discountReason: student.discountReason || '',
        totalAmount: totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: 'Pending',
        dueDate: dueDateStr,
        createdAt: now.toISOString(),
        schoolId: sid,
      };

      newRecords.push(newFeeRecord);
    }
  }

  if (newRecords.length > 0) {
    const updatedFees = [...monthlyFees, ...newRecords];
    await saveCollection('schoolAdminMonthlyFees', sid, updatedFees);
    localStorage.setItem('schoolAdminMonthlyFees', JSON.stringify(updatedFees));
  }

  return newRecords.length;
};
