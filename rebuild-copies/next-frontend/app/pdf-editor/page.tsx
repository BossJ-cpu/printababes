'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';import ThemeToggle from '../components/ThemeToggle';
import * as XLSX from 'xlsx';

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
  width?: number;
  wrap_text?: boolean;
  align?: 'left' | 'center' | 'right';
};

type ImageConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
  dataUrl: string; // Base64 encoded image
  name: string;
  recordRange?: string; // e.g., "1-10, 15, 20-25" or empty for all records
};

type TemplateConfig = {
  id?: number;
  key: string;
  name?: string;
  fields_config: Record<string, FieldConfig>;
  images_config?: Record<string, ImageConfig>;
  file_path?: string;
  source_table?: string;
  data_source_type?: 'database' | 'csv' | 'erp';
};

// Subcomponent: Field Row with Optimized Design
const FieldRow: React.FC<{ 
  fieldName: string;
  config: FieldConfig;
  isSelected: boolean;
  onSelect: (fieldName: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onUpdate: (field: string, key: keyof FieldConfig, value: string | number | boolean) => void;
  onRemove: (field: string) => void;
}> = ({ 
  fieldName, 
  config, 
  isSelected,
  onSelect,
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
        <div 
          className={`relative p-3 bg-white dark:bg-dark-card border-2 rounded-md shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
            isSelected 
              ? 'border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20' 
              : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600'
          }`}
          onClick={() => onSelect(fieldName)}
        >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 shadow-md">
                ✓
              </div>
            )}
            
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(fieldName); }}
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
                    onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg rounded text-sm font-medium text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                        min="6"
                        max="72"
                    />
                </div>
            </div>
            
            {/* Width and Wrap Text */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label htmlFor={`width-${fieldName}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
                      Width (mm)
                    </label>
                    <input
                        id={`width-${fieldName}`}
                        name={`width-${fieldName}`}
                        type="number"
                        value={config.width || ''}
                        placeholder="Auto"
                        onChange={(e) => onUpdate(fieldName, 'width', e.target.value ? Number(e.target.value) : 0)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg rounded text-sm font-medium text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                        min="0"
                        step="1"
                    />
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={config.wrap_text || false}
                            onChange={(e) => onUpdate(fieldName, 'wrap_text', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">Wrap Text</span>
                    </label>
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
                            onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                            step="0.1"
                        />
                    </div>
                </div>
            </div>
            
            {/* Keyboard nav hint */}
            {isSelected && (
              <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-center">
                ⌨️ Use Arrow keys to move (Shift = faster)
              </div>
            )}
        </div>
    );
};

export default function PdfEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') as 'database' | 'csv' | 'erp' | null;
  
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
  const [dataSourceType, setDataSourceType] = useState<'database' | 'csv' | 'erp' | null>(mode);
  
  // Bulk PDF preview state - updated to handle individual PDFs
  const [bulkPdfUrls, setBulkPdfUrls] = useState<string[]>([]);
  const [bulkSessionId, setBulkSessionId] = useState<string | null>(null);
  const [bulkTotalPages, setBulkTotalPages] = useState<number>(0);
  const [bulkCurrentPage, setBulkCurrentPage] = useState<number>(1);
  const [currentRecordData, setCurrentRecordData] = useState<string[]>([]);

  // Field selection for keyboard navigation and properties popup
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Image/Signature upload state
  const [uploadedImages, setUploadedImages] = useState<Record<string, ImageConfig>>({});
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Draw signature state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureStrokes, setSignatureStrokes] = useState<{x: number; y: number}[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penThickness, setPenThickness] = useState(3);
  const [signatureRecordRange, setSignatureRecordRange] = useState('');
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // Redirect if no valid mode
  useEffect(() => {
    if (!mode || (mode !== 'database' && mode !== 'csv' && mode !== 'erp')) {
      router.push('/');
    } else {
      setDataSourceType(mode);
    }
  }, [mode, router]);

  // Keyboard navigation for selected field or image
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we have a selected field or image
      const hasSelectedField = selectedFieldKey !== null && template.fields_config && template.fields_config[selectedFieldKey];
      const hasSelectedImage = selectedImageKey !== null && uploadedImages[selectedImageKey];
      
      if (!hasSelectedField && !hasSelectedImage) return;

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      e.preventDefault(); // Prevent scrolling
      
      // Convert pixels to mm (approximately 3.78 pixels per mm at 96 DPI)
      const pixelsPerMm = 3.78;
      const stepPixels = e.shiftKey ? 10 : 5; // 5px default, 10px with Shift
      const step = stepPixels / pixelsPerMm; // Convert to mm for positioning
      let dx = 0; 
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
      }

      // Move field if selected
      if (hasSelectedField) {
        setTemplate(prev => {
          const fieldConfig = prev.fields_config[selectedFieldKey!];
          if (!fieldConfig) return prev;
          
          return {
            ...prev,
            fields_config: {
              ...prev.fields_config,
              [selectedFieldKey!]: {
                ...fieldConfig,
                x: Math.max(0, fieldConfig.x + dx),
                y: Math.max(0, fieldConfig.y + dy)
              }
            }
          };
        });
      }
      
      // Move image if selected
      if (hasSelectedImage) {
        setUploadedImages(prev => {
          const imageConfig = prev[selectedImageKey!];
          if (!imageConfig) return prev;
          
          return {
            ...prev,
            [selectedImageKey!]: {
              ...imageConfig,
              x: Math.max(0, parseFloat((imageConfig.x + dx).toFixed(1))),
              y: Math.max(0, parseFloat((imageConfig.y + dy).toFixed(1)))
            }
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldKey, template.fields_config, selectedImageKey, uploadedImages]);

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
        const filteredTables = (data.tables || []).filter((table: string) => table !== 'data_imports');
        setAvailableTables(filteredTables);
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
          const timeoutId = setTimeout(() => {
              controller.abort('Request timeout after 30 seconds');
          }, 30000); // 30 second timeout (increased from 10)
          
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
              console.warn('Template loading timed out - backend may be slow');
              showNotif('Loading templates timed out. Backend might be slow or down.', 'info');
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
      
      // Load images_config into uploadedImages state
      if (data.images_config && typeof data.images_config === 'object') {
        setUploadedImages(data.images_config);
      } else {
        setUploadedImages({});
      }
      
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

  const handleFieldChange = (field: string, key: keyof FieldConfig, value: string | number | boolean) => {
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
      
      // Now update with our data (including images)
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
            images_config: uploadedImages, // Include images
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
              setUploadedImages({});
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

  // Handle image upload for signatures/stamps
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotif('Please upload an image file (PNG, JPG, etc.)', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotif('Image size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Scale down if too large (max 150px width for signatures)
        let width = img.width;
        let height = img.height;
        const maxWidth = 150;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        // Convert to mm (approximately 3.78 pixels per mm)
        const widthMm = Math.round(width / 3.78);
        const heightMm = Math.round(height / 3.78);

        // Generate unique key
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        let imageKey = baseName;
        let counter = 1;
        while (uploadedImages[imageKey]) {
          imageKey = `${baseName}_${counter}`;
          counter++;
        }

        const newImage: ImageConfig = {
          x: 100, // Center of page approximately
          y: 200,
          width: widthMm,
          height: heightMm,
          page: 1,
          dataUrl: dataUrl,
          name: file.name
        };

        setUploadedImages(prev => ({
          ...prev,
          [imageKey]: newImage
        }));

        showNotif(`Image "${file.name}" uploaded! Drag it onto the PDF to position.`, 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Handle image position update
  const handleImagePositionUpdate = (imageKey: string, x: number, y: number) => {
    setUploadedImages(prev => ({
      ...prev,
      [imageKey]: {
        ...prev[imageKey],
        x,
        y
      }
    }));
  };

  // Handle image property change (width, height, page)
  const handleImagePropertyChange = (imageKey: string, property: keyof ImageConfig, value: number | string) => {
    setUploadedImages(prev => ({
      ...prev,
      [imageKey]: {
        ...prev[imageKey],
        [property]: value
      }
    }));
  };

  // Handle image removal
  const handleRemoveImage = (imageKey: string) => {
    setUploadedImages(prev => {
      const newImages = { ...prev };
      delete newImages[imageKey];
      return newImages;
    });
    if (selectedImageKey === imageKey) {
      setSelectedImageKey(null);
    }
    showNotif('Image removed', 'info');
  };

  // Draw signature handlers
  const openSignatureModal = () => {
    setShowSignatureModal(true);
    setSignatureStrokes([]);
    setSignatureRecordRange('');
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    setSignatureStrokes([]);
    setSignatureRecordRange('');
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setSignatureStrokes(prev => [...prev, [coords]]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCanvasCoordinates(e);
    setSignatureStrokes(prev => {
      const newStrokes = [...prev];
      const currentStroke = newStrokes[newStrokes.length - 1];
      if (currentStroke) {
        currentStroke.push(coords);
      }
      return newStrokes;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    setSignatureStrokes([]);
  };

  const undoLastStroke = () => {
    setSignatureStrokes(prev => prev.slice(0, -1));
  };

  // Redraw canvas when strokes change
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = penThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    signatureStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  }, [signatureStrokes, penThickness]);

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || signatureStrokes.length === 0) {
      showNotif('Please draw a signature first', 'error');
      return;
    }
    
    // Get the bounding box of the signature
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    signatureStrokes.forEach(stroke => {
      stroke.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    // Add padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    // Create a cropped canvas with just the signature
    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;
    
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;
    
    // Fill with transparent background
    croppedCtx.clearRect(0, 0, croppedWidth, croppedHeight);
    
    // Draw strokes on cropped canvas
    croppedCtx.strokeStyle = 'black';
    croppedCtx.lineWidth = penThickness;
    croppedCtx.lineCap = 'round';
    croppedCtx.lineJoin = 'round';
    
    signatureStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      
      croppedCtx.beginPath();
      croppedCtx.moveTo(stroke[0].x - minX, stroke[0].y - minY);
      
      for (let i = 1; i < stroke.length; i++) {
        croppedCtx.lineTo(stroke[i].x - minX, stroke[i].y - minY);
      }
      croppedCtx.stroke();
    });
    
    const dataUrl = croppedCanvas.toDataURL('image/png');
    
    // Convert to mm (approximately 3.78 pixels per mm)
    const widthMm = Math.round(croppedWidth / 3.78);
    const heightMm = Math.round(croppedHeight / 3.78);
    
    // Generate unique key
    const timestamp = Date.now();
    let imageKey = `drawn_signature_${timestamp}`;
    let counter = 1;
    while (uploadedImages[imageKey]) {
      imageKey = `drawn_signature_${timestamp}_${counter}`;
      counter++;
    }
    
    const newImage: ImageConfig = {
      x: 100,
      y: 200,
      width: widthMm,
      height: heightMm,
      page: 1,
      dataUrl: dataUrl,
      name: 'Drawn Signature',
      recordRange: signatureRecordRange.trim() || undefined // Empty means all records
    };
    
    setUploadedImages(prev => ({
      ...prev,
      [imageKey]: newImage
    }));
    
    const rangeMsg = signatureRecordRange.trim() 
      ? ` (for records: ${signatureRecordRange})` 
      : ' (for all records)';
    showNotif(`Signature added${rangeMsg}! Drag it onto the PDF to position.`, 'success');
    closeSignatureModal();
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
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let headers: string[] = [];
      let dataRowCount = 0;
      
      if (fileExtension === 'csv') {
        // Parse CSV file
        const text = await file.text();
        const lines = text.split('\n');
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row');
        }
        
        headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        dataRowCount = lines.slice(1).filter(line => line.trim() !== '').length;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file using xlsx library
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON to get headers and data
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel file must have at least a header row and one data row');
        }
        
        // First row is headers
        headers = (jsonData[0] as unknown[]).map(h => String(h || '').trim());
        dataRowCount = jsonData.length - 1; // Exclude header row
      } else {
        throw new Error('Unsupported file type. Please upload a .csv, .xlsx, or .xls file');
      }
      
      // Filter out empty headers
      headers = headers.filter(h => h !== '');
      
      if (headers.length === 0) {
        throw new Error('No valid column headers found in the file');
      }
      
      // Store CSV/Excel info temporarily
      setCsvImport({
        filename: file.name,
        total_rows: dataRowCount,
        file: file // Store the actual file for later upload
      });
      setCsvColumns(headers);
      setDataSourceType('csv');
      
      showNotif(`File loaded! ${dataRowCount} records, ${headers.length} columns found`, 'success');
    } catch (error) {
      console.error('File parse error:', error);
      showNotif('Failed to parse file: ' + error, 'error');
    }
  };

  const handleRemoveCsvImport = async () => {
    if (!csvImport) return;

    // If template has been saved to backend, also delete from server
    if (template.id) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${template.id}/import`, {
          method: 'DELETE',
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (!res.ok) {
          console.warn('Server delete failed, but will clear local state anyway');
        }
      } catch (error) {
        console.warn('Server delete error:', error);
        // Continue to clear local state even if server delete fails
      }
    }

    // Always clear local state
    setCsvImport(null);
    setCsvColumns([]);
    showNotif('CSV/Excel import removed', 'success');
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

  // Handle drag-and-drop field placement from sidebar
  const handleDropField = (fieldName: string, x: number, y: number, page: number) => {
    if (!template) return;
    
    // Determine if it's a CSV column (includes index info) or database column
    const isCSV = fieldName.startsWith('csv_');
    const parts = fieldName.split('|');
    const baseName = parts[0];
    const columnIndex = parts[1] ? parseInt(parts[1]) : undefined;
    const columnName = isCSV ? baseName.replace('csv_', '') : baseName;
    
    // Generate unique field name
    let uniqueFieldName = baseName;
    let counter = 1;
    while (template.fields_config[uniqueFieldName]) {
      uniqueFieldName = `${baseName}_${counter}`;
      counter++;
    }
    
    setTemplate({
      ...template,
      fields_config: {
        ...template.fields_config,
        [uniqueFieldName]: {
          x,
          y,
          page,
          font: 'Arial',
          size: 12,
          ...(columnIndex !== undefined && { csv_column: columnName, csv_index: columnIndex })
        }
      }
    });
    
    // Select the newly added field
    setSelectedFieldKey(uniqueFieldName);
    showNotif(`Field "${columnName}" dropped at (${x.toFixed(1)}, ${y.toFixed(1)}) on page ${page}`, 'success', 2000);
  };

  // Handle property changes from PDFViewer popup
  const handleFieldPropertyChange = (fieldKey: string, property: string, value: number | boolean) => {
    if (!template || !template.fields_config[fieldKey]) return;
    
    setTemplate({
      ...template,
      fields_config: {
        ...template.fields_config,
        [fieldKey]: {
          ...template.fields_config[fieldKey],
          [property]: value
        }
      }
    });
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
    <>
      {/* Force scrollbars to always show on Windows */}
      <style jsx global>{`
        .pdf-preview-scroll::-webkit-scrollbar {
          width: 12px !important;
          display: block !important;
        }
        .pdf-preview-scroll::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 10px;
        }
        .pdf-preview-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .pdf-preview-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        .config-scroll::-webkit-scrollbar {
          width: 12px !important;
          display: block !important;
        }
        .config-scroll::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 10px;
        }
        .config-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .config-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        
        /* Force scrollbars to always be visible and enable per-page scroll snapping */
        .pdf-preview-scroll,
        .config-scroll {
          overflow-y: scroll !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f1f5f9 !important;
        }

        /* Enable whole-page snapping inside the PDF preview area */
        .pdf-preview-scroll {
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
        }

        /* Make direct children snap to the container (pages rendered by PDFViewer) */
        .pdf-preview-scroll > div > * {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg transition-colors duration-300">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border transition-colors duration-300" role="banner">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-400/10 dark:to-indigo-400/10"></div>
          <div className="relative max-w-full mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:text-white dark:bg-none">PDF Template Editor</h1>
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

      <div className="flex-1 max-w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Sidebar Editor */}
          <section className="col-span-4 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border flex flex-col hover:shadow-2xl transition-all duration-300" aria-label="Configuration Panel">
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
            <div className="p-5">
              
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
                              setUploadedImages({});
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
                        {!template.id && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
                              Template Name *
                            </label>
                            <input
                              type="text"
                              value={template.name || ''}
                              onChange={(e) => {
                                const name = e.target.value;
                                const key = name.toLowerCase().replace(/\s+/g, '_');
                                setTemplate({ ...template, name: name, key: key });
                              }}
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
                    </>
                  )}
                </>
              )}

              {/* MODE: ERP - DocType Selection */}
              {mode === 'erp' && (
                <div className="mb-5">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl transition-colors duration-300">
                    <label htmlFor="erp-doctype-select" className="flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-300 mb-3 transition-colors duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Select ERP DocType
                    </label>
                    <select 
                      id="erp-doctype-select"
                      name="erpDocTypeSelect"
                      value={template.source_table || ''} 
                      onChange={(e) => {
                        const selectedDocType = e.target.value;
                        setTemplate({ ...template, source_table: selectedDocType, key: '' });
                        // For now we simulate fetching columns
                        if(selectedDocType) {
                             setTableColumns(['name', 'customer_name', 'grand_total', 'status', 'posting_date', 'company', 'currency']); 
                        } else {
                             setTableColumns([]);
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm font-medium transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-600"
                    >
                      <option value="">-- Select DocType --</option>
                      <option value="Sales Order">Sales Order</option>
                      <option value="Sales Invoice">Sales Invoice</option>
                      <option value="Customer">Customer</option>
                      <option value="Quotation">Quotation</option>
                      <option value="Item">Item</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Profile Selection - Database or ERP */}
              {(dataSourceType === 'database' || dataSourceType === 'erp') && template.source_table && (
              <div className={`mb-4 p-3 border rounded-lg ${!template.source_table ? 'bg-gray-100 opacity-60' : (
                dataSourceType === 'erp' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              )} transition-colors duration-300`}>
                <label htmlFor="profile-select" className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  dataSourceType === 'erp' 
                    ? 'text-purple-900 dark:text-purple-300' 
                    : 'text-blue-900 dark:text-blue-300'
                }`}>
                  Select Existing Template
                </label>
                <select 
                  id="profile-select"
                  name="profileSelect"
                  value={template.key} 
                  onChange={(e) => {
                      if (e.target.value === '') {
                           setTemplate(prev => ({ 
                               ...prev, 
                               key: '', 
                               id: undefined, 
                               name: '',
                               fields_config: {}
                           }));
                           setUploadedImages({});
                           setPreviewUrl(null);
                           setPreviewError(null);
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

                {/* Template Name Input - Database Mode */}
                {!template.id && template.source_table && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-300">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={template.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        const key = name.toLowerCase().replace(/\s+/g, '_');
                        setTemplate({ ...template, name: name, key: key });
                      }}
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
              )}

              {/* Configuration Section - ALWAYS SHOW */}
              <div className="mb-5 p-4 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-blue-50 dark:bg-blue-900/20 transition-colors duration-300">
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-4 transition-colors duration-300">📋 Configuration</h3>
                
                {/* PDF Upload - ALWAYS SHOW */}
                <div className="mb-4 p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 transition-colors duration-300">
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

                {/* Image/Signature Upload */}
                <div className="mb-4 p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-900 transition-colors duration-300">
                  <label htmlFor="image-upload" className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-white mb-3 transition-colors duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Add Image / E-Signature
                  </label>
                  <input 
                    ref={imageInputRef}
                    id="image-upload"
                    name="imageUpload"
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-emerald-600 file:to-teal-600 file:text-white hover:file:from-emerald-700 hover:file:to-teal-700 file:transition-all file:duration-200 file:shadow-md hover:file:shadow-lg cursor-pointer"
                  />
                  <p className="text-xs text-emerald-700 dark:text-gray-300 mt-3 flex items-center gap-1 transition-colors duration-300">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Upload PNG/JPG images for signatures, stamps, or logos (max 2MB)
                  </p>

                  {/* Draw Signature Button */}
                  <button
                    type="button"
                    onClick={openSignatureModal}
                    className="mt-3 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-800 dark:text-amber-300 font-semibold text-sm hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                    ✍️ Draw Signature
                  </button>

                  {/* Uploaded Images List */}
                  {Object.keys(uploadedImages).length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Uploaded Images:</p>
                      {Object.entries(uploadedImages).map(([key, img]) => (
                        <div 
                          key={key}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            selectedImageKey === key 
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                              : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 hover:border-emerald-400'
                          }`}
                        >
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setSelectedImageKey(key)}
                          >
                            <img 
                              src={img.dataUrl} 
                              alt={img.name}
                              className="w-10 h-10 object-contain rounded border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{img.name}</p>
                              <p className="text-xs text-gray-500">
                                {img.width}×{img.height}mm | Page {img.page}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(key); }}
                              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                          {/* Record Range Input for each image */}
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                Records:
                              </label>
                              <input
                                type="text"
                                value={img.recordRange || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleImagePropertyChange(key, 'recordRange', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="All records"
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {img.recordRange ? `Only: ${img.recordRange}` : 'Applies to all records'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                        isSelected={selectedFieldKey === fieldName}
                        onSelect={(name) => setSelectedFieldKey(name)}
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

          {/* PDF Preview Column */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Scrollable Columns Section - Show database fields OR CSV columns OR ERP fields */}
            {((dataSourceType === 'database' && template.source_table && tableColumns.length > 0) || 
              (dataSourceType === 'csv' && csvImport && csvColumns.length > 0) ||
              (dataSourceType === 'erp' && template.source_table && tableColumns.length > 0)) && (
              <div className="flex-shrink-0 bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-200 dark:border-dark-border p-4 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      {dataSourceType === 'csv' ? 'Available Columns from CSV/Excel' : `Available Fields from ${template.source_table}`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {dataSourceType === 'csv' ? 'Click a column to add it to your PDF template' : 'Click a field to add it to your PDF template'}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 pb-2 min-w-min">
                    {(dataSourceType === 'database' || dataSourceType === 'erp') && tableColumns.map((col) => (
                      <div
                        key={col}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('fieldName', col);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleColumnClick(col)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing ${
                          dataSourceType === 'erp' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                        }`}
                        title={`Drag onto PDF or click to add "${col}" field`}
                      >
                        <span className="mr-1.5">⊕</span>{col}
                      </div>
                    ))}
                    {dataSourceType === 'csv' && csvColumns.map((col, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('fieldName', `csv_${col}|${idx}`);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleCsvColumnClick(col, idx)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
                        title={`Drag onto PDF or click to add "${col}" column`}
                      >
                        <span className="mr-1.5">⊕</span>{col}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 <strong>Tip:</strong> Drag fields onto the PDF preview to place them at exact positions, or click to add at center
                </p>
              </div>
            )}

            {/* PDF Preview */}
            <section className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border hover:shadow-2xl transition-all duration-300 flex flex-col" aria-label="PDF Preview">
            <div className="p-5 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300 flex-shrink-0">
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
            
            {/* Scrollable PDF Content Area - Same structure as Configuration section */}
            <div 
              className="pdf-preview-scroll bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-bg dark:to-dark-bg transition-colors duration-300"
            >
              <div className="p-6">
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
                        className="w-full border rounded"
                        style={{ height: '800px' }}
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
                    <div className="max-w-full" onClick={() => { setSelectedFieldKey(null); setSelectedImageKey(null); }}>
                      <PDFViewer 
                        url={previewUrl} 
                        template={template} 
                        onAddField={handleAddField}
                        onUpdateField={handleUpdateField}
                        onDropField={handleDropField}
                        onFieldPropertyChange={handleFieldPropertyChange}
                        backendDimensions={backendDimensions || undefined}
                        selectedFieldKey={selectedFieldKey}
                        onSelectField={setSelectedFieldKey}
                        onRemoveField={handleRemoveField}
                        images={uploadedImages}
                        onImagePositionUpdate={handleImagePositionUpdate}
                        onImagePropertyChange={handleImagePropertyChange}
                        onRemoveImage={handleRemoveImage}
                        selectedImageKey={selectedImageKey}
                        onSelectImage={setSelectedImageKey}
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
      </div>

      {/* Draw Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="signature-modal-title">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeSignatureModal}></div>
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl transform transition-all relative z-10 max-w-lg w-full border border-gray-200 dark:border-dark-border">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
              <h3 id="signature-modal-title" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Draw Your Signature
              </h3>
              <button
                onClick={closeSignatureModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {/* Pen Thickness Control */}
              <div className="mb-4 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Pen Thickness:
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={penThickness}
                  onChange={(e) => setPenThickness(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 w-6 text-center">{penThickness}</span>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                  style={{ backgroundColor: 'white' }}
                >
                  <div 
                    className="rounded-full bg-black"
                    style={{ width: penThickness * 2, height: penThickness * 2 }}
                  />
                </div>
              </div>

              {/* Canvas */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={signatureCanvasRef}
                  width={450}
                  height={200}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Draw your signature in the box above using your mouse or touchscreen
              </p>

              {/* Record Range Input */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  📋 Apply to Records (optional)
                </label>
                <input
                  type="text"
                  value={signatureRecordRange}
                  onChange={(e) => setSignatureRecordRange(e.target.value)}
                  placeholder="e.g., 1-10, 15, 20-25 (leave empty for all)"
                  className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1.5">
                  {signatureRecordRange.trim() 
                    ? `This signature will only appear on records: ${signatureRecordRange}` 
                    : 'Leave empty to apply this signature to ALL records'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={undoLastStroke}
                  disabled={signatureStrokes.length === 0}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    signatureStrokes.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                  </svg>
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearSignature}
                  disabled={signatureStrokes.length === 0}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    signatureStrokes.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Clear
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeSignatureModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  disabled={signatureStrokes.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    signatureStrokes.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Add to PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
