'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Template = {
  id: string;
  name: string;
  report: string;
  fields: any[];
  createdAt: string;
};

type Company = {
  name: string;
  company_name?: string;
};

type ReportColumn = {
  fieldname: string;
  label: string;
  fieldtype?: string;
};

type ReportRow = Record<string, any>;

type Report = {
  name: string;
};

export default function ErpGeneratorPage() {
  // State
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [reportColumns, setReportColumns] = useState<ReportColumn[]>([]);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    setToDate(today);
    setFromDate(lastYear.toISOString().split('T')[0]);
  }, []);

  // Load reports and companies on mount
  useEffect(() => {
    loadReports();
    loadCompanies();
  }, []);

  // Load templates when report is selected
  useEffect(() => {
    if (selectedReport) {
      loadTemplates(selectedReport);
    } else {
      setTemplates([]);
    }
    // Reset selection when report changes
    setSelectedTemplate(null);
    setReportData([]);
    setSelectedRows(new Set());
  }, [selectedReport]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    if (type !== 'info') {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/reports`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([
        { name: 'Sales Payment Summary' },
        { name: 'General Ledger' },
        { name: 'Accounts Receivable' },
      ]);
    }
  };

  const loadTemplates = async (reportType: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/templates?report=${encodeURIComponent(reportType)}`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/companies`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || data || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([
        { name: 'Demo Company', company_name: 'Demo Company Ltd.' },
      ]);
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setReportData([]);
    setSelectedRows(new Set());
    showMessage(`Selected template: ${template.name}`, 'info');
  };

  const fetchReportData = async () => {
    if (!selectedReport) {
      showMessage('Please select a report first', 'error');
      return;
    }

    setLoading(true);
    showMessage('Fetching report data...', 'info');

    try {
      const params = new URLSearchParams({
        report: selectedReport,
        from_date: fromDate,
        to_date: toDate,
      });
      if (selectedCompany) params.append('company', selectedCompany);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/report-data?${params}`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.ok) {
        const data = await response.json();
        setReportColumns(data.columns || []);
        
        // Filter out total/summary rows (rows with empty date or marked as totals)
        const filteredData = (data.data || []).filter((row: ReportRow) => {
          // Skip rows that appear to be totals (empty date, or has "Total" text)
          const dateField = row.date || row.posting_date;
          if (!dateField || dateField === '' || dateField === 'Total') return false;
          return true;
        });
        
        setReportData(filteredData);
        
        const source = data.source === 'erpnext' ? 'ERPNext' : 'demo data';
        if (filteredData.length === 0) {
          showMessage('No data found for the selected filters', 'info');
        } else {
          showMessage(`Found ${filteredData.length} records from ${source}`, 'success');
        }
      } else {
        // Demo data
        setReportColumns([
          { fieldname: 'posting_date', label: 'Date', fieldtype: 'Date' },
          { fieldname: 'customer', label: 'Customer', fieldtype: 'Link' },
          { fieldname: 'grand_total', label: 'Amount', fieldtype: 'Currency' },
          { fieldname: 'status', label: 'Status', fieldtype: 'Data' },
        ]);
        setReportData([
          { posting_date: '2026-01-15', customer: 'John Doe', grand_total: 15000.00, status: 'Paid' },
          { posting_date: '2026-01-18', customer: 'Jane Smith', grand_total: 22500.50, status: 'Pending' },
          { posting_date: '2026-01-20', customer: 'Acme Corp', grand_total: 75000.00, status: 'Paid' },
        ]);
        showMessage('Using demo data (API unavailable)', 'info');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Demo data for testing
      setReportColumns([
        { fieldname: 'posting_date', label: 'Date', fieldtype: 'Date' },
        { fieldname: 'customer', label: 'Customer', fieldtype: 'Link' },
        { fieldname: 'grand_total', label: 'Amount', fieldtype: 'Currency' },
      ]);
      setReportData([
        { posting_date: '2026-01-15', customer: 'Demo Customer', grand_total: 10000.00 },
      ]);
      showMessage('Using demo data', 'info');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === reportData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(reportData.map((_, i) => i)));
    }
  };

  const formatValue = (value: any, fieldtype?: string) => {
    if (value === null || value === undefined) return '-';
    if (fieldtype === 'Currency' || fieldtype === 'Float') {
      return typeof value === 'number' ? value.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : value;
    }
    return String(value);
  };

  const previewPDF = async () => {
    if (!selectedTemplate) {
      showMessage('Please select a template', 'error');
      return;
    }

    const rowsToGenerate = selectedRows.size > 0
      ? Array.from(selectedRows).map(i => reportData[i])
      : reportData;

    if (rowsToGenerate.length === 0) {
      showMessage('No rows selected or available', 'error');
      return;
    }

    setGenerating(true);
    showMessage('Generating preview...', 'info');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/generate-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true', 
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          mode: 'single',
          data: [rowsToGenerate[0]],
          preview: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreview(true);
        showMessage('Preview ready!', 'success');
      } else {
        // Demo preview
        setShowPreview(true);
        showMessage('Preview generated (demo mode)', 'success');
      }
    } catch (error) {
      showMessage('Preview generated (demo mode)', 'info');
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDFs = async () => {
    if (!selectedTemplate) return;

    const rowsToGenerate = selectedRows.size > 0
      ? Array.from(selectedRows).map(i => reportData[i])
      : reportData;

    if (rowsToGenerate.length === 0) return;

    setGenerating(true);
    showMessage(`Starting download of ${rowsToGenerate.length} files...`, 'info');

    let successCount = 0;

    for (let i = 0; i < rowsToGenerate.length; i++) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/generate-pdf`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true', 
            'ngrok-skip-browser-warning': 'true' 
          },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            mode: 'single',
            data: [rowsToGenerate[i]],
            preview: false
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `document_${i + 1}.pdf`;
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) filename = match[1];
          }

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          successCount++;

          if (i < rowsToGenerate.length - 1) {
            await new Promise(r => setTimeout(r, 600));
          }
        }
      } catch (err) {
        console.error('Download error for row', i, err);
      }
    }

    showMessage(`Completed! Downloaded ${successCount} of ${rowsToGenerate.length} files.`, 'success');
    setGenerating(false);
  };

  const closeModal = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const displayColumns = reportColumns.slice(0, 8);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PDF Generator
              </h1>
            </div>
            <div>
              <Link 
                href="/erp/template-editor" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Templates
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Area */}
        {message && (
          <div className={`mb-6 sticky top-20 z-20 px-4 py-3 rounded-lg border shadow-sm flex items-center animate-[bounce-in_0.3s_ease-out] ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
            message.type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
            'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            <span className="flex-grow">{message.text}</span>
          </div>
        )}

        {/* Step 1: Select Report */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
            Select Report
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {reports.map(r => (
              <button
                key={r.name}
                onClick={() => setSelectedReport(r.name)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  selectedReport === r.name 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Templates Section */}
        {selectedReport && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">2</span>
            Select Template
          </h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500 mb-6">Create your first template in the editor to get started.</p>
              <Link 
                href="/erp/template-editor" 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={`border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-white group ${
                    selectedTemplate?.id === t.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{t.name}</h3>
                    {selectedTemplate?.id === t.id && <span className="text-blue-500">✔</span>}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mb-3 bg-indigo-50 inline-block px-2 py-1 rounded">
                    {t.report}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {Object.keys(t.fields || {}).length} fields
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Step 3: Filters Section */}
        {selectedReport && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
              Filter Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map(c => (
                    <option key={c.name} value={c.name}>{c.company_name || c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Fetching...
                  </>
                ) : 'Fetch Data'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Data Table Section */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">4</span>
                Select Records
                {!selectedTemplate && (
                  <span className="text-sm font-normal text-orange-600 ml-2">(Select a template to generate PDFs)</span>
                )}
              </h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={previewPDF}
                  disabled={generating || !selectedTemplate}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Selected
                </button>
                <button
                  onClick={downloadPDFs}
                  disabled={generating || !selectedTemplate}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Generate PDFs
                </button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto" style={{ maxHeight: '500px', scrollbarWidth: 'thin' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-10 px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === reportData.length && reportData.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </th>
                      {displayColumns.map(c => (
                        <th key={c.fieldname} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((row, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${
                          selectedRows.has(index) ? 'bg-blue-50/80' : ''
                        }`}
                        onClick={() => toggleRow(index)}
                      >
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index)}
                              onChange={() => toggleRow(index)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        </td>
                        {displayColumns.map(c => (
                          <td key={c.fieldname} className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatValue(row[c.fieldname], c.fieldtype)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" 
              onClick={closeModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-bold text-gray-900">
                  PDF Preview ({selectedRows.size || reportData.length} Row(s) Selected)
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-100 p-6 flex justify-center h-[600px]">
                {previewUrl ? (
                  <iframe src={previewUrl} className="w-full h-full rounded-lg shadow-lg border border-gray-200" />
                ) : (
                  <div className="flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p>PDF preview would appear here</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  onClick={downloadPDFs}
                  disabled={generating}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {selectedRows.size <= 1 ? 'Download PDF' : `Download ${selectedRows.size || reportData.length} PDFs`}
                </button>
                <button
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
