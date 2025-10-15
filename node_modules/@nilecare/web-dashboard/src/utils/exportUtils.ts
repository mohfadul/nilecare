/**
 * Data Export Utilities
 * Export data to Excel, PDF, CSV formats
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel (XLSX)
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export to Excel failed:', error);
    return false;
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    
    return true;
  } catch (error) {
    console.error('Export to CSV failed:', error);
    return false;
  }
};

/**
 * Export data to PDF
 */
export const exportToPDF = (
  data: any[],
  filename: string,
  title: string,
  columns: { header: string; dataKey: string }[]
) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Add table
    autoTable(doc, {
      startY: 35,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey] || '-')),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 102, 204] }, // NileCare blue
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Export to PDF failed:', error);
    return false;
  }
};

/**
 * Export Patient List to Excel
 */
export const exportPatientsToExcel = (patients: any[]) => {
  const exportData = patients.map(p => ({
    'Patient ID': p.id,
    'First Name': p.firstName,
    'Last Name': p.lastName,
    'Date of Birth': p.dateOfBirth?.split('T')[0],
    'Gender': p.gender,
    'Phone': p.phoneNumber,
    'Email': p.email || '-',
    'City': p.city || '-',
    'State': p.state || '-',
    'Blood Type': p.bloodType || '-',
    'Created': new Date(p.createdAt).toLocaleDateString(),
  }));
  
  return exportToExcel(exportData, `patients_${new Date().toISOString().split('T')[0]}`, 'Patients');
};

/**
 * Export Patient List to PDF
 */
export const exportPatientsToPDF = (patients: any[]) => {
  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Name', dataKey: 'name' },
    { header: 'DOB', dataKey: 'dob' },
    { header: 'Gender', dataKey: 'gender' },
    { header: 'Phone', dataKey: 'phone' },
    { header: 'Email', dataKey: 'email' },
  ];
  
  const exportData = patients.map(p => ({
    id: p.id.substring(0, 8) + '...',
    name: `${p.firstName} ${p.lastName}`,
    dob: p.dateOfBirth?.split('T')[0],
    gender: p.gender,
    phone: p.phoneNumber,
    email: p.email || '-',
  }));
  
  return exportToPDF(
    exportData,
    `patients_${new Date().toISOString().split('T')[0]}`,
    'NileCare - Patient List',
    columns
  );
};

/**
 * Export Appointments to Excel
 */
export const exportAppointmentsToExcel = (appointments: any[]) => {
  const exportData = appointments.map(a => ({
    'Appointment ID': a.id,
    'Patient': a.patientName,
    'Provider': a.providerName,
    'Date': a.appointmentDate?.split('T')[0],
    'Time': a.appointmentTime || (a as any).appointmentTime,
    'Duration': `${a.duration} min`,
    'Type': a.appointmentType,
    'Status': a.status,
    'Reason': a.reason || '-',
  }));
  
  return exportToExcel(exportData, `appointments_${new Date().toISOString().split('T')[0]}`, 'Appointments');
};

/**
 * Export Appointments to PDF
 */
export const exportAppointmentsToPDF = (appointments: any[]) => {
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Time', dataKey: 'time' },
    { header: 'Patient', dataKey: 'patient' },
    { header: 'Provider', dataKey: 'provider' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Status', dataKey: 'status' },
  ];
  
  const exportData = appointments.map(a => ({
    date: a.appointmentDate?.split('T')[0],
    time: a.appointmentTime || (a as any).appointmentTime,
    patient: a.patientName,
    provider: a.providerName,
    type: a.appointmentType,
    status: a.status,
  }));
  
  return exportToPDF(
    exportData,
    `appointments_${new Date().toISOString().split('T')[0]}`,
    'NileCare - Appointment Schedule',
    columns
  );
};

/**
 * Export Users to Excel
 */
export const exportUsersToExcel = (users: any[]) => {
  const exportData = users.map(u => ({
    'User ID': u.id,
    'Name': `${u.first_name} ${u.last_name}`,
    'Email': u.email,
    'Role': u.role,
    'Specialty': u.specialty || '-',
    'Phone': u.phone || '-',
    'Status': u.status,
    'Created': new Date(u.created_at || Date.now()).toLocaleDateString(),
  }));
  
  return exportToExcel(exportData, `users_${new Date().toISOString().split('T')[0]}`, 'Users');
};

/**
 * Export Users to PDF
 */
export const exportUsersToPDF = (users: any[]) => {
  const columns = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Role', dataKey: 'role' },
    { header: 'Specialty', dataKey: 'specialty' },
    { header: 'Status', dataKey: 'status' },
  ];
  
  const exportData = users.map(u => ({
    name: `${u.first_name} ${u.last_name}`,
    email: u.email,
    role: u.role,
    specialty: u.specialty || '-',
    status: u.status,
  }));
  
  return exportToPDF(
    exportData,
    `users_${new Date().toISOString().split('T')[0]}`,
    'NileCare - User Directory',
    columns
  );
};

