'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false, loading: () => <p>Loading PDF Viewer...</p> });

type FieldConfig = {
  x: number;
  y: number;
  font: string;
  size: number;
  page?: number;
};

type TemplateConfig = {
  key: string;
  fields_config: Record<string, FieldConfig>;
};

// Subcomponent to handle input focus stability during renaming
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
            setTempName(fieldName); // Revert if empty or unchanged
        }
    };
    
    // Allow Enter key to commit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50 relative group">
            <button 
                onClick={() => onRemove(fieldName)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
            >
                X
            </button>

            <div className="mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Field Name</label>
                <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="font-semibold text-lg text-blue-600 bg-transparent border-b border-dashed border-gray-400 focus:border-blue-500 focus:outline-none w-full"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Page</label>
                <input
                type="number"
                value={config.page || 1}
                onChange={(e) => onUpdate(fieldName, 'page', Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Font Size</label>
                <input
                type="number"
                value={config.size}
                onChange={(e) => onUpdate(fieldName, 'size', Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">X (mm)</label>
                <input
                type="number"
                value={config.x}
                onChange={(e) => onUpdate(fieldName, 'x', Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border computed-ring"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Y (mm)</label>
                <input
                type="number"
                value={config.y}
                onChange={(e) => onUpdate(fieldName, 'y', Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
            </div>
            </div>
        </div>
    );
};

export default function PdfEditor() {
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/pdf-templates/user_profile');
      const data = await res.json();
      // On reload, we want to clear the fields from the previous session/file
      // so we override the fetched config with an empty one.
      setTemplate({
          ...data,
          fields_config: {} as Record<string, FieldConfig>
      });
    } catch (error) {
      console.error('Failed to load template', error);
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
    if (!template) return;
    setSaving(true);
    try {
      await fetch(`http://localhost:8000/api/pdf-templates/${template.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ fields_config: template.fields_config }),
      });
      // Refresh preview to show changes
      handlePreview(); 
    } catch (error) {
      console.error('Failed to save', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
     if (!template) return;
     
     const params = new URLSearchParams();
     params.append('t', Date.now().toString());
     
     // Dynamically add dummy data for all current fields
     Object.keys(template.fields_config).forEach(key => {
         // Generate a placeholder value like "[Field Name]"
         const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         params.append(key, `[${formattedKey}]`);
     });

     try {
       // Use localhost instead of 127.0.0.1 to avoid mix-ups, or relative path if proxied
       // But usually localhost is safer for fetch in some envs
       const res = await fetch(`http://localhost:8000/app/pdf-demo?${params.toString()}`);
       
       if (!res.ok) {
           console.error("Preview failed with status:", res.status);
           return;
       }

       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       setPreviewUrl(url);
     } catch(e) {
        console.error("Preview error:", e);
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !template) return;
    
    const formData = new FormData();
    formData.append('pdf', e.target.files[0]);

    try {
        setSaving(true);
        const res = await fetch(`http://localhost:8000/api/pdf-templates/${template.key}/upload`, {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }

        alert('Template uploaded successfully!');
        
        // Clear existing fields on new upload if desired, or keep them?
        // User asked to "remove fullname, email... in the pdf i upload"
        // So let's clear the config logic if it's a new upload to start fresh
        setTemplate({
            ...template,
            fields_config: {}
        });
        // Trigger save to persist emptiness
        // Actually, we'll let user save manually or auto-save empty?
        // Let's just update local state and let them add new ones.

        handlePreview(); // Refresh preview with new background
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

  if (loading) return <div>Loading config...</div>;
  if (!template) return <div>Template not found</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Editor */}
      <div className="w-1/3 p-6 bg-white shadow-lg overflow-y-auto z-10">
        <h1 className="text-xl font-bold mb-6">PDF Config Editor</h1>

        <div className="mb-6 p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Custom Template (PDF)</label>
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">
                Click on the PDF preview to add new fields.
            </p>
        </div>
        
        <div className="space-y-4">
          {(Object.entries(template.fields_config) as Array<[string, FieldConfig]>).map(([fieldName, config]) => (
              <FieldRow 
                key={fieldName}
                fieldName={fieldName}
                config={config}
                onRename={handleRenameField}
                onUpdate={handleFieldChange}
                onRemove={handleRemoveField}
              />
          ))}
          
          {Object.keys(template.fields_config).length === 0 && (
              <div className="text-center text-gray-400 py-10 border-2 border-dashed rounded-lg">
                  <p>No fields configured.</p>
                  <p className="text-sm">Click somewhere on the PDF to add a field.</p>
              </div>
          )}
        </div>

        <div className="mt-8 flex gap-4 sticky bottom-0 bg-white p-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handlePreview}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Refresh Preview
          </button>
        </div>
      </div>

      {/* PDF Visual Preview */}
      <div className="w-2/3 bg-gray-200 p-8 flex justify-center overflow-y-auto relative items-start">
        {previewUrl ? (
            <div className="my-auto"> {/* Center vertically if smaller, but allow scroll if larger */}
              <PDFViewer url={previewUrl} template={template} onAddField={handleAddField} />
            </div>
        ) : (
            <div className="text-gray-500">Click "Refresh Preview" to see the PDF</div>
        )}
      </div>
    </div>
  );
}
