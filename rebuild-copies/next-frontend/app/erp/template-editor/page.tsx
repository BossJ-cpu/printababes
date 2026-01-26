'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
};

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
  }, []);

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
        width: 100, // Default width
        wrapText: false // Default wrap
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

  const saveTemplate = async () => {
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
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <aside className="w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-xl">
          {/* Sidebar Header */}
          <div className="px-6 py-6 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-6">
              <Link 
                href="/" 
                className="flex items-center justify-center w-10 h-10 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all text-gray-500"
                title="Back to Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <Link 
                href="/erp/generator" 
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wide"
              >
                Generate PDF
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Template Editor
            </h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Design your PDF templates by dragging and dropping fields onto your document.
            </p>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>
            {/* Step 1: Data Source */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-sm uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                Data Source
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select ERPNext Report</label>
                <div className="relative">
                  <select 
                    value={selectedReport}
                    onChange={handleReportChange}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Report --</option>
                    {reports.map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Message Area */}
                {message && (
                  <div className={`px-4 py-3 rounded-lg border flex items-center text-sm animate-[bounce-in_0.3s_ease-out] ${
                    message.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
                    message.type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
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
            <div className="border-t border-gray-100"></div>

            {/* Step 2: Fields */}
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-sm uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</span>
                Drag & Drop Fields
              </div>

              <div className="flex-1 min-h-[200px] border border-gray-200 rounded-lg bg-gray-50 p-2 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {reportColumns.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm flex flex-col items-center">
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
                      className={`cursor-grab active:cursor-grabbing transition-all flex items-center justify-between py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm hover:translate-x-1 hover:border-blue-500 hover:bg-blue-50 ${
                        isFieldPlaced(col.fieldname) ? 'bg-green-50 border-green-500 opacity-70' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-semibold">
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
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50 relative">
          {/* Toolbar */}
          <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-6 flex-1">
              {/* Template Name Input */}
              <div className="relative w-96 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Name your template..."
                  className="block w-full pl-10 pr-3 py-2.5 border-b-2 border-transparent bg-transparent text-gray-900 font-semibold text-lg placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-all hover:bg-gray-50 rounded-t-md"
                />
              </div>
              <span className="text-gray-300 text-2xl font-light">|</span>
              <span className="text-sm font-medium text-gray-500 truncate max-w-xs">
                {pdfFile ? pdfFile.name : 'No PDF Loaded'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={clearAllFields}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 font-medium rounded-lg text-sm px-4 py-2.5 transition-colors"
              >
                Clear Fields
              </button>

              <button 
                onClick={saveTemplate}
                disabled={saving}
                className="text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300 font-bold rounded-xl text-sm px-6 py-2.5 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
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
            className="flex-1 overflow-auto p-12 flex justify-center bg-slate-100/50 relative"
            style={{ scrollbarWidth: 'thin' }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Upload State */}
            {!pdfLoaded && (
              <div className="self-center w-full max-w-xl">
                <div 
                  className="border-[3px] border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group bg-white shadow-sm"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'scale-[1.02]'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'scale-[1.02]'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'scale-[1.02]');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === 'application/pdf') handlePdfUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Upload PDF Template</h3>
                  <p className="text-gray-500 mb-6">Drag and drop your PDF file here, or click to browse</p>
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
                  <span className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">Browse Files</span>
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
                
                {/* Placed Fields */}
                {placedFields.map((field, index) => {
                  const isSelected = selectedFieldIndex === index;
                  return (
                    <div
                      key={`${field.fieldname}-${index}`}
                      draggable
                      onDragStart={(e) => handlePlacedFieldDragStart(e, index)}
                      onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(index); }}
                      className={`absolute px-3 py-1.5 bg-blue-600/90 text-white text-xs font-semibold rounded-md cursor-move select-none shadow-md hover:bg-blue-600 hover:shadow-lg transition-all flex items-center ${
                        isSelected ? 'ring-4 ring-yellow-400 z-30' : 'z-10'
                      } ${!field.wrapText ? 'whitespace-nowrap' : ''}`}
                      style={{ 
                        left: field.x, 
                        top: field.y,
                        width: field.width && field.width > 0 ? `${field.width}px` : 'auto'
                      }}
                    >
                      <span className="flex-1 truncate">{field.label}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeField(index); }}
                        className="ml-2 opacity-60 hover:opacity-100 w-4 h-4 bg-black/20 rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-black/40 transition-all shrink-0"
                      >
                        ×
                      </button>

                      {/* Properties Popup */}
                      {isSelected && (
                        <div 
                          className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 text-gray-800 w-48 cursor-default"
                          onMouseDown={(e) => e.stopPropagation()} 
                          onClick={(e) => e.stopPropagation()}
                          draggable={false}
                        >
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">Width (px)</label>
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
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-gray-500">Wrap Text</label>
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
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                            <div className="text-[10px] text-gray-400 pt-2 border-t mt-2 flex justify-between">
                              <span>X: {Math.round(field.x)}</span>
                              <span>Y: {Math.round(field.y)}</span>
                            </div>
                          </div>
                          
                          {/* Triangle Indicator */}
                          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
