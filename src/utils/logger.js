/**
 * logger.js — Backend Activity Logger
 *
 * Logs system actions to the Node.js backend.
 */

import { getCollection, saveCollection } from './db';

export const logSystemAction = async (action, user, role, schoolName, schoolId = null) => {
  try {
    let targetSchoolId = schoolId;
    let userId = null;

    try {
      const authStr = sessionStorage.getItem('authUser');
      if (authStr) {
        const authUser = JSON.parse(authStr);
        if (authUser.schoolId) {
          targetSchoolId = authUser.schoolId.toString();
        }
        if (authUser.id) {
          userId = authUser.id.toString();
        }
      }
    } catch (e) {}

    const newLog = {
      id: `log_${Date.now()}`,
      schoolId: targetSchoolId ? targetSchoolId.toString() : null,
      userId: userId,
      role: role || 'System',
      action: action,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      school: schoolName || 'N/A',
      user: user || 'System',
      status: 'Success'
    };

    const logs = await getCollection('systemLogs');
    const updated = [newLog, ...logs];
    await saveCollection('systemLogs', null, updated);
  } catch (error) {
    console.error('Failed to save system log:', error);
  }
};

export const deleteSystemLog = async (id) => {
  try {
    const logId = id ? id.toString() : '';
    if (!logId) return false;

    const logs = await getCollection('systemLogs');
    const updated = logs.filter(l => l.id !== logId);
    await saveCollection('systemLogs', null, updated);
    return true;
  } catch (error) {
    console.error('Failed to delete system log:', error);
    return false;
  }
};

export const deleteAllSystemLogs = async () => {
  try {
    await saveCollection('systemLogs', null, []);
    return true;
  } catch (error) {
    console.error('Failed to delete all system logs:', error);
    return false;
  }
};

export const getActivityLogs = async (schoolId = null) => {
  try {
    const logs = await getCollection('systemLogs');
    const filtered = schoolId 
      ? logs.filter(l => l.schoolId?.toString() === schoolId.toString())
      : logs;
      
    // Sort by timestamp descending
    filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return filtered;
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
};
