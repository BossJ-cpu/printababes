'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Use static import if possible or dynamic with no SSR
import PDFViewer from './PDFViewer';

type FieldConfig = {
  x: number;
  y: number;
  font?: string;
  size?: number;
  page?: number;
};

type TemplateConfig = {
  key: string;
  fields_config: Record<string, FieldConfig>;
  file_path?: string;
};

// Subcomponent: Field Row with Optimized Design
const FieldRow: React.FC<{ 
  fieldName: string;
  config: FieldConfig;
  onRename: (oldName: string, newName: string) => void;
  onUpdate: (field: string, key: keyof FieldConfig, value: string | number) => void;
  onRemove: (field: string) => void;
}> = ({ 
  fieldName, 
  config, 
  onRename, 
  onUpdate, 
  onRemove 
}) => {
    const [tempName, setTempName] = React.useState(fieldName);

    useEffect(() => {
        setTempName(fieldName);
    }, [fieldName]);

    const handleBlur = () => {
        if (tempName !== fieldName && tempName.trim() !== '') {
            onRename(fieldName, tempName);
        } else {
            setTempName(fieldName); 
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all duration-200 group">
            <button 
                onClick={() => onRemove(fieldName)}
                className="absolute top-2 right-2 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Remove field"
            >
                ×
            </button>

            <div className="mb-3">
                <label htmlFor={`field-name-${fieldName}`} className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Field Name
                </label>
                <input 
                    id={`field-name-${fieldName}`}
                    name={`fieldName-${fieldName}`}
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full text-base font-semibold text-blue-700 bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 transition-colors duration-200"
                    placeholder="Field name..."
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label htmlFor={`page-${fieldName}`} className="block text-xs font-medium text-gray-600 mb-1">
                      Page
                    </label>
                    <input
                        id={`page-${fieldName}`}
                        name={`page-${fieldName}`}
                        type="number"
                        value={config.page || 1}
                        onChange={(e) => onUpdate(fieldName, 'page', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor={`size-${fieldName}`} className="block text-xs font-medium text-gray-600 mb-1">
                      Font Size
                    </label>
                    <input
                        id={`size-${fieldName}`}
                        name={`size-${fieldName}`}
                        type="number"
                        value={config.size || 12}
                        onChange={(e) => onUpdate(fieldName, 'size', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="6"
                        max="72"
                    />
                </div>
            </div>
            
            {/* Coordinate Display */}
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Coordinates (mm)</span>
                    <div className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
                        ({config.x}, {config.y})
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor={`x-${fieldName}`} className="block text-xs font-medium text-blue-700 mb-1">
                          X Position
                        </label>
                        <input
                            id={`x-${fieldName}`}
                            name={`x-${fieldName}`}
                            type="number"
                            value={config.x}
                            onChange={(e) => onUpdate(fieldName, 'x', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label htmlFor={`y-${fieldName}`} className="block text-xs font-medium text-blue-700 mb-1">
                          Y Position  
                        </label>
                        <input
                            id={`y-${fieldName}`}
                            name={`y-${fieldName}`}
                            type="number"
                            value={config.y}
                            onChange={(e) => onUpdate(fieldName, 'y', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                            step="0.1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function PdfEditorPage() {
  const [template, setTemplate] = useState<TemplateConfig>({ key: '', fields_config: {} });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // New state for notifications and upload control
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [shouldAutoPreview, setShouldAutoPreview] = useState(false);

  // Notification helper
  const showNotif = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

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
      } catch (e) {
          console.error("Failed to fetch profiles", e);
      } finally {
          setLoading(false);
      }
  };

  const loadProfile = async (key: string) => {
    if (!key) {
        setTemplate({ key: '', fields_config: {} });
        setPreviewUrl(null);
        setPreviewError(null);
        return;
    }
    setLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${key}`, {
          headers: {
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true'
          }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTemplate({
          ...data,
          fields_config: data.fields_config || {} 
      });
      // Trigger preview after loading
      setTimeout(() => {
          // We need to use valid state here, so let's rely on the data we just fetched
          handlePreview(data.key, data.fields_config);
      }, 100);
    } catch (error) {
      console.error('Failed to load template', error);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, key: keyof FieldConfig, value: string | number) => {
    if (!template) return;
    setTemplate({
      ...template,
      fields_config: {
        ...template.fields_config,
        [field]: {
          ...template.fields_config[field],
          [key]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!template || !template.key) {
        showNotif("Please provide a profile name.", 'error');
        return;
    }
    setSaving(true);
    try {
      // First ensure the template exists by calling GET (which creates it via firstOrCreate)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      // Now update with our data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ 
            fields_config: template.fields_config,
            file_path: template.file_path,
            name: template.key
        }),
      });
      if(res.ok) {
          if (!profiles.find(p => p.key === template.key)) {
              fetchProfiles(); // Refresh list if new
          }
           
          // Show success notification
          showNotif('Template saved successfully! 🎉', 'success');
          
          // Only preview if we definitely have a file path
          if (template.file_path && shouldAutoPreview) {
              handlePreview();
          } else if (!template.file_path) {
              setPreviewUrl(null);
              setPreviewError("Template saved. Please upload a PDF template to start editing fields.");
          }
      } else {
          // Handle save error
          const errorData = await res.json().catch(() => ({}));
          showNotif('Failed to save: ' + (errorData.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Failed to save', error);
      showNotif('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!template || !template.key) return;
      if (!confirm(`Are you sure you want to delete template "${template.key}"? This cannot be undone.`)) return;

      setSaving(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
              method: 'DELETE',
              headers: {
                  'Bypass-Tunnel-Reminder': 'true',
                  'ngrok-skip-browser-warning': 'true'
              }
          });
          
          if (res.ok) {
              showNotif('Template deleted successfully! ✅', 'success');
              setTemplate({ key: '', fields_config: {} });
              setPreviewUrl(null);
              setPreviewError(null);
              fetchProfiles(); // Refresh list
          } else {
              showNotif('Failed to delete template', 'error');
          }
      } catch (error) {
          console.error("Delete failed", error);
          showNotif('Error deleting template', 'error');
      } finally {
          setSaving(false);
      }
  };

  const handlePreview = async (overrideKey?: string | React.MouseEvent, overrideConfig?: any) => {
     const keyToUse = typeof overrideKey === 'string' ? overrideKey : template.key;
     const configToUse = (typeof overrideConfig === 'object' && overrideConfig !== null && !('nativeEvent' in overrideConfig) ) ? overrideConfig : template.fields_config;
     
     if (!keyToUse) return;
     
     const params = new URLSearchParams();
     params.append('t', Date.now().toString());
     
     Object.keys(configToUse).forEach(key => {
         const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         params.append(key, `[${formattedKey}]`);
     });

     try {
       setPreviewError(null);
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${keyToUse}/preview?${params.toString()}`, {
           headers: {
               'Bypass-Tunnel-Reminder': 'true',
               'ngrok-skip-browser-warning': 'true'
           }
       });
       
       if (!res.ok) {
           const errorData = await res.json().catch(() => ({})); // Try to read JSON error body
           
           if (res.status === 404) {
               console.warn("Preview 404 - File likely missing.");
               setPreviewError("PDF file not found for this profile. Please upload a new one. (404)");
           } else if (res.status === 422) {
               const message = errorData.error || "Unprocessable Entity";
               console.warn("Preview 422 - Validation/Processing Error:", message);
               setPreviewError(`Preview Error: ${message}`);
           } else {
               // For 500 errors and others, show the detailed error message
               const message = errorData.error || `HTTP ${res.status} Error`;
               console.error("Preview failed with status:", res.status, "Error:", message, "Details:", errorData.details);
               setPreviewError(`Preview Error: ${message}`);
           }
           setPreviewUrl(null);
           return;
       }

       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       setPreviewUrl(url);
     } catch(e) {
        console.error("Preview error:", e);
        setPreviewError("An error occurred while loading preview.");
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !template) return;

    if (!template.key) {
        showNotif("Please enter a Profile Name (Key) before uploading a PDF.", 'error');
        e.target.value = ''; // Reset file input
        return;
    }
    
    const formData = new FormData();
    formData.append('pdf', e.target.files[0]);

    try {
        setSaving(true);
        
        // First ensure the template exists by calling GET (which creates it via firstOrCreate)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        // Now upload the file
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}/upload`, {
            method: 'POST',
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }

        const updatedTemplate = await res.json();
        showNotif('PDF template uploaded successfully! 📁 Click Preview to view.', 'success');
        
        // Reset fields on new PDF
        setTemplate({
            ...template,
            fields_config: {},
            file_path: updatedTemplate.file_path // Update file_path from response
        });
        
        // Clear current preview and error - don't auto preview
        setPreviewUrl(null);
        setPreviewError("PDF uploaded successfully. Click Preview button to view.");
        setShouldAutoPreview(true); // Enable auto preview for subsequent saves
        
        // Save the cleared fields to backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ fields_config: {} }),
        });

    } catch (error) {
        console.error('Upload failed', error);
        showNotif('Upload failed: ' + error, 'error');
    } finally {
        setSaving(false);
    }
  };

  const handleAddField = (x: number, y: number, page: number) => {
      if (!template) return;
      const newKey = `field_${Object.keys(template.fields_config).length + 1}`;
      setTemplate({
          ...template,
          fields_config: {
              ...template.fields_config,
              [newKey]: {
                  x,
                  y,
                  page,
                  font: 'Arial',
                  size: 12
              }
          }
      });
  };

  const handleRemoveField = (fieldName: string) => {
      if (!template) return;
      const newConfig = { ...template.fields_config };
      delete newConfig[fieldName];
      setTemplate({
          ...template,
          fields_config: newConfig
      });
  };

  const handleRenameField = (oldName: string, newName: string) => {
      if(!template || !newName) return;
      if (template.fields_config[newName]) {
          showNotif("Field name already exists!", 'error');
          return;
      }
      const config = template.fields_config[oldName];
      const newConfig = { ...template.fields_config };
      delete newConfig[oldName];
      newConfig[newName] = config;
      
      setTemplate({
          ...template,
          fields_config: newConfig
      });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading templates...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Template Editor</h1>
              <p className="text-gray-600 mt-1">Create and manage PDF field templates</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          
          {/* Sidebar Editor */}
          <div className="col-span-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">Template Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">Configure fields and coordinates</p>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 p-4 overflow-y-auto" style={{ height: 'calc(100vh - 280px)' }}>
              {/* Profile Selection */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label htmlFor="profile-select" className="block text-sm font-semibold text-blue-900 mb-2">
                  Select Existing Template
                </label>
                <select 
                  id="profile-select"
                  name="profileSelect"
                  value={template.key} 
                  onChange={(e) => {
                      if (e.target.value === '') {
                           loadProfile('');
                      } else {
                          loadProfile(e.target.value);
                      }
                  }}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="">-- Create New Template --</option>
                  {profiles.map(p => (
                      <option key={p.key} value={p.key}>{p.name || p.key}</option>
                  ))}
                </select>
              </div>

              {/* Template Name Input */}
              <div className="mb-4">
                <label htmlFor="profile-key" className="block text-sm font-semibold text-gray-700 mb-2">
                  Template Name
                </label>
                <input 
                  id="profile-key"
                  name="profileKey"
                  type="text"
                  value={template.key}
                  onChange={(e) => setTemplate({ ...template, key: e.target.value })}
                  placeholder="Enter template name (e.g. certificate, form)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent font-medium text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Change this to create or edit a different template.
                </p>
              </div>

              {/* PDF Upload */}
              <div className="mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label htmlFor="pdf-upload" className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload PDF Template
                </label>
                <input 
                  id="pdf-upload"
                  name="pdfUpload"
                  type="file" 
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload your PDF template file. After upload, click Preview to view it.
                </p>
              </div>
              
              {/* Fields Configuration */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                  Field Coordinates
                  <span className="ml-2 text-sm font-normal text-gray-500">({Object.keys(template.fields_config || {}).length})</span>
                </h3>
                
                <div className="space-y-2">
                  {(Object.entries(template.fields_config || {}) as Array<[string, FieldConfig]>).map(([fieldName, config]) => (
                      <FieldRow 
                        key={fieldName}
                        fieldName={fieldName}
                        config={config}
                        onRename={handleRenameField}
                        onUpdate={handleFieldChange}
                        onRemove={handleRemoveField}
                      />
                  ))}
                  
                  {Object.keys(template.fields_config || {}).length === 0 && (
                      <div className="text-center py-8 px-4">
                        <div className="text-4xl mb-3">📄</div>
                        <h4 className="text-base font-medium text-gray-800 mb-2">No fields configured</h4>
                        <p className="text-sm text-gray-500">Click anywhere on the PDF preview to add a field</p>
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !template.key}
                  className={`w-full py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
                    saving || !template.key
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Template'
                  )}
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview()}
                    disabled={!template.key}
                    className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                      !template.key
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Preview
                  </button>
                  
                  {profiles.some(p => p.key === template.key) && (
                     <button
                        onClick={handleDelete}
                        disabled={saving}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                          saving
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                     >
                        Delete
                     </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="col-span-8 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">PDF Preview</h2>
              <p className="text-sm text-gray-600 mt-1">Click on the PDF to add field coordinates</p>
            </div>
            
            <div className="p-4 h-full bg-gray-50 overflow-auto">
              <div className="flex items-start justify-center h-full min-h-96">
                {previewError ? (
                    <div className="text-center mt-20">
                        <div className="text-4xl mb-3">⚠️</div>
                        <h4 className="text-base font-semibold text-orange-800 mb-2">Preview Error</h4>
                        <p className="text-orange-600 max-w-md text-sm">{previewError}</p>
                        {!template.file_path && (
                          <p className="text-sm text-gray-500 mt-4">
                            Upload a PDF template to get started
                          </p>
                        )}
                    </div>
                ) : previewUrl ? (
                    <div className="w-full h-full">
                      <PDFViewer url={previewUrl} template={template} onAddField={handleAddField} />
                    </div>
                ) : (
                    <div className="text-center mt-20">
                        <div className="text-4xl mb-3">📄</div>
                        <h4 className="text-base font-medium text-gray-800 mb-2">No Preview Available</h4>
                        <p className="text-gray-500 text-sm">Click "Preview" button to view your PDF template</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowNotification(false)}></div>
          <div className="bg-white rounded-lg p-6 shadow-2xl transform transition-all animate-bounce-in relative z-10 max-w-md w-full border border-gray-200">
            <div className="flex items-start mb-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                notificationType === 'success' ? 'bg-green-100' :
                notificationType === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <div className={`w-4 h-4 rounded-full ${
                  notificationType === 'success' ? 'bg-green-500' :
                  notificationType === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-base font-semibold ${
                  notificationType === 'success' ? 'text-green-900' :
                  notificationType === 'error' ? 'text-red-900' : 'text-blue-900'
                }`}>
                  {notificationType === 'success' ? 'Success!' :
                   notificationType === 'error' ? 'Error' : 'Info'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{notificationMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowNotification(false)}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
