'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';

type ReportColumn = {
  fieldname: string;
  label: string;
  fieldtype?: string;
};

type PlacedField = {
  fieldname: string;
  label: string;
  x: number;
  y: number;
  page: number;
  width?: number;
  wrapText?: boolean;
  align?: 'left' | 'center' | 'right';
};

// Alignment Icon Components (Microsoft Word style)
const AlignLeftIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: active ? '#2563eb' : '#9ca3af' }}>
    <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="13" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AlignCenterIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: active ? '#2563eb' : '#9ca3af' }}>
    <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AlignRightIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: active ? '#2563eb' : '#9ca3af' }}>
    <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function ErpTemplateEditorPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [reports, setReports] = useState<{name: string}[]>([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [reportColumns, setReportColumns] = useState<ReportColumn[]>([]);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfScale] = useState(1.5);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage] = useState(1);
  const [existingTemplates, setExistingTemplates] = useState<{id: string; name: string; key: string}[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTemplateName, setDuplicateTemplateName] = useState('');

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }, []);

  // Load reports on mount
  useEffect(() => {
    loadReports();
    loadExistingTemplates();
  }, []);

  const loadExistingTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/templates`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading existing templates:', error);
    }
  };

  // Keyboard navigation for selected field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedFieldIndex === null) return;

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      e.preventDefault(); // Prevent scrolling
      
      const step = e.shiftKey ? 10 : 5; // 5px default, 10px with Shift
      let dx = 0; 
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
      }

      setPlacedFields(prev => {
        const newFields = [...prev];
        // Ensure index is valid
        if (selectedFieldIndex >= 0 && selectedFieldIndex < newFields.length) {
          const field = newFields[selectedFieldIndex];
          newFields[selectedFieldIndex] = {
            ...field,
            x: Math.max(0, field.x + dx), // Prevent moving off-canvas (left/top)
            y: Math.max(0, field.y + dy)
          };
        }
        return newFields;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldIndex]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadReports = async () => {
    // Common ERPNext reports
    const commonReports = [
      { name: 'Sales Payment Summary' },
      { name: 'General Ledger' },
      { name: 'Accounts Receivable' },
      { name: 'Sales Register' },
      { name: 'Sales Invoice Trends' },
      { name: 'Purchase Analytics' },
      { name: 'Stock Ledger' },
      { name: 'Item-wise Sales Register' },
    ];
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/reports`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || commonReports);
      } else {
        setReports(commonReports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports(commonReports);
    }
  };

  const loadReportColumns = async (reportName: string) => {
    if (!reportName) {
      setReportColumns([]);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/erp/report-columns?report=${encodeURIComponent(reportName)}`,
        { headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' } }
      );
      if (response.ok) {
        const data = await response.json();
        const columns = data.columns || [];
        setReportColumns(columns);
        const source = data.source === 'erpnext' ? 'ERPNext' : 'sample';
        
        if (data.source !== 'erpnext') {
           console.warn('ERP Error:', data.debug_error);
           showMessage(`Loaded fallback columns. ${data.debug_error || ''}`, 'info');
        } else {
           showMessage(`Loaded ${columns.length} columns from ${source}`, 'success');
        }
      } else {
        // Fallback columns
        const fallbackCols = [
          { fieldname: 'date', label: 'Date', fieldtype: 'Date' },
          { fieldname: 'name', label: 'Name', fieldtype: 'Data' },
          { fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' },
        ];
        setReportColumns(fallbackCols);
        showMessage('Loaded fallback columns', 'info');
      }
    } catch (error) {
      console.error('Error loading columns:', error);
      const fallbackCols = [
        { fieldname: 'date', label: 'Date', fieldtype: 'Date' },
        { fieldname: 'name', label: 'Name', fieldtype: 'Data' },
        { fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' },
      ];
      setReportColumns(fallbackCols);
      showMessage('Loaded fallback columns', 'info');
    }
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reportName = e.target.value;
    setSelectedReport(reportName);
    loadReportColumns(reportName);
  };

  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      showMessage('Please upload a valid PDF file', 'error');
      return;
    }

    setPdfFile(file);
    setTemplateName(file.name.replace('.pdf', ''));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        showMessage('PDF.js not loaded yet, please try again', 'error');
        return;
      }

      const doc = await pdfjsLib.getDocument({ 
        data: pdfBytes,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
      }).promise;

      setPdfLoaded(true);
      renderPdfPage(doc, 1);
      showMessage('PDF loaded successfully!', 'success');
    } catch (error) {
      console.error('Error loading PDF:', error);
      showMessage('Error loading PDF file', 'error');
    }
  };

  const renderPdfPage = async (doc: any, pageNum: number) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfScale });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  const isFieldPlaced = (fieldname: string) => {
    return placedFields.some(f => f.fieldname === fieldname);
  };

  const handleFieldDragStart = (e: React.DragEvent, fieldname: string, label: string) => {
    e.dataTransfer.setData('fieldname', fieldname);
    e.dataTransfer.setData('label', label);
    e.dataTransfer.setData('type', 'new');
  };

  const handlePlacedFieldDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('type', 'move');
    e.dataTransfer.setData('index', String(index));
    setSelectedFieldIndex(index); // Select on drag start
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const type = e.dataTransfer.getData('type');

    if (type === 'move') {
      // Moving existing field
      const index = parseInt(e.dataTransfer.getData('index'));
      const newFields = [...placedFields];
      newFields[index] = { ...newFields[index], x, y };
      setPlacedFields(newFields);
      setSelectedFieldIndex(index); // Ensure selected
    } else {
      // Adding new field
      const fieldname = e.dataTransfer.getData('fieldname');
      const label = e.dataTransfer.getData('label');
      if (!fieldname) return;

      // Remove if already placed - preserving other fields
      // Note: We might want allow re-placement, but if we filter, the index changes.
      // Let's rely on finding the new index at the end.
      const filteredFields = placedFields.filter(f => f.fieldname !== fieldname);
      
      // Add new placement
      const newField = {
        fieldname,
        label,
        x,
        y,
        page: currentPage,
        width: undefined, // Default: Auto
        wrapText: false, // Default wrap
        align: 'left' as const // Default alignment
      };
      
      filteredFields.push(newField);

      setPlacedFields(filteredFields);
      setSelectedFieldIndex(filteredFields.length - 1); // Select the new last item
    }
  };

  const removeField = (index: number) => {
    setPlacedFields(prev => prev.filter((_, i) => i !== index));
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const clearAllFields = () => {
    setPlacedFields([]);
    setSelectedFieldIndex(null);
  };

  const checkForDuplicate = () => {
    const normalizedName = templateName.trim().toLowerCase();
    const normalizedKey = normalizedName.replace(/[^a-z0-9]+/g, '_');
    
    const duplicate = existingTemplates.find(t => {
      const existingName = (t.name || '').toLowerCase();
      const existingKey = t.key || existingName.replace(/[^a-z0-9]+/g, '_');
      return existingName === normalizedName || existingKey === normalizedKey;
    });
    
    return duplicate;
  };

  const saveTemplate = async (forceOverwrite: boolean = false) => {
    if (!templateName.trim()) {
      showMessage('Please enter a template name', 'error');
      return;
    }
    if (!pdfFile) {
      showMessage('Please upload a PDF first', 'error');
      return;
    }
    if (placedFields.length === 0) {
      showMessage('Please place at least one field on the PDF', 'error');
      return;
    }
    if (!selectedReport) {
      showMessage('Please select a report first', 'error');
      return;
    }

    // Check for duplicate template name
    if (!forceOverwrite) {
      const duplicate = checkForDuplicate();
      if (duplicate) {
        setDuplicateTemplateName(duplicate.name);
        setShowDuplicateModal(true);
        return;
      }
    }

    setSaving(true);

    try {
      const canvas = canvasRef.current;
      const formData = new FormData();
      formData.append('name', templateName);
      formData.append('report', selectedReport);
      formData.append('fields', JSON.stringify(placedFields));
      formData.append('canvasWidth', String(canvas?.width || 0));
      formData.append('canvasHeight', String(canvas?.height || 0));
      formData.append('scale', String(pdfScale));
      formData.append('pdf', pdfFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/erp/templates`, {
        method: 'POST',
        headers: { 'Bypass-Tunnel-Reminder': 'true', 'ngrok-skip-browser-warning': 'true' },
        body: formData
      });

      const result = await response.json();

      if (result.success || response.ok) {
        showMessage('Template saved successfully!', 'success');
        setTimeout(() => router.push('/erp/generator'), 1500);
      } else {
        showMessage(result.error || 'Error saving template', 'error');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showMessage('Error saving template', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg h-screen flex flex-col overflow-hidden transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border transition-colors duration-300" role="banner">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 dark:from-purple-400/10 dark:to-indigo-400/10"></div>
          <div className="relative max-w-full mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:text-white dark:bg-none">ERP Template Editor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs transition-colors duration-300">Design PDF templates for ERPNext reports</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/erp/generator"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate PDF
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border-2 border-gray-300 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label="Back to Home"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-96 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col shrink-0 z-20 shadow-xl transition-colors duration-300">
          {/* Sidebar Header */}
          <div className="px-6 py-6 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card transition-colors duration-300">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:text-white dark:bg-none mb-2">
              Template Editor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed transition-colors duration-300">
              Design your PDF templates by dragging and dropping fields onto your document.
            </p>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>
            {/* Step 1: Data Source */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-sm uppercase tracking-wide transition-colors duration-300">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">1</span>
                Data Source
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">Select ERPNext Report</label>
                <div className="relative">
                  <select 
                    value={selectedReport}
                    onChange={handleReportChange}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Report --</option>
                    {reports.map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Message Area */}
                {message && (
                  <div className={`px-4 py-3 rounded-lg border flex items-center text-sm animate-[bounce-in_0.3s_ease-out] ${
                    message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' :
                    message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                  } transition-colors duration-300`}>
                    {message.type === 'success' && (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {message.text}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-dark-border"></div>

            {/* Step 2: Fields */}
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-sm uppercase tracking-wide transition-colors duration-300">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">2</span>
                Drag & Drop Fields
              </div>

              <div className="flex-1 min-h-[200px] border border-gray-200 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg p-2 overflow-y-auto space-y-2 transition-colors duration-300" style={{ scrollbarWidth: 'thin' }}>
                {reportColumns.length === 0 ? (
                  <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm flex flex-col items-center transition-colors duration-300">
                    <svg className="w-8 h-8 opacity-50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Select a report to load fields
                  </div>
                ) : (
                  reportColumns.map(col => (
                    <div
                      key={col.fieldname}
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, col.fieldname, col.label)}
                      className={`cursor-grab active:cursor-grabbing transition-all flex items-center justify-between py-2.5 px-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-700 dark:text-gray-200 shadow-sm hover:translate-x-1 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                        isFieldPlaced(col.fieldname) ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600 opacity-70' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg px-1.5 py-0.5 rounded font-semibold">
                        {col.fieldtype || 'Data'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-dark-bg/50 relative transition-colors duration-300">
          {/* Toolbar */}
          <header className="h-20 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-8 shadow-sm z-10 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-6 flex-1">
              {/* Template Name Input */}
              <div className="relative w-96 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Name your template..."
                  className="block w-full pl-10 pr-3 py-2.5 border-b-2 border-transparent bg-transparent text-gray-900 dark:text-white font-semibold text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 transition-all hover:bg-gray-50 dark:hover:bg-dark-bg rounded-t-md"
                />
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-2xl font-light">|</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-xs transition-colors duration-300">
                {pdfFile ? pdfFile.name : 'No PDF Loaded'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={clearAllFields}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg text-sm px-4 py-2.5 transition-colors"
              >
                Clear Fields
              </button>

              <button 
                onClick={saveTemplate}
                disabled={saving}
                className="text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 font-bold rounded-xl text-sm px-6 py-2.5 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Template
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Canvas Area */}
          <div 
            className="flex-1 overflow-auto p-12 flex justify-center bg-slate-100/50 dark:bg-dark-bg/80 relative transition-colors duration-300"
            style={{ scrollbarWidth: 'thin' }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Upload State */}
            {!pdfLoaded && (
              <div className="self-center w-full max-w-xl">
                <div 
                  className="border-[3px] border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group bg-white dark:bg-dark-card shadow-sm"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/30', 'scale-[1.02]'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/30', 'scale-[1.02]'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/30', 'scale-[1.02]');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === 'application/pdf') handlePdfUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Upload PDF Template</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 transition-colors duration-300">Drag and drop your PDF file here, or click to browse</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfUpload(file);
                    }}
                  />
                  <span className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-800 dark:hover:text-purple-300 transition-colors">Browse Files</span>
                </div>
              </div>
            )}

            {/* PDF Canvas with placed fields */}
            {pdfLoaded && (
              <div 
                ref={wrapperRef}
                className="relative bg-white shadow-2xl"
                style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleCanvasDrop}
                onClick={() => setSelectedFieldIndex(null)}
              >
                <canvas ref={canvasRef} />
                
                {/* Placed Fields - Matching PDF Editor Style */}
                {placedFields.map((field, index) => {
                  const isSelected = selectedFieldIndex === index;
                  const hasWidth = field.width && field.width > 0;
                  const alignment = field.align || 'left';
                  
                  // Calculate transform based on alignment
                  let transformX = '0';
                  if (hasWidth) {
                    if (alignment === 'center') {
                      transformX = '-50%';
                    } else if (alignment === 'right') {
                      transformX = '-100%';
                    }
                  }
                  
                  return (
                    <div key={`${field.fieldname}-${index}`}>
                      {/* Field Marker - Using inline styles like PDF editor */}
                      <div
                        draggable
                        onDragStart={(e) => handlePlacedFieldDragStart(e, index)}
                        onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(index); }}
                        style={{
                          position: 'absolute',
                          backgroundColor: 'rgba(37, 99, 235, 0.9)',
                          color: 'white',
                          fontSize: '12px',
                          lineHeight: '1.3',
                          fontWeight: '600',
                          padding: '6px 12px',
                          left: field.x,
                          top: field.y,
                          cursor: 'move',
                          borderRadius: '6px',
                          userSelect: 'none',
                          zIndex: isSelected ? 30 : 10,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                          transform: `translate(${transformX}, 0)`,
                          display: 'flex',
                          flexDirection: hasWidth && field.wrapText ? 'column' : 'row',
                          alignItems: hasWidth && field.wrapText ? 'stretch' : 'center',
                          textAlign: alignment,
                          whiteSpace: field.wrapText ? 'normal' : 'nowrap',
                          wordBreak: field.wrapText ? 'break-all' : 'normal',
                          width: hasWidth ? `${field.width}px` : 'auto',
                          outline: isSelected ? '4px solid #facc15' : 'none'
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.label}</span>
                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeField(index); }}
                          style={{
                            marginLeft: hasWidth && field.wrapText ? '0' : '8px',
                            marginTop: hasWidth && field.wrapText ? '4px' : '0',
                            alignSelf: hasWidth && field.wrapText ? 'flex-end' : 'auto',
                            opacity: 0.6,
                            width: '16px',
                            height: '16px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            lineHeight: 1,
                            border: 'none',
                            cursor: 'pointer',
                            color: 'inherit',
                            flexShrink: 0
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
                        >
                          ×
                        </button>

                        {/* Properties Popup - Matching PDF Editor */}
                        {isSelected && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              marginTop: '8px',
                              background: 'white',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                              border: '1px solid #e5e7eb',
                              padding: '12px',
                              zIndex: 50,
                              color: '#374151',
                              width: '192px',
                              cursor: 'default'
                            }}
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={(e) => e.stopPropagation()}
                            draggable={false}
                          >
                            {/* Width Input */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                              <input 
                                type="number" 
                                value={field.width || ''}
                                placeholder="Auto"
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                                  setPlacedFields(prev => {
                                    const newFields = [...prev];
                                    newFields[index] = { ...newFields[index], width: val };
                                    return newFields;
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  fontSize: '14px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                              />
                            </div>
                            
                            {/* Wrap Text Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Wrap Text</label>
                              <input 
                                type="checkbox" 
                                checked={field.wrapText || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setPlacedFields(prev => {
                                    const newFields = [...prev];
                                    newFields[index] = { ...newFields[index], wrapText: checked };
                                    return newFields;
                                  });
                                }}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                              />
                            </div>
                            
                            {/* Alignment Icons */}
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Alignment</label>
                              <div style={{ 
                                display: 'flex', 
                                gap: '2px', 
                                background: '#f3f4f6', 
                                borderRadius: '6px', 
                                padding: '4px' 
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlacedFields(prev => {
                                      const newFields = [...prev];
                                      newFields[index] = { ...newFields[index], align: 'left' };
                                      return newFields;
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: alignment === 'left' ? 'white' : 'transparent',
                                    boxShadow: alignment === 'left' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.15s'
                                  }}
                                  title="Align Left"
                                >
                                  <AlignLeftIcon active={alignment === 'left'} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlacedFields(prev => {
                                      const newFields = [...prev];
                                      newFields[index] = { ...newFields[index], align: 'center' };
                                      return newFields;
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: alignment === 'center' ? 'white' : 'transparent',
                                    boxShadow: alignment === 'center' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.15s'
                                  }}
                                  title="Align Center"
                                >
                                  <AlignCenterIcon active={alignment === 'center'} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlacedFields(prev => {
                                      const newFields = [...prev];
                                      newFields[index] = { ...newFields[index], align: 'right' };
                                      return newFields;
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    background: alignment === 'right' ? 'white' : 'transparent',
                                    boxShadow: alignment === 'right' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.15s'
                                  }}
                                  title="Align Right"
                                >
                                  <AlignRightIcon active={alignment === 'right'} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Coordinates */}
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#9ca3af', 
                              paddingTop: '8px', 
                              marginTop: '12px', 
                              borderTop: '1px solid #e5e7eb',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>X: {Math.round(field.x)}</span>
                              <span>Y: {Math.round(field.y)}</span>
                            </div>
                            
                            {/* Alignment position note */}
                            {hasWidth && (
                              <div style={{
                                fontSize: '10px',
                                color: '#3b82f6',
                                marginTop: '8px',
                                textAlign: 'center',
                                padding: '4px',
                                background: '#eff6ff',
                                borderRadius: '4px'
                              }}>
                                ↔ {alignment === 'left' ? 'Starts' : alignment === 'center' ? 'Centered' : 'Ends'} at X:{Math.round(field.x)}
                              </div>
                            )}
                            
                            {/* Triangle Indicator */}
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              left: '16px',
                              width: '12px',
                              height: '12px',
                              background: 'white',
                              borderTop: '1px solid #e5e7eb',
                              borderLeft: '1px solid #e5e7eb',
                              transform: 'rotate(45deg)'
                            }} />
                          </div>
                        )}
                        
                        {/* Width indicator line with alignment marker */}
                        {hasWidth && (
                          <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '0',
                            right: '0',
                            height: '2px',
                            background: '#facc15',
                            pointerEvents: 'none'
                          }}>
                            {/* Left edge marker */}
                            <div style={{
                              position: 'absolute',
                              left: '0',
                              top: '-4px',
                              width: '2px',
                              height: '10px',
                              background: '#facc15'
                            }} />
                            {/* Right edge marker */}
                            <div style={{
                              position: 'absolute',
                              right: '0',
                              top: '-4px',
                              width: '2px',
                              height: '10px',
                              background: '#facc15'
                            }} />
                            {/* Alignment anchor marker (red) */}
                            <div style={{
                              position: 'absolute',
                              left: alignment === 'left' ? '0' : alignment === 'center' ? '50%' : '100%',
                              transform: alignment === 'center' ? 'translateX(-50%)' : alignment === 'right' ? 'translateX(-100%)' : 'none',
                              top: '-6px',
                              width: '4px',
                              height: '14px',
                              background: '#ef4444',
                              borderRadius: '2px'
                            }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Duplicate Template Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-900/75 dark:bg-black/80 transition-opacity" 
              onClick={() => setShowDuplicateModal(false)}
            ></div>

            <div className="relative inline-block align-middle bg-white dark:bg-dark-card rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full border border-gray-200 dark:border-dark-border">
              <div className="bg-white dark:bg-dark-card px-6 pt-6 pb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Template Name Already Exists
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        A template named <span className="font-semibold text-red-600 dark:text-red-400">"{duplicateTemplateName}"</span> already exists.
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Please choose a different name for your template.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-bg px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="inline-flex justify-center items-center px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  OK, I'll Change the Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
