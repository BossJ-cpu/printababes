'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

// Use static import if possible or dynamic with no SSR
import PDFViewer from './PDFViewer';

type FieldConfig = {
  x: number;
  y: number;
  font?: string;
  size?: number;
  page?: number;
  csv_column?: string;
  csv_index?: number;
};

type TemplateConfig = {
  id?: number;
  key: string;
  name?: string;
  fields_config: Record<string, FieldConfig>;
  file_path?: string;
  source_table?: string;
  data_source_type?: 'database' | 'csv';
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
        <div className="relative p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-md shadow-sm hover:shadow-md transition-all duration-200 group">
            <button 
                onClick={() => onRemove(fieldName)}
                className="absolute top-2 right-2 w-5 h-5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 rounded text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Remove field"
            >
                ×
            </button>

            <div className="mb-3">
                <label htmlFor={`field-name-${fieldName}`} className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 transition-colors duration-300">
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
                    className="w-full text-base font-semibold text-blue-700 dark:text-blue-400 bg-transparent border-0 border-b border-dashed border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none px-0 py-1 transition-colors duration-200"
                    placeholder="Field name..."
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label htmlFor={`page-${fieldName}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
                      Page
                    </label>
                    <input
                        id={`page-${fieldName}`}
                        name={`page-${fieldName}`}
                        type="number"
                        value={config.page || 1}
                        onChange={(e) => onUpdate(fieldName, 'page', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg rounded text-sm font-medium text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                        min="1"
                    />
                </div>
                <div>
                    <label htmlFor={`size-${fieldName}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
                      Font Size
                    </label>
                    <input
                        id={`size-${fieldName}`}
                        name={`size-${fieldName}`}
                        type="number"
                        value={config.size || 12}
                        onChange={(e) => onUpdate(fieldName, 'size', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg rounded text-sm font-medium text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                        min="6"
                        max="72"
                    />
                </div>
            </div>
            
            {/* Coordinate Display */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide transition-colors duration-300">Coordinates (mm)</span>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded transition-colors duration-300">
                        ({config.x}, {config.y})
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor={`x-${fieldName}`} className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 transition-colors duration-300">
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
                        <label htmlFor={`y-${fieldName}`} className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 transition-colors duration-300">
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') as 'database' | 'csv' | null;
  
  const [template, setTemplate] = useState<TemplateConfig>({ key: '', fields_config: {} });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter templates based on selected source table
  const filteredTemplates = useMemo(() => {
    if (!template.source_table) {
      return profiles;
    }
    return profiles.filter(profile => profile.source_table === template.source_table);
  }, [profiles, template.source_table]);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [backendDimensions, setBackendDimensions] = useState<Record<number, {width: number, height: number, orientation: string}> | null>(null);
  
  // New state for notifications and upload control
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [shouldAutoPreview, setShouldAutoPreview] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Force re-render of file input
  
  // New state for columns display and drag-and-drop
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  
  // CSV/Excel Import state
  const [csvImport, setCsvImport] = useState<any>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  
  // Data source type state (set by mode parameter)
  const [dataSourceType, setDataSourceType] = useState<'database' | 'csv' | null>(mode);
  
  // Bulk PDF preview state - updated to handle individual PDFs
  const [bulkPdfUrls, setBulkPdfUrls] = useState<string[]>([]);
  const [bulkSessionId, setBulkSessionId] = useState<string | null>(null);
  const [bulkTotalPages, setBulkTotalPages] = useState<number>(0);
  const [bulkCurrentPage, setBulkCurrentPage] = useState<number>(1);
  const [currentRecordData, setCurrentRecordData] = useState<string[]>([]);

  // Redirect if no valid mode
  useEffect(() => {
    if (!mode || (mode !== 'database' && mode !== 'csv')) {
      router.push('/');
    } else {
      setDataSourceType(mode);
    }
  }, [mode, router]);

  // Fetch actual PDF dimensions from backend
  const fetchPdfDimensions = async (templateKey: string, retryCount = 0): Promise<any> => {
    if (!templateKey) return null;
    
    try {
      console.log(`Fetching dimensions for template: ${templateKey} (attempt ${retryCount + 1})`);
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${encodeURIComponent(templateKey)}/dimensions`;
      console.log('Dimensions API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });
      
      console.log('Dimensions API response status:', response.status);
      console.log('Dimensions API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend PDF dimensions received:', data);
        return data.dimensions;
      } else {
        const errorText = await response.text();
        console.error('❌ Dimensions API failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl
        });
        
        // If template doesn't exist (404), try to create it first
        if (response.status === 404 && retryCount === 0) {
          console.log('Template not found, creating it first...');
          await ensureTemplateExists(templateKey);
          return fetchPdfDimensions(templateKey, retryCount + 1);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching PDF dimensions:', {
        error: error instanceof Error ? error.message : String(error),
        templateKey,
        attempt: retryCount + 1
      });
      
      // Retry once on network error
      if (retryCount === 0) {
        console.log('Retrying dimensions fetch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchPdfDimensions(templateKey, retryCount + 1);
      }
    }
    
    console.warn('❌ Failed to fetch backend dimensions, will use frontend calculations');
    return null;
  };
  
  // Helper function to ensure template exists
  const ensureTemplateExists = async (templateKey: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${encodeURIComponent(templateKey)}`,
        {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        console.log('✅ Template exists or was created');
      } else {
        console.log('❌ Failed to ensure template exists:', response.status);
      }
    } catch (error) {
      console.error('❌ Error ensuring template exists:', error);
    }
  };
  const showNotif = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    // Errors stay visible until manually dismissed (no auto-hide)
    // Success/info messages auto-hide after specified duration or 3 seconds
    if (type !== 'error') {
      setTimeout(() => setShowNotification(false), duration || 3000);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAvailableTables();
  }, []);

  // Debug CSV columns
  useEffect(() => {
    console.log('csvColumns state changed:', csvColumns);
    console.log('dataSourceType:', dataSourceType);
    console.log('csvImport:', csvImport);
  }, [csvColumns, dataSourceType, csvImport]);

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
      } else {
        console.error('Failed to fetch available tables');
      }
    } catch (error) {
      console.error('Error fetching available tables:', error);
    }
  };
  
  // Fetch columns for selected table
  const fetchTableColumns = async (tableName: string) => {
    if (!tableName) {
      setTableColumns([]);
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/table-records/${tableName}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]).filter(col => 
            col !== 'id' && col !== 'created_at' && col !== 'updated_at'
          );
          setTableColumns(columns);
        } else {
          setTableColumns([]);
        }
      }
    } catch (error) {
      console.error('Error fetching table columns:', error);
      setTableColumns([]);
    }
  };

  const fetchProfiles = async () => {
      try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates`, {
              headers: {
                  'Bypass-Tunnel-Reminder': 'true',
                  'ngrok-skip-browser-warning': 'true'
              },
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
              const data = await res.json();
              setProfiles(data);
          } else {
              console.error("Failed to fetch profiles - Status:", res.status);
              showNotif(`Failed to load templates (Status: ${res.status})`, 'error');
          }
      } catch (e) {
          console.error("Failed to fetch profiles", e);
          if (e instanceof Error && e.name === 'AbortError') {
              showNotif('Loading templates timed out. Backend might be slow or down.', 'error');
          } else {
              showNotif('Failed to connect to server. Check your connection.', 'error');
          }
      } finally {
          setLoading(false);
      }
  };

  const loadProfile = async (key: string) => {
    if (!key) {
        setTemplate({ key: '', fields_config: {} });
        setPreviewUrl(null);
        setPreviewError(null);
        setCsvImport(null);
        setCsvColumns([]);
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
      
      // If this template has CSV data, fetch it
      if (data.id && (!data.source_table || data.source_table === '')) {
        try {
          const csvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${data.id}/import/data`, {
            headers: {
              'Bypass-Tunnel-Reminder': 'true',
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (csvRes.ok) {
            const csvData = await csvRes.json();
            if (csvData.import) {
              setCsvImport(csvData.import);
              setCsvColumns(csvData.import.columns || []);
              setDataSourceType('csv');
            }
          }
        } catch (csvError) {
          console.log('No CSV data for this template');
        }
      }
      
      // Fetch backend PDF dimensions for accurate coordinate mapping
      console.log('=== FETCHING BACKEND DIMENSIONS ===');
      const dimensions = await fetchPdfDimensions(key);
      if (dimensions && Object.keys(dimensions).length > 0) {
        setBackendDimensions(dimensions);
        console.log('✅ Successfully loaded backend dimensions for template:', key, dimensions);
        showNotif(`Backend dimensions loaded: ${Object.keys(dimensions).length} pages`, 'success');
      } else {
        console.warn('❌ Failed to load backend dimensions, using frontend calculations');
        setBackendDimensions(null);
        showNotif('Using frontend dimension calculations (may be less accurate)', 'info');
      }
      console.log('==================================');
      
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
        showNotif("Please provide a Template Name.", 'error');
        return;
    }
    setSaving(true);
    try {
      // First ensure the template exists by calling GET (which creates it via firstOrCreate)
      const getRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const templateData = await getRes.json();
      const templateId = templateData.id;
      
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
            name: template.name || template.key,
            source_table: template.source_table
        }),
      });
      if(res.ok) {
          // Update template with ID
          setTemplate({ ...template, id: templateId });
          
          // If we have a CSV file loaded locally but not uploaded to backend yet, upload it now
          // Check if csvImport has a 'file' property (local) and no 'id' property (backend)
          if (csvImport && csvImport.file && !csvImport.id) {
            try {
              const formData = new FormData();
              formData.append('file', csvImport.file);
              
              const csvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${templateId}/import`, {
                method: 'POST',
                headers: {
                  'Bypass-Tunnel-Reminder': 'true',
                  'ngrok-skip-browser-warning': 'true'
                },
                body: formData
              });
              
              if (csvRes.ok) {
                const csvResult = await csvRes.json();
                console.log('CSV Upload Success:', csvResult);
                setCsvImport(csvResult.import);
                showNotif('Template and CSV saved successfully! 🎉', 'success');
              } else {
                const errorData = await csvRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'CSV upload failed');
              }
            } catch (csvError) {
              console.error('CSV upload error:', csvError);
              showNotif('Template saved, but CSV upload failed: ' + csvError, 'error');
            }
          } else {
            showNotif('Template saved successfully! 🎉', 'success');
          }
          
          if (!profiles.find(p => p.key === template.key)) {
              fetchProfiles(); // Refresh list if new
          }
           
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

  const previewUploadedFile = async (filePath: string, fieldsConfig: any) => {
     if (!filePath) return;
     
     const params = new URLSearchParams();
     params.append('t', Date.now().toString());
     params.append('file_path', filePath);
     
     Object.keys(fieldsConfig).forEach(key => {
         const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         params.append(key, `[${formattedKey}]`);
     });

     try {
       setPreviewError(null);
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/preview-file?${params.toString()}`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
               'Bypass-Tunnel-Reminder': 'true',
               'ngrok-skip-browser-warning': 'true'
           },
           body: params.toString()
       });
       
       if (!res.ok) {
           const errorData = await res.json().catch(() => ({}));
           const message = errorData.error || `HTTP ${res.status} Error`;
           console.error("Preview file failed:", res.status, message);
           setPreviewError(`Preview Error: ${message}`);
           setPreviewUrl(null);
           return;
       }

       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       setPreviewUrl(url);
     } catch(e) {
        console.error("Preview file error:", e);
        setPreviewError("An error occurred while loading preview.");
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
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${encodeURIComponent(keyToUse)}/preview?${params.toString()}`, {
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
    
    const file = e.target.files[0];

    if (!template.key) {
        showNotif("Please enter a Template Name before uploading a PDF.", 'error');
        setFileInputKey(Date.now()); // Reset file input
        return;
    }
    
    // Strict validation: check both MIME type AND file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidMimeType = file.type === 'application/pdf';
    const isValidExtension = fileExtension === 'pdf';
    
    if (!isValidMimeType || !isValidExtension) {
        showNotif("Invalid file type. Please upload a PDF file.", 'error');
        setFileInputKey(Date.now()); // Reset file input
        return;
    }
    
    const formData = new FormData();
    formData.append('pdf', file);

    try {
        setSaving(true);
        
        // Upload the file (this doesn't save to database, just stores the file)
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
        showNotif('PDF uploaded! Click "Save Template" to save changes. 📁', 'success');
        
        // Update local state only - don't save to database yet
        setTemplate({
            ...template,
            fields_config: {},
            file_path: updatedTemplate.file_path
        });
        
        // Automatically preview the uploaded PDF using the new preview-file endpoint
        setPreviewError(null);
        await previewUploadedFile(updatedTemplate.file_path, {});
        setShouldAutoPreview(true); // Enable auto preview for subsequent saves

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

  const handleUpdateField = (fieldKey: string, x: number, y: number) => {
    if (!template || !template.fields_config[fieldKey]) return;
    
    setTemplate({
        ...template,
        fields_config: {
            ...template.fields_config,
            [fieldKey]: {
                ...template.fields_config[fieldKey],
                x,
                y
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

  // Handle clicking column to add as field (allows multiple instances)
  const handleColumnClick = (columnName: string) => {
    if (!template || !previewUrl) {
      showNotif('Please upload and preview a PDF first', 'error');
      return;
    }
    
    // Generate unique field name by adding counter suffix if needed
    let fieldName = columnName;
    let counter = 1;
    
    while (template.fields_config[fieldName]) {
      fieldName = `${columnName}_${counter}`;
      counter++;
    }
    
    // Add field in the center of the page with small random offset to avoid exact overlap
    // A4 page is 210mm x 297mm, so center is approximately x:105, y:148
    const randomOffset = Math.floor(Math.random() * 10); // 0-9mm random offset
    
    setTemplate({
      ...template,
      fields_config: {
        ...template.fields_config,
        [fieldName]: {
          x: 100 + randomOffset,
          y: 145 + randomOffset,
          page: 1,
          font: 'Arial',
          size: 12
        }
      }
    });
    
    showNotif(`Field "${fieldName}" added to PDF`, 'success', 2000);
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

  // CSV/Excel Import handlers
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) {
      showNotif('Please select a file', 'error');
      return;
    }
    
    const file = e.target.files[0];
    
    // Parse CSV locally to get columns without needing template ID
    try {
      const text = await file.text();
      const lines = text.split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).filter(line => line.trim() !== '');
      
      // Store CSV info temporarily
      setCsvImport({
        filename: file.name,
        total_rows: dataRows.length,
        file: file // Store the actual file for later upload
      });
      setCsvColumns(headers);
      setDataSourceType('csv');
      
      showNotif(`CSV loaded! ${dataRows.length} records, ${headers.length} columns found`, 'success');
    } catch (error) {
      console.error('CSV parse error:', error);
      showNotif('Failed to parse CSV: ' + error, 'error');
    }
  };

  const handleRemoveCsvImport = async () => {
    if (!template.id || !csvImport) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${template.id}/import`, {
        method: 'DELETE',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!res.ok) throw new Error('Delete failed');

      setCsvImport(null);
      setCsvColumns([]);
      showNotif('CSV import removed', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showNotif('Failed to remove CSV import: ' + error, 'error');
    }
  };

  const handleCsvColumnClick = (columnName: string, columnIndex: number) => {
    if (!template || !previewUrl) {
      showNotif('Please upload and preview a PDF first', 'error');
      return;
    }
    
    // Generate unique field name
    let fieldName = `csv_${columnName}`;
    let counter = 1;
    
    while (template.fields_config[fieldName]) {
      fieldName = `csv_${columnName}_${counter}`;
      counter++;
    }
    
    // Add field in the center of the page with small random offset to avoid exact overlap
    // A4 page is 210mm x 297mm, so center is approximately x:105, y:148
    const randomOffset = Math.floor(Math.random() * 10); // 0-9mm random offset
    
    setTemplate({
      ...template,
      fields_config: {
        ...template.fields_config,
        [fieldName]: {
          x: 100 + randomOffset,
          y: 145 + randomOffset,
          page: 1,
          font: 'Arial',
          size: 12,
          csv_column: columnName,
          csv_index: columnIndex
        }
      }
    });
    
    showNotif(`CSV column "${columnName}" added to PDF`, 'success', 2000);
  };

  // Bulk PDF Generation with Preview
  const handleBulkGenerate = async () => {
    if (!template.id) {
      showNotif('Please save the template first', 'error');
      return;
    }
    
    if (!csvImport) {
      showNotif('Please upload a CSV file first', 'error');
      return;
    }
    
    // If CSV is not uploaded to backend yet (no id), upload it now
    if (!csvImport.id && csvImport.file) {
      showNotif('Uploading CSV to server...', 'info');
      try {
        const formData = new FormData();
        formData.append('file', csvImport.file);
        
        const csvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${template.id}/import`, {
          method: 'POST',
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          },
          body: formData
        });
        
        if (!csvRes.ok) {
          const errorData = await csvRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'CSV upload failed');
        }
        
        const csvResult = await csvRes.json();
        setCsvImport(csvResult.import);
        showNotif('CSV uploaded successfully!', 'success');
        // Continue with bulk generation after CSV upload
      } catch (error) {
        console.error('CSV upload error:', error);
        showNotif('CSV upload failed: ' + error, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${template.id}/generate-bulk`, {
        method: 'POST',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: template.fields_config
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Bulk generation failed');
      }

      // Get JSON response with file paths
      const result = await res.json();
      console.log('Bulk generation result:', result);
      
      // Create URLs for each PDF using the view endpoint
      const pdfUrls: string[] = [];
      for (let i = 1; i <= result.total_records; i++) {
        const viewUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/bulk-view/${result.session_id}/${i}`;
        pdfUrls.push(viewUrl);
      }
      
      // Set bulk PDF URLs and session info
      setBulkPdfUrls(pdfUrls);
      setBulkSessionId(result.session_id);
      setBulkTotalPages(result.total_records);
      setBulkCurrentPage(1);
      
      // Fetch CSV data for record display
      const dataRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${template.id}/import/data`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          'ngrok-skip-browser-warning': 'true',
        }
      });
      
      if (dataRes.ok) {
        const csvDataResult = await dataRes.json();
        if (csvDataResult.data && csvDataResult.data[0]) {
          setCurrentRecordData(csvDataResult.data[0]);
        }
      }
      
      showNotif(`✅ Generated ${result.total_records} individual PDFs!`, 'success');
    } catch (error) {
      console.error('Bulk generation error:', error);
      showNotif(`Bulk generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Download current record's PDF only
  const handleDownloadCurrentPdf = () => {
    if (!bulkSessionId || bulkCurrentPage < 1) return;
    
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/bulk-download/${bulkSessionId}/${bulkCurrentPage}`;
    window.open(downloadUrl, '_blank');
  };

  // Download all PDFs as ZIP
  const handleDownloadAllPdfs = () => {
    if (!bulkSessionId) return;
    
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/bulk-download-all/${bulkSessionId}`;
    window.open(downloadUrl, '_blank');
  };

  // Navigate bulk PDF pages
  const handleBulkPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= bulkTotalPages) {
      setBulkCurrentPage(newPage);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading templates...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border transition-colors duration-300" role="banner">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-400/10 dark:to-indigo-400/10"></div>
          <div className="relative max-w-full mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PDF Template Editor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs transition-colors duration-300">Create and manage PDF field templates with precision</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border-2 border-gray-300 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
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

      {/* Scrollable Columns Section - Show database fields OR CSV columns */}
      {((dataSourceType === 'database' && template.source_table && tableColumns.length > 0) || 
        (dataSourceType === 'csv' && csvImport && csvColumns.length > 0)) && (
        <div className="max-w-full mx-auto px-6 py-2">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-200 dark:border-dark-border p-4 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {dataSourceType === 'database' ? `Available Fields from ${template.source_table}` : 'Available Columns from CSV/Excel'}
                </h3>
                <p className="text-xs text-gray-500">
                  {dataSourceType === 'database' ? 'Click a field to add it to your PDF template' : 'Click a column to add it to your PDF template'}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2 min-w-min">
                {dataSourceType === 'database' && tableColumns.map((col) => (
                  <button
                    key={col}
                    onClick={() => handleColumnClick(col)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                    title={`Click to add "${col}" field (can add multiple times)`}
                  >
                    {col}
                  </button>
                ))}
                {dataSourceType === 'csv' && csvColumns.map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCsvColumnClick(col, idx)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                    title={`Click to add "${col}" column (can add multiple times)`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          
          {/* Sidebar Editor */}
          <section className="col-span-4 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300" aria-label="Configuration Panel">
            <div className="p-5 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex-shrink-0 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">Configuration</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Configure fields and coordinates</p>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 p-5 overflow-y-auto" style={{ height: 'calc(100vh - 280px)' }}>
              
              {/* MODE: DATABASE - Table Selection */}
              {mode === 'database' && (
                <div className="mb-5">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl transition-colors duration-300">
                    <label htmlFor="source-table-select" className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 transition-colors duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Select Database Table
                    </label>
                    <select 
                      id="source-table-select"
                      name="sourceTableSelect"
                      value={template.source_table || ''} 
                      onChange={(e) => {
                        const selectedTable = e.target.value;
                        setTemplate({ ...template, source_table: selectedTable, key: '' });
                        fetchTableColumns(selectedTable);
                      }}
                      className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm font-medium transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-600"
                    >
                      <option value="">-- Select Table --</option>
                      {availableTables.map(table => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* MODE: CSV - Step-by-Step Workflow */}
              {mode === 'csv' && (
                <>
                  {/* Step 1: CSV Upload */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">Step 1: Upload CSV/Excel</h3>
                    </div>
                    {!csvImport ? (
                      <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6 text-center bg-white dark:bg-dark-card hover:border-green-500 dark:hover:border-green-600 transition-all duration-300">
                        <input 
                          id="csv-upload-input"
                          name="csvUploadInput"
                          type="file" 
                          accept=".csv,.xlsx,.xls"
                          onChange={handleCsvUpload}
                          className="hidden"
                        />
                        <label htmlFor="csv-upload-input" className="cursor-pointer block">
                          <div className="text-5xl mb-2">📤</div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 transition-colors duration-300">Click to upload CSV/Excel</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Supported: .csv, .xlsx, .xls (Max 10MB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 transition-colors duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-green-900 dark:text-green-300 transition-colors duration-300">✅ {csvImport.filename}</p>
                            <p className="text-xs text-green-700 dark:text-green-400 transition-colors duration-300">{csvImport.total_rows} records • {csvColumns.length} columns</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCsvImport}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Template Selection (only show after CSV upload) */}
                  {csvImport && (
                    <>
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">Step 2: Select or Create Template</h3>
                        </div>
                        <select
                          value={template.key || ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              setTemplate({ key: '', fields_config: {}, name: '' });
                            } else {
                              loadProfile(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm font-medium transition-all mb-3"
                        >
                          <option value="">-- Create New Template --</option>
                          {profiles
                            .filter(p => !p.source_table || p.source_table === '')
                            .map(p => (
                              <option key={p.key} value={p.key}>{p.name || p.key}</option>
                            ))}
                        </select>

                        {/* Template Name Input (only if creating new) */}
                        {!template.key && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
                              Template Name *
                            </label>
                            <input
                              type="text"
                              value={template.name || ''}
                              onChange={(e) => setTemplate({ ...template, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                              placeholder="e.g., Certificate Template, Invoice Template"
                              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors duration-200"
                              required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                              Enter a unique name for this template
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Step 3: PDF Upload (only show after template selection) */}
                      {template.name && (
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">Step 3: Upload PDF Template</h3>
                          </div>
                          <div className="mb-5 p-4 border-2 border-dashed border-indigo-300 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                              </svg>
                              <h3 className="text-sm font-bold text-indigo-900">PDF Template File</h3>
                            </div>
                            <input 
                              id="pdf-file-upload"
                              name="pdfFileUpload"
                              key={fileInputKey}
                              type="file" 
                              accept=".pdf"
                              onChange={handleFileUpload}
                              className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 file:cursor-pointer file:transition-all file:duration-200"
                            />
                            <p className="text-xs text-indigo-700 mt-2">Maximum file size: 10MB</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Profile Selection - Only for database mode */}
              {dataSourceType === 'database' && template.source_table && (
              <div className={`mb-4 p-3 border border-blue-200 rounded-lg ${!template.source_table ? 'bg-gray-100 opacity-60' : 'bg-blue-50'}`}>
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
                  disabled={!template.source_table}
                  className={`w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${!template.source_table ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
                >
                  <option value="">-- Create New Template --</option>
                  {filteredTemplates.map(p => (
                      <option key={p.key} value={p.key}>{p.name || p.key}</option>
                  ))}
                </select>
                {!template.source_table && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Please select a source table first
                  </p>
                )}
                {template.source_table && filteredTemplates.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No templates for {template.source_table} table yet
                  </p>
                )}
              </div>
              )}

              {/* Template Name Input */}
              <div className="mb-5">
                <label htmlFor="profile-key" className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors duration-300">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  Template Name
                </label>
                <input 
                  id="profile-key"
                  name="profileKey"
                  type="text"
                  value={template.key}
                  onChange={(e) => setTemplate({ ...template, key: e.target.value })}
                  placeholder="Enter template name (e.g. certificate, form)"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 font-medium text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Change this to create or edit a different template
                </p>
              </div>

              {/* PDF Upload */}
              <div className="mb-5 p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 transition-colors duration-300">
                <label htmlFor="pdf-upload" className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-white mb-3 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  Upload PDF Template
                </label>
                <input 
                  id="pdf-upload"
                  name="pdfUpload"
                  type="file" 
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  key={fileInputKey}
                  className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 file:transition-all file:duration-200 file:shadow-md hover:file:shadow-lg cursor-pointer"
                />
                <p className="text-xs text-indigo-700 dark:text-gray-300 mt-3 flex items-center gap-1 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Upload your PDF template file. After upload, click Preview to view it
                </p>
              </div>

              {/* Fields Configuration */}
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Field Coordinates
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold transition-colors duration-300">
                    {Object.keys(template.fields_config || {}).length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
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
                      <div className="text-center py-12 px-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                        <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors duration-300">No fields configured</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">Click anywhere on the PDF preview to add a field</p>
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="flex-shrink-0 p-5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-t-2 border-blue-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !template.key}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    saving || !template.key
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                      </svg>
                      <span>Save Template</span>
                    </>
                  )}
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePreview()}
                    disabled={!template.key}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      !template.key
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Preview
                  </button>
                  
                  {csvImport && (
                    <button
                      onClick={handleBulkGenerate}
                      disabled={!template.id || !csvImport || saving}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        !template.id || !csvImport || saving
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
                      </svg>
                      Bulk Generate ({csvImport.total_rows} PDFs)
                    </button>
                  )}
                  
                  {profiles.some(p => p.key === template.key) && (
                     <button
                        onClick={handleDelete}
                        disabled={saving}
                        className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                          saving
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg'
                        }`}
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete
                     </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* PDF Preview */}
          <section className="col-span-8 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden hover:shadow-2xl transition-all duration-300" aria-label="PDF Preview">
            <div className="p-5 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      {bulkPdfUrls.length > 0 ? 'Bulk PDF Preview' : 'PDF Preview'}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white transition-colors duration-300">
                    {bulkPdfUrls.length > 0 
                      ? `Viewing record ${bulkCurrentPage} of ${bulkTotalPages}`
                      : 'Click on the PDF to add field coordinates. Drag existing field markers to reposition them.'
                    }
                  </p>
                </div>
                
                {bulkPdfUrls.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {bulkCurrentPage >= 3 && (
                        <button
                          onClick={() => handleBulkPageChange(1)}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="First"
                        >
                          First
                        </button>
                      )}
                      {bulkCurrentPage >= 2 && (
                        <button
                          onClick={() => handleBulkPageChange(bulkCurrentPage - 1)}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="Previous"
                        >
                          Previous
                        </button>
                      )}
                      {bulkCurrentPage < bulkTotalPages && (
                        <button
                          onClick={() => handleBulkPageChange(bulkCurrentPage + 1)}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="Next"
                        >
                          Next
                        </button>
                      )}
                      {bulkCurrentPage < bulkTotalPages - 1 && (
                        <button
                          onClick={() => handleBulkPageChange(bulkTotalPages)}
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="Last"
                        >
                          Last
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleDownloadCurrentPdf}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                    >
                      Download This
                    </button>
                    <button
                      onClick={handleDownloadAllPdfs}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                    >
                      Download All (ZIP)
                    </button>
                    <button
                      onClick={() => {
                        setBulkPdfUrls([]);
                        setBulkSessionId(null);
                        setBulkTotalPages(0);
                        setBulkCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 h-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-bg dark:to-dark-bg overflow-auto transition-colors duration-300">
              <div className="flex items-start justify-center h-full min-h-96">
                {bulkPdfUrls.length > 0 ? (
                  <div className="max-w-4xl w-full">
                    <div className="bg-white dark:bg-white rounded-lg shadow-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3 p-3 bg-purple-50 dark:bg-purple-50 border border-purple-200 dark:border-purple-200 rounded-lg transition-colors duration-300">
                        <div>
                          <p className="font-semibold text-purple-800 dark:text-gray-900 transition-colors duration-300">
                            Record {bulkCurrentPage} of {bulkTotalPages}
                          </p>
                          <p className="text-sm text-purple-600 dark:text-gray-700 transition-colors duration-300">
                            This is how page {bulkCurrentPage} looks in your bulk PDF
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={bulkTotalPages}
                            value={bulkCurrentPage}
                            onChange={(e) => {
                              const page = parseInt(e.target.value);
                              if (!isNaN(page) && page >= 1 && page <= bulkTotalPages) {
                                handleBulkPageChange(page);
                              }
                            }}
                            className="w-20 px-3 py-2 border rounded text-center font-medium"
                            placeholder="Page"
                          />
                        </div>
                      </div>
                      
                      <iframe
                        src={bulkPdfUrls[bulkCurrentPage - 1]}
                        className="w-full h-[700px] border rounded"
                        title={`Bulk PDF Preview - Page ${bulkCurrentPage}`}
                      />
                    </div>
                  </div>
                ) : previewError ? (
                    <div className="text-center mt-20">
                        <svg className="w-20 h-20 mx-auto mb-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        <h4 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-2 transition-colors duration-300">Preview Error</h4>
                        <p className="text-orange-600 dark:text-orange-400 max-w-md text-sm transition-colors duration-300">{previewError}</p>
                        {!template.file_path && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 transition-colors duration-300">
                            Upload a PDF template to get started
                          </p>
                        )}
                    </div>
                ) : previewUrl ? (
                    <div className="max-w-full">
                      <PDFViewer 
                        url={previewUrl} 
                        template={template} 
                        onAddField={handleAddField}
                        onUpdateField={handleUpdateField}
                        backendDimensions={backendDimensions || undefined}
                      />
                    </div>
                ) : (
                    <div className="text-center mt-20">
                        <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300">No Preview Available</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 transition-colors duration-300">Click "Preview" button to view your PDF template</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                          </svg>
                          Tip: Upload a PDF file first
                        </div>
                    </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 animate-fade-in" role="alert" aria-live="polite">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowNotification(false)}></div>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-2xl transform transition-all relative z-10 max-w-md w-full border border-gray-200 dark:border-dark-border animate-scale-in">
            <div className="flex items-start gap-4 mb-6">
              <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                notificationType === 'success' ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' :
                notificationType === 'error' ? 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30' : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30'
              }`}>
                {notificationType === 'success' ? (
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notificationType === 'error' ? (
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                  notificationType === 'success' ? 'text-emerald-900 dark:text-emerald-300' :
                  notificationType === 'error' ? 'text-red-900 dark:text-red-300' : 'text-blue-900 dark:text-blue-300'
                }`}>
                  {notificationType === 'success' ? 'Success!' :
                   notificationType === 'error' ? 'Error' : 'Info'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">{notificationMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowNotification(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
