/**
 * feeGenerator.js — Backend-integrated Monthly Fee Generator
 *
 * Generates monthly fee records for students based on fee structures.
 */

import { getCollection, saveCollection } from './db';

export const generateMonthlyFees = async (passedSchoolId = null, specificStudentId = null) => {
  let schoolId = passedSchoolId;
  if (!schoolId) {
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    schoolId = authUser.schoolId;
  }

  if (!schoolId) {
    console.warn('[feeGenerator] schoolId could not be resolved');
    return 0;
  }

  const sid = schoolId.toString();

  // Fetch all required data from backend / localStorage
  let users = [];
  let feeStructures = [];
  let monthlyFees = [];
  let classes = [];

  try {
    const [remoteUsers, remoteStructures, remoteFees, remoteClasses] = await Promise.all([
      getCollection('schoolAdminUsers', sid),
      getCollection('schoolAdminFeeStructures', sid),
      getCollection('schoolAdminMonthlyFees', sid),
      getCollection('schoolAdminClasses', sid),
    ]);

    users = (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) 
      ? remoteUsers 
      : JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');

    feeStructures = (remoteStructures && Array.isArray(remoteStructures) && remoteStructures.length > 0)
      ? remoteStructures
      : JSON.parse(localStorage.getItem('schoolAdminFeeStructures') || '[]');

    monthlyFees = (remoteFees && Array.isArray(remoteFees) && remoteFees.length > 0)
      ? remoteFees
      : JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');

    classes = (remoteClasses && Array.isArray(remoteClasses) && remoteClasses.length > 0)
      ? remoteClasses
      : JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');

  } catch (e) {
    users = JSON.parse(localStorage.getItem('schoolAdminUsers') || '[]');
    feeStructures = JSON.parse(localStorage.getItem('schoolAdminFeeStructures') || '[]');
    monthlyFees = JSON.parse(localStorage.getItem('schoolAdminMonthlyFees') || '[]');
    classes = JSON.parse(localStorage.getItem('schoolAdminClasses') || '[]');
  }

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const dueDateStr = new Date(currentYear, now.getMonth(), 15).toISOString().split('T')[0];
  const academicSession = '2026-2027';

  // Only active student users in this school
  let studentsToProcess = users.filter(u =>
    u.role?.toLowerCase() === 'student' &&
    u.status !== 'Inactive' &&
    (!u.schoolId || u.schoolId.toString() === sid)
  );

  if (specificStudentId) {
    studentsToProcess = studentsToProcess.filter(u => u.id?.toString() === specificStudentId.toString());
  }

  let generatedCount = 0;
  let updatedFees = [...monthlyFees];

  for (const student of studentsToProcess) {
    // 1. Resolve student's class row from classes
    let classRow = classes.find(c => c.id?.toString() === student.classId?.toString());
    if (!classRow && student.className) {
      classRow = classes.find(c => `${c.className} - ${c.section}` === student.className || c.className === student.className);
    }
    if (!classRow && student.class) {
      classRow = classes.find(c => `${c.className} - ${c.section}` === student.class || c.className === student.class);
    }

    const studentClassId = classRow ? classRow.id?.toString() : (student.classId?.toString() || '');
    const studentClassName = classRow ? `${classRow.className}-${classRow.section}` : (student.className || student.class || 'Class');
    const studentSection = classRow ? classRow.section : (student.section || '');

    // 2. Find matching fee structure for this student's class & section
    let structure = null;
    if (studentClassId) {
      structure = feeStructures.find(fs =>
        fs.classId?.toString() === studentClassId &&
        fs.status === 'Active'
      );
    }
    if (!structure && classRow) {
      structure = feeStructures.find(fs => {
        const fsClass = classes.find(c => c.id?.toString() === fs.classId?.toString());
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

      const feeItems = {
        monthlyFee: monthly,
        admissionFee: admission,
        examFee: exam,
        computerFee: computer,
        transportFee: transport,
        annualCharges: annual
      };

      // Check if fee record already exists for this student & month & session
      const existingIdx = updatedFees.findIndex(f =>
        f.studentId?.toString() === student.id?.toString() &&
        f.month === currentMonth &&
        f.year === currentYear &&
        (f.academicSession === academicSession || f.session === academicSession)
      );

      if (existingIdx !== -1) {
        // Update existing record with latest fee structure breakdown
        const existing = updatedFees[existingIdx];
        updatedFees[existingIdx] = {
          ...existing,
          schoolId: sid,
          studentId: student.id,
          classId: studentClassId,
          className: studentClassName,
          sectionId: studentSection,
          section: studentSection,
          feeStructureId: structure.id,
          feeItems,
          monthlyFee: monthly,
          admissionFee: admission,
          examFee: exam,
          computerFee: computer,
          transportFee: transport,
          annualCharges: annual,
          baseAmount,
          discount: discountAmount,
          totalAmount,
          remainingAmount: Math.max(0, totalAmount - (parseFloat(existing.paidAmount) || 0)),
          dueDate: structure.dueDate || existing.dueDate || dueDateStr
        };
      } else {
        // Create brand new fee record
        const feeId = `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFeeRecord = {
          id: feeId,
          schoolId: sid,
          studentId: student.id,
          rollNumber: student.rollNumber || 'N/A',
          studentName: student.name,
          classId: studentClassId,
          className: studentClassName,
          sectionId: studentSection,
          section: studentSection,
          month: currentMonth,
          year: currentYear,
          academicSession: academicSession,
          session: academicSession,
          feeStructureId: structure.id,
          feeItems,
          monthlyFee: monthly,
          admissionFee: admission,
          examFee: exam,
          computerFee: computer,
          transportFee: transport,
          annualCharges: annual,
          baseAmount,
          discount: discountAmount,
          discountReason: student.discountReason || '',
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: 'Pending',
          dueDate: structure.dueDate || dueDateStr,
          createdAt: now.toISOString()
        };
        updatedFees.push(newFeeRecord);
        generatedCount++;
      }
    }
  }

  if (updatedFees.length > 0) {
    try {
      await saveCollection('schoolAdminMonthlyFees', sid, updatedFees);
    } catch (e) {
      console.warn('Error saving monthly fees to backend database:', e);
    }
    localStorage.setItem('schoolAdminMonthlyFees', JSON.stringify(updatedFees));
  }

  return generatedCount;
};
