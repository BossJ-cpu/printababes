'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Profile = {
  key: string;
  name?: string;
  file_path?: string;
  source_table?: string;
};

export default function HomePage() {
  // State for notifications
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  // PDF Generation State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Table Selection State
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableRecords, setTableRecords] = useState<any[]>([]);

  // Load data on mount
  useEffect(() => {
    fetchProfiles();
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/available-tables`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableTables(data.tables || []);
      }
    } catch (error) {
      console.error('Error fetching available tables:', error);
    }
  };

  const fetchTableRecords = async (tableName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/table-records/${tableName}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTableRecords(data);
      }
    } catch (error) {
      console.error('Error fetching table records:', error);
      setTableRecords([]);
    }
  };

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = e.target.value;
    setSelectedTable(table);
    setSelectedSubmissionId(''); // Reset selected data when table changes
    if (table) {
      fetchTableRecords(table);
    } else {
      setTableRecords([]);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedSubmissionId || !selectedTemplateKey) {
      setSubmissionMessage('Please select both your data and a PDF template.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    setPdfLoading(true);
    try {
      // First check if the template exists and has a PDF file
      const templateCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${selectedTemplateKey}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!templateCheck.ok) {
        throw new Error(`Template '${selectedTemplateKey}' not found`);
      }
      
      const templateData = await templateCheck.json();
      if (!templateData.file_path) {
        setSubmissionMessage(`Template '${selectedTemplateKey}' needs a PDF file. Please go to PDF Editor and upload a PDF template first.`);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
        return;
      }

      // Generate PDF
      let url = `${process.env.NEXT_PUBLIC_API_URL}/app/generate-submission-pdf/${selectedSubmissionId}/${selectedTemplateKey}`;
      
      // Test the URL first to catch server errors
      const testResponse = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text().catch(() => 'Unknown error');
        if (errorText.includes('not found') || testResponse.status === 404) {
          setSubmissionMessage(`PDF template file is missing. Please upload a PDF file for template '${selectedTemplateKey}' in the PDF Editor.`);
        } else {
          setSubmissionMessage(`PDF generation failed: ${errorText || 'Server error'}. Please try again.`);
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
        return;
      }
      
      // If test passed, open PDF in new window
      window.open(url, '_blank');
      setSubmissionMessage('PDF generated successfully! 🎉');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      let errorMessage = 'Error generating PDF. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = `Template '${selectedTemplateKey}' not found. Please create it in the PDF Editor first.`;
        } else if (error.message.includes('Template') && error.message.includes('needs a PDF file')) {
          errorMessage = error.message;
        } else {
          errorMessage = `PDF generation failed: ${error.message}`;
        }
      }
      
      setSubmissionMessage(errorMessage);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            Professional PDF Generator
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            PDF Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create professional PDFs by combining your data with custom templates
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">2 Simple Steps</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Create Template</h3>
                </div>
                <p className="text-gray-700 mb-4 text-sm">Upload your PDF and configure field positions using our intuitive editor</p>
                <a href="/pdf-editor" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group-hover:gap-3 transition-all">
                  Open PDF Editor
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </a>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full font-bold text-lg group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Generate PDF</h3>
                </div>
                <p className="text-gray-700 text-sm">Select your data source and template to create your final PDF document</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Column */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* PDF Generation */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`p-4 rounded-xl text-sm transition-all duration-300 ${
                profiles.length > 0 && profiles.some(p => p.file_path)
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800'
                  : profiles.length > 0 
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 text-amber-800'
                  : 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 text-orange-800'
              }`}>
                <div className="flex items-center gap-2 font-semibold mb-2">
                  {profiles.length > 0 && profiles.some(p => p.file_path) ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  )}
                  {profiles.length > 0 && profiles.some(p => p.file_path) ? 'Templates Ready' : 
                   profiles.length > 0 ? 'Templates Need PDFs' : 'No Templates'}
                </div>
                <div className="text-xs opacity-90">
                  {profiles.length > 0 
                    ? `${profiles.filter(p => p.file_path).length}/${profiles.length} have PDF files`
                    : 'Create templates in PDF Editor first'
                  }
                </div>
              </div>
              <div className={`p-4 rounded-xl text-sm transition-all duration-300 ${
                tableRecords.length > 0 
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800'
                  : 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 text-orange-800'
              }`}>
                <div className="flex items-center gap-2 font-semibold mb-2">
                  {tableRecords.length > 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  )}
                  {tableRecords.length > 0 ? 'Data Ready' : 'No Data'}
                </div>
                <div className="text-xs opacity-90">
                  {tableRecords.length > 0 
                    ? `${tableRecords.length} record(s) available`
                    : 'Select a table to view records'
                  }
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="table-select" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Select Source Table
                </label>
                <select
                  id="table-select"
                  name="tableSelect"
                  value={selectedTable}
                  onChange={handleTableChange}
                  className="w-full px-4 py-3.5 border-2 border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium text-gray-800 hover:border-blue-300"
                >
                  <option value="">-- Choose a table --</option>
                  {availableTables.map(table => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
                {availableTables.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    No tables available
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="submission-select" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Select Your Data Record
                </label>
                <select
                  id="submission-select"
                  name="submissionSelect"
                  value={selectedSubmissionId}
                  onChange={(e) => setSelectedSubmissionId(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-400 disabled:hover:border-gray-300"
                  disabled={!selectedTable}
                >
                  <option value="">-- Choose from your submitted data --</option>
                  {tableRecords.map(record => {
                    // Try to create a meaningful label from the record
                    const label = record.name || record.first_name || record.username || `Record #${record.id}`;
                    const detail = record.email || record.city || record.position || '';
                    return (
                      <option key={record.id} value={record.id}>
                        {label}{detail ? ` - ${detail}` : ''}
                      </option>
                    );
                  })}
                </select>
                {!selectedTable && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Select a table first
                  </p>
                )}
                {selectedTable && tableRecords.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    No records found in {selectedTable} table
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="template-select" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  Select PDF Template
                </label>
                <select
                  id="template-select"
                  name="templateSelect"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed hover:border-gray-400 disabled:hover:border-gray-300"
                  disabled={!selectedTable}
                >
                  <option value="">-- Choose a PDF template --</option>
                  {profiles
                    .filter(profile => profile.file_path && (!selectedTable || profile.source_table === selectedTable))
                    .map(profile => (
                      <option key={profile.key} value={profile.key}>
                        {profile.name || profile.key}
                      </option>
                    ))
                  }
                </select>
                {!selectedTable && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Select a table first
                  </p>
                )}
                {selectedTable && profiles.filter(p => p.file_path && p.source_table === selectedTable).length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    No templates for {selectedTable} table. Create one in PDF Editor.
                  </p>
                )}
              </div>

              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading || !selectedSubmissionId || !selectedTemplateKey}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <span>Generate My PDF</span>
                  </>
                )}
              </button>
              
              {!selectedSubmissionId || !selectedTemplateKey ? (
                <p className="text-sm text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  {!selectedSubmissionId && !selectedTemplateKey 
                    ? 'Select both your data and a template to generate PDF'
                    : !selectedSubmissionId 
                    ? 'Please select your submitted data'
                    : 'Please select a PDF template'
                  }
                </p>
              ) : null}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl text-center border border-blue-200 hover:shadow-md transition-shadow duration-300">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{tableRecords.length}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">Data Entries</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl text-center border border-purple-200 hover:shadow-md transition-shadow duration-300">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{profiles.length}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">PDF Templates</div>
              </div>
            </div>

            {/* Link to dedicated pages */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/pdf-editor"
                className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 group"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span>Create/Edit PDF Templates</span>
                <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        

        {/* Footer */}
        <footer className="mt-20 pb-8 text-center">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">
              © 2026 Printables. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Popup Notification */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPopup(false)}></div>
          <div className="bg-white rounded-2xl p-6 shadow-2xl transform transition-all relative z-10 max-w-md w-full border border-gray-200 animate-scale-in">
            <div className="flex items-start gap-4 mb-6">
              {submissionMessage.includes('success') ? (
                <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {submissionMessage.includes('success') ? 'Success!' : 'Error'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {submissionMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
