import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

// Import Firebase database
import { getDatabase, ref, get } from "firebase/database";
import app from '../firebase';
// Add jsPDF import
import jsPDF from 'jspdf';

const Admin = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');

  // Fetch all reports from Firebase Realtime Database
  useEffect(() => {
    const fetchReports = async () => {
      const db = getDatabase(app);
      const reportsRef = ref(db, 'reports');
      const snapshot = await get(reportsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Fetched reports data from /reports:", data);
        // Flatten the data for table display
        const allReports = [];
        Object.entries(data).forEach(([uid, userReports]) => {
          if (userReports && typeof userReports === 'object') {
            Object.entries(userReports).forEach(([key, report]) => {
              if (report && typeof report === 'object') {
                allReports.push({ uid, key, ...report });
              }
            });
          }
        });
        setReports(allReports);
      } else {
        setReports([]);
        console.log("No data found at /reports");
      }
    };
    fetchReports();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Download PDF for a report
  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('User Report', 10, 10);
    doc.setFontSize(12);
    let y = 20;

    // Helper to add multi-line text for long fields
    const addMultilineField = (label, value) => {
      doc.text(`${label}:`, 10, y);
      y += 6;
      const lines = doc.splitTextToSize(value || '', 180);
      lines.forEach(line => {
        doc.text(line, 14, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 10; }
      });
    };

    // Add fields
    doc.text(`Name: ${report.name || ''}`, 10, y); y += 8;
    doc.text(`Address: ${report.address || ''}`, 10, y); y += 8;
    doc.text(`Phone: ${report.phone || ''}`, 10, y); y += 8;
    doc.text(`Disease: ${report.disease || ''}`, 10, y); y += 8;
    doc.text(`Sex: ${report.sex || ''}`, 10, y); y += 8;
    doc.text(`Report ID: ${report.report_id || ''}`, 10, y); y += 8;

    addMultilineField('Technique', report.technique_description);
    addMultilineField('Findings', report.findings_description);
    addMultilineField('Impression', report.impression_text);

    doc.text(`Timestamp: ${report.timestamp ? new Date(report.timestamp).toLocaleString() : ''}`, 10, y); y += 8;

    doc.save(`${report.name || 'person'}-medical-report.pdf`);
  };

  // Filter reports by name (case-insensitive)
  const filteredReports = reports.filter(r =>
    r.name && r.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-pink-600">
      {/* Admin Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md">
        <span className="text-2xl font-bold text-blue-700">Admin</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-red-700 transition"
        >
          Logout
        </button>
      </nav>
      {/* Admin Content */}
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">Admin Dashboard</h1>
        <p className="text-lg text-gray-100 mb-6">Welcome, Admin! You have special access.</p>
      
        {/* Search Box */}
        <input
          type="text"
          placeholder="Search by user name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-6 text-white px-4 py-2 rounded border border-gray-300 w-80"
        />
        {/* Reports Table */}
        <div className="overflow-x-auto rounded-2xl
         w-full max-w-7xl">
          <table className="min-w-full bg-white rounded shadow text-xs">
            <thead>
              <tr>
                <th className="px-2 py-2 border">Name</th>
                {/* Removed UID and Push Key columns */}
                <th className="px-2 py-2 border">Address</th>
                <th className="px-2 py-2 border">Phone</th>
                <th className="px-2 py-2 border">Disease</th>
                <th className="px-2 py-2 border">Sex</th>
                <th className="px-2 py-2 border">Report ID</th>
                <th className="px-2 py-2 border">Technique</th>
                <th className="px-2 py-2 border">Findings</th>
                <th className="px-2 py-2 border">Impression</th>
                <th className="px-2 py-2 border">Timestamp</th>
                <th className="px-2 py-2 border">Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-4 text-gray-500">
                    No reports found.
                    {reports.length > 0 && search && (
                      <div className="text-xs text-red-500 mt-2">
                        Reports exist, but none match your search.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, idx) => (
                  <tr key={idx} className="hover:bg-gray-100">
                    <td className="px-2 py-2 border">{report.name || ''}</td>
                    {/* Removed UID and Push Key cells */}
                    <td className="px-2 py-2 border">{report.address || ''}</td>
                    <td className="px-2 py-2 border">{report.phone || ''}</td>
                    <td className="px-2 py-2 border">{report.disease || ''}</td>
                    <td className="px-2 py-2 border">{report.sex || ''}</td>
                    <td className="px-2 py-2 border">{report.report_id || ''}</td>
                    <td className="px-2 py-2 border">{report.technique_description || ''}</td>
                    <td className="px-2 py-2 border">{report.findings_description || ''}</td>
                    <td className="px-2 py-2 border">{report.impression_text || ''}</td>
                    <td className="px-2 py-2 border">{report.timestamp ? new Date(report.timestamp).toLocaleString() : ''}</td>
                    <td className="px-2 py-2 border">
                      <button
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                        onClick={() => handleDownloadPDF(report)}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
