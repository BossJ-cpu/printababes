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

// Subcomponent: Field Row with Inline Styles
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

    const inputStyle = {
      display: 'block',
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid #d1d5db',
      marginTop: '0.25rem'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151'
    };

    return (
        <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
            position: 'relative',
            marginBottom: '1rem'
        }}>
            <button 
                onClick={() => onRemove(fieldName)}
                style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    color: '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                X
            </button>

            <div style={{ marginBottom: '0.75rem' }}>
                <label htmlFor={`field-name-${fieldName}`} style={{ ...labelStyle, fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Field Name</label>
                <input 
                    id={`field-name-${fieldName}`}
                    name={`fieldName-${fieldName}`}
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#2563eb',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px dashed #9ca3af',
                        width: '100%',
                        outline: 'none'
                    }}
                />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label htmlFor={`page-${fieldName}`} style={labelStyle}>Page</label>
                    <input
                        id={`page-${fieldName}`}
                        name={`page-${fieldName}`}
                        type="number"
                        value={config.page || 1}
                        onChange={(e) => onUpdate(fieldName, 'page', Number(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label htmlFor={`size-${fieldName}`} style={labelStyle}>Font Size</label>
                    <input
                        id={`size-${fieldName}`}
                        name={`size-${fieldName}`}
                        type="number"
                        value={config.size || 12}
                        onChange={(e) => onUpdate(fieldName, 'size', Number(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label htmlFor={`x-${fieldName}`} style={labelStyle}>X (mm)</label>
                    <input
                        id={`x-${fieldName}`}
                        name={`x-${fieldName}`}
                        type="number"
                        value={config.x}
                        onChange={(e) => onUpdate(fieldName, 'x', Number(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label htmlFor={`y-${fieldName}`} style={labelStyle}>Y (mm)</label>
                    <input
                        id={`y-${fieldName}`}
                        name={`y-${fieldName}`}
                        type="number"
                        value={config.y}
                        onChange={(e) => onUpdate(fieldName, 'y', Number(e.target.value))}
                        style={inputStyle}
                    />
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
        alert("Please provide a profile name.");
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
           
          // Only preview if we definitely have a file path
          if (template.file_path) {
              handlePreview();
          } else {
              setPreviewUrl(null);
              setPreviewError("Profile saved successfully. Please upload a PDF template to start editing fields.");
          }
      } else {
          // Handle save error
          const errorData = await res.json().catch(() => ({}));
          alert('Failed to save: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!template || !template.key) return;
      if (!confirm(`Are you sure you want to delete profile "${template.key}"? This cannot be undone.`)) return;

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
              alert('Profile deleted.');
              setTemplate({ key: '', fields_config: {} });
              setPreviewUrl(null);
              setPreviewError(null);
              fetchProfiles(); // Refresh list
          } else {
              alert('Failed to delete profile.');
          }
      } catch (error) {
          console.error("Delete failed", error);
          alert('Error deleting profile.');
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
        alert("Please enter a Profile Name (Key) before uploading a PDF.");
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
        alert('Template uploaded successfully!');
        
        // Reset fields on new PDF
        setTemplate({
            ...template,
            fields_config: {},
            file_path: updatedTemplate.file_path // Update file_path from response
        });
        
        // Refresh preview (which should show empty PDF now)
        // We don't need to save right away if we just uploaded, unless we want to clear fields on backend too
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates/${template.key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ fields_config: {} }),
        });

        // Now preview
        handlePreview(); 
    } catch (error) {
        console.error('Upload failed', error);
        alert('Upload failed: ' + error);
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
          alert("Field name already exists!");
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

  if (loading) return <div style={{padding: '2rem'}}>Loading config...</div>;

  const buttonStyle = {
      flex: 1,
      padding: '0.5rem 1rem',
      color: 'white',
      border: 'none',
      borderRadius: '0.25rem',
      cursor: 'pointer',
      textAlign: 'center' as const
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Sidebar Editor */}
      <div style={{ 
          width: '33%', 
          minWidth: '300px',
          padding: '1.5rem', 
          backgroundColor: 'white', 
          boxShadow: '4px 0 6px -1px rgba(0,0,0,0.1)', 
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>PDF Config Editor</h1>
             <Link href="/simple-form" style={{color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem'}}>← Back</Link>
        </div>

        {/* Profile Selection Dropdown */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <label htmlFor="profile-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>Select Existing Profile</label>
            <div style={{ display: 'flex', gap: '0.5rem'}}>
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
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #d1d5db'
                    }}
                >
                    <option value="">-- Create New --</option>
                    {profiles.map(p => (
                        <option key={p.key} value={p.key}>{p.name || p.key}</option>
                    ))}
                </select>
            </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="profile-key" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>Profile Name (Key)</label>
            <input 
                id="profile-key"
                name="profileKey"
                type="text"
                value={template.key}
                onChange={(e) => setTemplate({ ...template, key: e.target.value })}
                placeholder="Enter new profile key"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Change this to create/edit a different profile.
            </p>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', border: '1px dashed #9ca3af', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <label htmlFor="pdf-upload" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Upload Custom Template (PDF)</label>
            <input 
              id="pdf-upload"
              name="pdfUpload"
              type="file" 
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'block', width: '100%', fontSize: '0.75rem' }}
            />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
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
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem 1rem', border: '2px dashed #e5e7eb', borderRadius: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>No fields configured.</p>
                  <p style={{ fontSize: '0.875rem' }}>Click somewhere on the PDF to add a field.</p>
              </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleSave}
            disabled={saving || !template.key}
            style={{ ...buttonStyle, backgroundColor: (saving || !template.key) ? '#9ca3af' : '#2563eb', cursor: (saving || !template.key) ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          {profiles.some(p => p.key === template.key) && (
             <button
                onClick={handleDelete}
                disabled={saving}
                style={{ ...buttonStyle, backgroundColor: saving ? '#9ca3af' : '#ef4444', flex: 0.5 }}
             >
                Delete
             </button>
          )}

          <button
            onClick={() => handlePreview()}
            style={{ ...buttonStyle, backgroundColor: '#16a34a' }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* PDF Visual Preview */}
      <div style={{ 
          width: '67%', 
          backgroundColor: '#e5e7eb', 
          padding: '2rem', 
          overflowY: 'auto', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start'
      }}>
        {previewError ? (
            <div style={{ marginTop: 'auto', marginBottom: 'auto', color: '#ef4444', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold' }}>Error</p>
                <p>{previewError}</p>
            </div>
        ) : previewUrl ? (
            <div style={{ marginTop: 'auto', marginBottom: 'auto' }}> 
              <PDFViewer url={previewUrl} template={template} onAddField={handleAddField} />
            </div>
        ) : (
            <div style={{ marginTop: 'auto', marginBottom: 'auto', color: '#6b7280' }}>Click "Refresh Preview" to see the PDF</div>
        )}
      </div>
    </div>
  );
}
