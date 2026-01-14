'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Submission = {
  id: number;
  name: string;
  age: string;
  email: string;
  created_at: string;
};

type Profile = {
  key: string;
  name?: string;
  file_path?: string;
  source_table?: string;
};

export default function HomePage() {
  // Data Submission State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: ''
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
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
    fetchSubmissions();
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

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.email) {
      setSubmissionMessage('Please fill in all required fields.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    setSubmissionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSubmissionMessage('Data submitted successfully!');
        setShowPopup(true);
        setFormData({ name: '', age: '', email: '' });
        fetchSubmissions(); // Refresh the list
        // Auto hide popup after 3 seconds
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        setSubmissionMessage('Error submitting data. Please try again.');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmissionMessage('Network error. Please check your connection.');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } finally {
      setSubmissionLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200">
        <div className="absolute inset-0 bg-gray-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            PDF Generator
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 How It Works - 3 Simple Steps</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-blue-600 font-bold mb-2">1️⃣ Create Template</div>
                <p className="text-gray-600">Upload your PDF and set field positions using the PDF Editor</p>
                <a href="/pdf-editor" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block">
                  Open PDF Editor →
                </a>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-blue-600 font-bold mb-2">2️⃣ Submit Your Data</div>
                <p className="text-gray-600">Fill out your information using the form below ⬇️</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-blue-600 font-bold mb-2">3️⃣ Generate PDF</div>
                <p className="text-gray-600">Select your data and template to create the final PDF ⬇️</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Forms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Side - Data Submission Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Step 2: Submit Your Data</h2>
                <p className="text-gray-600">Enter your personal information</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Fill in your name, age, and email (all required)</li>
                <li>• Click Submit to save your data</li>
                <li>• Your submission will appear below and be available for PDF generation</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>

              <button
                type="submit"
                disabled={submissionLoading}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {submissionLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Data'
                )}
              </button>
            </form>

            {/* Recent Submissions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Submitted Data ({submissions.length})</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {submissions.length > 0 ? (
                  submissions.map(submission => (
                    <div key={submission.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium text-gray-800">{submission.name} - Age {submission.age}</div>
                      <div className="text-gray-600">{submission.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm text-center py-4">
                    <div className="text-2xl mb-2">📝</div>
                    <p>No data submitted yet.</p>
                    <p>Use the form above to submit your information.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Link to PDF Editor */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/pdf-editor"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center"
              >
                Need to create templates? Go to PDF Editor
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Side - PDF Generation */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Step 3: Generate Your PDF</h2>
                <p className="text-gray-600">Combine your data with a PDF template</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• First, create a PDF template using Step 1 (PDF Editor)</li>
                <li>• Submit your data using Step 2 (form on the left)</li>
                <li>• Select your submitted data and PDF template below</li>
                <li>• Click Generate PDF to create your personalized document</li>
              </ul>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-lg text-sm ${
                profiles.length > 0 && profiles.some(p => p.file_path)
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : profiles.length > 0 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-orange-50 border border-orange-200 text-orange-800'
              }`}>
                <div className="font-medium">
                  {profiles.length > 0 && profiles.some(p => p.file_path) ? '✅ Templates Ready' : 
                   profiles.length > 0 ? '⚠️ Templates Need PDFs' : '⚠️ No Templates'}
                </div>
                <div className="text-xs mt-1">
                  {profiles.length > 0 
                    ? `${profiles.filter(p => p.file_path).length}/${profiles.length} have PDF files`
                    : 'Create templates in PDF Editor first'
                  }
                </div>
              </div>
              <div className={`p-3 rounded-lg text-sm ${
                submissions.length > 0 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-orange-50 border border-orange-200 text-orange-800'
              }`}>
                <div className="font-medium">
                  {submissions.length > 0 ? '✅ Data Ready' : '⚠️ No Data'}
                </div>
                <div className="text-xs mt-1">
                  {submissions.length > 0 
                    ? `${submissions.length} submission(s) available`
                    : 'Submit your data using the form first'
                  }
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Source Table
                </label>
                <select
                  id="table-select"
                  name="tableSelect"
                  value={selectedTable}
                  onChange={handleTableChange}
                  className="w-full px-4 py-3 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">-- Choose a table --</option>
                  {availableTables.map(table => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
                {availableTables.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">💡 No tables available</p>
                )}
              </div>

              <div>
                <label htmlFor="submission-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Submitted Data
                </label>
                <select
                  id="submission-select"
                  name="submissionSelect"
                  value={selectedSubmissionId}
                  onChange={(e) => setSelectedSubmissionId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  <p className="text-sm text-orange-600 mt-1">💡 Select a table first</p>
                )}
                {selectedTable && tableRecords.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">💡 No records found in {selectedTable} table</p>
                )}
              </div>

              <div>
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF Template
                </label>
                <select
                  id="template-select"
                  name="templateSelect"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!selectedTable}
                >
                  <option value="">-- Choose a PDF template --</option>
                  {profiles
                    .filter(profile => profile.file_path && (!selectedTable || profile.source_table === selectedTable))
                    .map(profile => (
                      <option key={profile.key} value={profile.key}>
                        ✅ {profile.name || profile.key}
                      </option>
                    ))
                  }
                </select>
                {!selectedTable && (
                  <p className="text-sm text-orange-600 mt-1">💡 Select a table first</p>
                )}
                {selectedTable && profiles.filter(p => p.file_path && p.source_table === selectedTable).length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">⚠️ No templates for {selectedTable} table. Create one in PDF Editor.</p>
                )}
              </div>

              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading || !selectedSubmissionId || !selectedTemplateKey}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {pdfLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </span>
                ) : (
                  '📄 Generate My PDF'
                )}
              </button>
              
              {!selectedSubmissionId || !selectedTemplateKey ? (
                <p className="text-sm text-gray-500 text-center mt-2">
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
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{submissions.length}</div>
                <div className="text-sm text-gray-600">Data Entries</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{profiles.length}</div>
                <div className="text-sm text-gray-600">PDF Templates</div>
              </div>
            </div>

            {/* Link to dedicated pages */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <Link
                href="/pdf-editor"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center"
              >
                Create/Edit PDF Templates
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm">
              © 2026 Printables.
            </p>
          </div>
        </footer>
      </div>

      {/* Popup Notification */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowPopup(false)}></div>
          <div className="bg-white rounded-lg p-6 shadow-2xl transform transition-all animate-slide-up relative z-10 max-w-md w-full">
            <div className="flex items-center mb-4">
              {submissionMessage.includes('success') ? (
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {submissionMessage.includes('success') ? 'Success!' : 'Error'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {submissionMessage}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors duration-200"
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
