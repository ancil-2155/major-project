import firestore from '@react-native-firebase/firestore';
import * as RNFS from 'react-native-fs';
import Share from 'react-native-share';
import XLSX from 'xlsx';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import { Platform } from 'react-native';

export const fetchSessionAndRecords = async (sessionId: string) => {
  const sessionDoc = await firestore().collection('attendanceSessions').doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error('Session not found');

  const sessionData = sessionDoc.data() || {};
  
  const recordsSnap = await firestore().collection('attendanceSessions').doc(sessionId).collection('records').get();
  const records = recordsSnap.docs.map(doc => doc.data());

  return { sessionData, records };
};

const buildExportRows = (sessionData: any, records: any[]) => {
  // Sort records by roll number
  const sortedRecords = [...records].sort((a, b) => {
    const rollA = a.rollNo ? String(a.rollNo) : '';
    const rollB = b.rollNo ? String(b.rollNo) : '';
    return rollA.localeCompare(rollB, undefined, { numeric: true });
  });

  const rows = sortedRecords.map((r, index) => ({
    'Sl. No.': index + 1,
    'Roll No.': r.rollNo || 'N/A',
    'Student Name': r.studentName || 'Unknown',
    'Department/Class': r.department || r.classLevel || 'N/A',
    'Year/Semester': `${r.year || ''} / ${r.semester || ''}`,
    'Subject': r.subject || sessionData.filter?.subject || 'N/A',
    'Status': r.status ? r.status.toUpperCase() : 'UNKNOWN',
    'Method': r.method === 'face_auto' ? 'Auto (Face)' : 'Manual',
  }));

  return rows;
};

const getFileNamePrefix = (sessionData: any) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const dept = sessionData.filter?.department || sessionData.filter?.classLevel || 'Dept';
  const sub = sessionData.filter?.subject ? sessionData.filter.subject.replace(/[^a-zA-Z0-9]/g, '') : 'Sub';
  return `Attendance_${dept}_${sub}_${dateStr}`;
};

export const exportAttendanceToCSV = async (sessionId: string) => {
  const { sessionData, records } = await fetchSessionAndRecords(sessionId);
  const rows = buildExportRows(sessionData, records);
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvStr = XLSX.utils.sheet_to_csv(worksheet);
  
  const fileName = `${getFileNamePrefix(sessionData)}.csv`;
  const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  
  await RNFS.writeFile(filePath, csvStr, 'utf8');
  return filePath;
};

export const exportAttendanceToXLSX = async (sessionId: string) => {
  const { sessionData, records } = await fetchSessionAndRecords(sessionId);
  const rows = buildExportRows(sessionData, records);
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  // Write to base64
  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  
  const fileName = `${getFileNamePrefix(sessionData)}.xlsx`;
  const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  
  await RNFS.writeFile(filePath, wbout, 'base64');
  return filePath;
};

export const generateAttendanceHTML = (sessionData: any, records: any[]) => {
  const rows = buildExportRows(sessionData, records);
  
  const dateStr = sessionData.createdAt ? sessionData.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();
  
  let html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e293b; }
          .header-info { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .header-info p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #0f172a; color: white; }
          .present { color: #10b981; font-weight: bold; }
          .absent { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>ACAMS Attendance Report</h1>
        <div class="header-info">
          <p><strong>Teacher:</strong> ${sessionData.teacherName || 'Unknown'}</p>
          <p><strong>Subject:</strong> ${sessionData.filter?.subject || 'N/A'}</p>
          <p><strong>Department/Class:</strong> ${sessionData.filter?.department || sessionData.filter?.classLevel || 'N/A'}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Total Students:</strong> ${sessionData.totalStudents || rows.length}</p>
          <p><strong>Present:</strong> ${sessionData.totalPresent || rows.filter(r => r.Status === 'PRESENT').length}</p>
          <p><strong>Absent:</strong> ${sessionData.totalAbsent || rows.filter(r => r.Status === 'ABSENT').length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sl. No.</th>
              <th>Roll No.</th>
              <th>Student Name</th>
              <th>Status</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
  `;

  rows.forEach(r => {
    const statusClass = r.Status === 'PRESENT' ? 'present' : 'absent';
    html += `
      <tr>
        <td>${r['Sl. No.']}</td>
        <td>${r['Roll No.']}</td>
        <td>${r['Student Name']}</td>
        <td class="${statusClass}">${r.Status}</td>
        <td>${r.Method}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;
  return html;
};

export const exportAttendanceToPDF = async (sessionId: string) => {
  const { sessionData, records } = await fetchSessionAndRecords(sessionId);
  const html = generateAttendanceHTML(sessionData, records);
  
  const fileName = getFileNamePrefix(sessionData);
  
  const options = {
    html,
    fileName,
    directory: 'Documents',
  };
  
  const file = await RNHTMLtoPDF.convert(options);
  return file.filePath;
};

export const printAttendancePDF = async (sessionId: string) => {
  const { sessionData, records } = await fetchSessionAndRecords(sessionId);
  const html = generateAttendanceHTML(sessionData, records);
  await RNPrint.print({ html });
};

export const shareAttendanceFile = async (filePath: string | undefined, mimeType: string) => {
  if (!filePath) throw new Error("Invalid file path");
  
  const fileUrl = Platform.OS === 'android' ? `file://${filePath}` : filePath;
  
  await Share.open({
    url: fileUrl,
    type: mimeType,
    title: 'Share Attendance Report',
  });
};
