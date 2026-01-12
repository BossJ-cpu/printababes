'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Submission = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

type Profile = {
  key: string;
  name?: string;
};

export default function HomePage() {
  // Data Submission State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');

  // PDF Generation State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchSubmissions();
    fetchProfiles();
  }, []);

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
    if (!formData.name || !formData.email) {
      setSubmissionMessage('Please fill in all required fields.');
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
        setFormData({ name: '', email: '', message: '' });
        fetchSubmissions(); // Refresh the list
      } else {
        setSubmissionMessage('Error submitting data. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmissionMessage('Network error. Please check your connection.');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedSubmissionId || !selectedTemplateKey) {
      alert('Please select both a submission and a template.');
      return;
    }

    setPdfLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/app/generate-submission-pdf/${selectedSubmissionId}/${selectedTemplateKey}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Modern PDF Generator
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-slide-up">
            Streamline your workflow with our dual-purpose platform - submit data and generate beautiful PDFs in one place
          </p>
        </div>
      </div>

      {/* Main Content - Side by Side Forms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Side - Data Submission Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Data Submission</h2>
                <p className="text-gray-600">Submit your information to our database</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">How to use:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>1. Fill in your name and email (required)</li>
                <li>2. Add an optional message</li>
                <li>3. Submit to save your data</li>
                <li>4. Your submission will appear in the list below</li>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter an optional message"
                />
              </div>

              <button
                type="submit"
                disabled={submissionLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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

            {submissionMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                submissionMessage.includes('success') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {submissionMessage}
              </div>
            )}

            {/* Recent Submissions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Submissions ({submissions.length})</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {submissions.length > 0 ? (
                  submissions.map(submission => (
                    <div key={submission.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium text-gray-800">{submission.name}</div>
                      <div className="text-gray-600">{submission.email}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No submissions yet.</p>
                )}
              </div>
            </div>

            {/* Link to dedicated page */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/simple-form"
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                Go to dedicated form page
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Side - PDF Generation */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">PDF Generator</h2>
                <p className="text-gray-600">Generate PDFs from your submitted data</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. First, create PDF templates using the editor</li>
                <li>2. Submit data using the form on the left</li>
                <li>3. Select a submission and template below</li>
                <li>4. Generate a personalized PDF</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="submission-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Submission
                </label>
                <select
                  id="submission-select"
                  name="submissionSelect"
                  value={selectedSubmissionId}
                  onChange={(e) => setSelectedSubmissionId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">-- Select a submission --</option>
                  {submissions.map(submission => (
                    <option key={submission.id} value={submission.id}>
                      {submission.name} - {submission.email}
                    </option>
                  ))}
                </select>
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
                >
                  <option value="">-- Select a template --</option>
                  {profiles.map(profile => (
                    <option key={profile.key} value={profile.key}>
                      {profile.name || profile.key}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading || !selectedSubmissionId || !selectedTemplateKey}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {pdfLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate PDF'
                )}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{submissions.length}</div>
                <div className="text-sm text-gray-600">Submissions</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{profiles.length}</div>
                <div className="text-sm text-gray-600">Templates</div>
              </div>
            </div>

            {/* Link to dedicated pages */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <Link
                href="/pdf-editor"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Create/Edit PDF Templates
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-blue-100">Generate professional PDFs in seconds with our optimized processing engine.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-blue-100">Intuitive interface designed for both beginners and power users.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fully Customizable</h3>
              <p className="text-blue-100">Create templates that match your exact requirements and branding.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-white/80">
          <div className="border-t border-white/20 pt-8">
            <p className="text-sm">
              © 2026 Printables. Built with Next.js, React, and modern web technologies.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
