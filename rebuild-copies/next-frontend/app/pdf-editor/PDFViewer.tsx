'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FieldConfig = {
  x: number;
  y: number;
  page?: number;
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
  dataUrl: string;
  name: string;
};

type TemplateConfig = {
  fields_config: Record<string, FieldConfig>;
};

interface PDFViewerProps {
    url: string;
    template: TemplateConfig | null;
    images?: Record<string, ImageConfig>;
    onAddField?: (x: number, y: number, page: number) => void;
    onUpdateField?: (fieldKey: string, x: number, y: number) => void;
    onDropField?: (fieldName: string, x: number, y: number, page: number) => void;
    onFieldPropertyChange?: (fieldKey: string, property: string, value: number | boolean | string) => void;
    onImagePositionUpdate?: (imageKey: string, x: number, y: number) => void;
    onImagePropertyChange?: (imageKey: string, property: string, value: number | string) => void;
    onRemoveImage?: (imageKey: string) => void;
    selectedImageKey?: string | null;
    onSelectImage?: (imageKey: string | null) => void;
    coordinateTestMode?: boolean;
    onCoordinateTest?: (x: number, y: number, page: number) => void;
    backendDimensions?: Record<number, {width: number, height: number, orientation: string}>;
    selectedFieldKey?: string | null;
    onSelectField?: (fieldKey: string | null) => void;
    onRemoveField?: (fieldKey: string) => void;
}

export default function PDFViewer({ 
    url, 
    template, 
    images,
    onAddField, 
    onUpdateField, 
    onDropField, 
    onFieldPropertyChange, 
    onImagePositionUpdate,
    onImagePropertyChange,
    onRemoveImage,
    selectedImageKey,
    onSelectImage,
    coordinateTestMode, 
    onCoordinateTest, 
    backendDimensions, 
    selectedFieldKey, 
    onSelectField, 
    onRemoveField 
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageDims, setPageDims] = useState<Record<number, {width: number, height: number}>>({});
    const [hoverCoords, setHoverCoords] = useState<{x: number, y: number} | null>(null);
    const [clickState, setClickState] = useState<{shouldPreventClick: boolean; timeStamp: number}>({shouldPreventClick: false, timeStamp: 0});
    const [isDragOver, setIsDragOver] = useState(false);
    
    // Dragging state for fields
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        fieldKey: string | null;
        startX: number;
        startY: number;
        initialFieldX: number;
        initialFieldY: number;
    }>({
        isDragging: false,
        fieldKey: null,
        startX: 0,
        startY: 0,
        initialFieldX: 0,
        initialFieldY: 0
    });

    // Utility function to ensure consistent positioning calculations
    const calculateFieldPosition = (fieldX: number, fieldY: number, pageDims: {width: number, height: number}) => {
        // Field coordinates are in millimeters, convert to percentages for CSS positioning
        const leftPercent = (fieldX / pageDims.width) * 100;
        const topPercent = (fieldY / pageDims.height) * 100;
        
        return { leftPercent, topPercent };
    };

    // Alignment Icon Components (like Microsoft Word)
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

    const onPageLoad = (page: any) => {
        // page.originalWidth/Height are in points (1/72 inch)
        // Convert to mm: points * (25.4 / 72) = points * 0.352777778
        const pointsToMm = 25.4 / 72;
        console.log('Page loaded:', {
            pageNumber: page.pageNumber,
            originalWidth: page.originalWidth,
            originalHeight: page.originalHeight,
            widthMm: page.originalWidth * pointsToMm,
            heightMm: page.originalHeight * pointsToMm
        });
        
        setPageDims(prev => ({
            ...prev,
            [page.pageNumber]: {
                width: page.originalWidth * pointsToMm,
                height: page.originalHeight * pointsToMm
            }
        }));
    };



    const getCoordinates = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Use backend dimensions if available, otherwise fallback to calculated dimensions
        const dims = backendDimensions?.[pageNumber] || pageDims[pageNumber] || { width: 210, height: 297 };
        
        // Get click position relative to the container
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Use actual rendered dimensions from the container instead of fixed 600px
        const actualRenderWidth = rect.width;
        const actualRenderHeight = rect.height;
        
        // Convert click pixels to millimeters using the actual rendered dimensions
        const mmX = (clickX / actualRenderWidth) * dims.width;
        const mmY = (clickY / actualRenderHeight) * dims.height;
        
        // Round to 1 decimal place for precision
        const resultX = parseFloat(mmX.toFixed(1));
        const resultY = parseFloat(mmY.toFixed(1));
        
        // COMPREHENSIVE DEBUG LOGGING
        console.log('=== COORDINATE CALCULATION DEBUG ===');
        console.log('Page:', pageNumber);
        console.log('Click pixels:', { x: clickX, y: clickY });
        console.log('Container rect:', { 
            width: actualRenderWidth, 
            height: actualRenderHeight,
            left: rect.left,
            top: rect.top 
        });
        console.log('PDF dimensions (mm):', dims);
        console.log('Using backend dimensions:', !!backendDimensions?.[pageNumber]);
        console.log('Scale factors:', {
            scaleX: clickX / actualRenderWidth,
            scaleY: clickY / actualRenderHeight
        });
        console.log('Raw mm calculation:', { x: mmX, y: mmY });
        console.log('Final result (mm):', { x: resultX, y: resultY });
        console.log('===================================');
        
        return { x: resultX, y: resultY };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        setHoverCoords(getCoordinates(e, pageNumber));
    };

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        // Don't add field if we're dragging or should prevent click
        if (dragState.isDragging || clickState.shouldPreventClick) {
            // Reset prevent click flag after a short delay
            if (clickState.shouldPreventClick) {
                setTimeout(() => setClickState({shouldPreventClick: false, timeStamp: Date.now()}), 100);
            }
            return;
        }
        
        // Check if click is too soon after a drag ended (prevents accidental clicks after drag)
        if (Date.now() - clickState.timeStamp < 150) {
            return;
        }
        
        const coords = getCoordinates(e, pageNumber);
        
        // Test coordinate echo first to verify communication
        if (process.env.NODE_ENV === 'development') {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/debug/coordinate-echo?x=${coords.x}&y=${coords.y}&page=${pageNumber}`)
                .then(r => r.json())
                .then(data => console.log('Coordinate echo test:', data))
                .catch(err => console.error('Coordinate echo failed:', err));
        }
        
        if (coordinateTestMode && onCoordinateTest) {
            onCoordinateTest(coords.x, coords.y, pageNumber);
        } else if (onAddField) {
            onAddField(coords.x, coords.y, pageNumber);
        }
    };

    const handleFieldMouseDown = (e: React.MouseEvent, fieldKey: string, fieldConfig: FieldConfig) => {
        e.stopPropagation(); // Prevent page click
        e.preventDefault();
        
        // Prevent clicks for a short duration
        setClickState({shouldPreventClick: true, timeStamp: Date.now()});
        
        setDragState({
            isDragging: true,
            fieldKey,
            startX: e.clientX,
            startY: e.clientY,
            initialFieldX: fieldConfig.x,
            initialFieldY: fieldConfig.y
        });
    };

    const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.isDragging || !dragState.fieldKey || !template) return;
        
        // Calculate mouse delta in pixels
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        
        // Find the page container and get its actual dimensions
        const pageContainer = document.querySelector(`[data-page-number="${template.fields_config[dragState.fieldKey]?.page || 1}"]`) as HTMLElement;
        if (!pageContainer) return;
        
        const pageRect = pageContainer.getBoundingClientRect();
        const fieldPage = template.fields_config[dragState.fieldKey]?.page || 1;
        const dims = backendDimensions?.[fieldPage] || pageDims[fieldPage] || { width: 210, height: 297 };
        
        // Convert pixel delta to millimeter delta using actual rendered dimensions
        const actualRenderWidth = pageRect.width;
        const actualRenderHeight = pageRect.height;
        
        const mmDeltaX = (deltaX / actualRenderWidth) * dims.width;
        const mmDeltaY = (deltaY / actualRenderHeight) * dims.height;
        
        // Calculate new position with bounds checking
        const newX = Math.max(0, Math.min(dims.width, dragState.initialFieldX + mmDeltaX));
        const newY = Math.max(0, Math.min(dims.height, dragState.initialFieldY + mmDeltaY));
        
        if (onUpdateField) {
            onUpdateField(dragState.fieldKey, parseFloat(newX.toFixed(1)), parseFloat(newY.toFixed(1)));
        }
    }, [dragState, template, pageDims, onUpdateField]);

    const handleGlobalMouseUp = useCallback(() => {
        const wasDragging = dragState.isDragging;
        
        setDragState({
            isDragging: false,
            fieldKey: null,
            startX: 0,
            startY: 0,
            initialFieldX: 0,
            initialFieldY: 0
        });
        
        // Set timestamp when drag ends to prevent immediate clicks
        if (wasDragging) {
            setClickState({shouldPreventClick: false, timeStamp: Date.now()});
        }
    }, [dragState.isDragging]);

    // Effect to manage global mouse event listeners for dragging
    useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [dragState.isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

    return (
        <div style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#f3f4f6' }}>
            <Document 
                file={url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div style={{ padding: '2.5rem' }}>Loading PDF...</div>}
                error={<div style={{ padding: '2.5rem', color: '#ef4444' }}>Failed to render PDF.</div>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from(new Array(numPages), (_, index) => {
                    const pageNumber = index + 1;
                    const dims = backendDimensions?.[pageNumber] || pageDims[pageNumber] || { width: 210, height: 297 };

                    return (
                        <div 
                            key={pageNumber} 
                            data-page-number={pageNumber}
                            data-pdf-page={pageNumber}
                            style={{ 
                                position: 'relative', 
                                backgroundColor: 'white', 
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                                cursor: 'crosshair', 
                                marginBottom: '1rem',
                                width: 'fit-content',
                                margin: '0 auto 1rem auto',
                                scrollSnapAlign: 'start',
                                scrollSnapStop: 'always',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'visible',
                                border: isDragOver ? '3px dashed #3b82f6' : 'none',
                                transition: 'border 0.2s ease'
                            }}
                            onMouseMove={(e) => handleMouseMove(e, pageNumber)} 
                            onMouseLeave={() => setHoverCoords(null)}
                            onClick={(e) => handlePageClick(e, pageNumber)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragOver(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragOver(false);
                                
                                // Check if dropping an image
                                const dragType = e.dataTransfer.getData('type');
                                const imageKey = e.dataTransfer.getData('imageKey');
                                
                                if (dragType === 'moveImage' && imageKey && onImagePositionUpdate) {
                                    // Moving an existing image
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const clickY = e.clientY - rect.top;
                                    const actualRenderWidth = rect.width;
                                    const actualRenderHeight = rect.height;
                                    
                                    const mmX = (clickX / actualRenderWidth) * dims.width;
                                    const mmY = (clickY / actualRenderHeight) * dims.height;
                                    
                                    onImagePositionUpdate(imageKey, parseFloat(mmX.toFixed(1)), parseFloat(mmY.toFixed(1)));
                                    return;
                                }
                                
                                const fieldName = e.dataTransfer.getData('fieldName');
                                if (!fieldName || !onDropField) return;
                                
                                // Calculate coordinates
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickY = e.clientY - rect.top;
                                const actualRenderWidth = rect.width;
                                const actualRenderHeight = rect.height;
                                
                                const mmX = (clickX / actualRenderWidth) * dims.width;
                                const mmY = (clickY / actualRenderHeight) * dims.height;
                                
                                onDropField(fieldName, parseFloat(mmX.toFixed(1)), parseFloat(mmY.toFixed(1)), pageNumber);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                // Right-click to show page dimensions and help debug
                                alert(`Page ${pageNumber} dimensions: ${dims.width.toFixed(2)}mm x ${dims.height.toFixed(2)}mm\n\nClick to add fields. Coordinates are in millimeters.\n\nFor best accuracy:\n- Use a consistent zoom level\n- Click exactly where you want the text to start`);
                            }}
                        >
                            <Page 
                                pageNumber={pageNumber} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                                onLoadSuccess={onPageLoad}
                            />
                            
                            {/* Hover Tooltip (Per Page) */}
                            {hoverCoords && (
                                <div 
                                    style={{ 
                                        position: 'absolute',
                                        pointerEvents: 'none',
                                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        zIndex: 50,
                                        transform: 'translate(-50%, -100%)',
                                        left: calculateFieldPosition(hoverCoords.x, hoverCoords.y, dims).leftPercent + '%',
                                        top: calculateFieldPosition(hoverCoords.x, hoverCoords.y, dims).topPercent + '%',
                                        marginTop: '-8px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    📍 X: {hoverCoords.x}mm, Y: {hoverCoords.y}mm (Page {pageNumber})
                                </div>
                            )}
                            
                            {/* Visual Markers for Existing Fields */}
                            {template && Object.entries(template.fields_config).map(([key, conf]) => {
                                // Default to page 1 if not set
                                const fieldPage = conf.page || 1;
                                if (fieldPage !== pageNumber) return null;
                                
                                // Use backend dimensions for field positioning
                                const fieldDims = backendDimensions?.[fieldPage] || dims;
                                
                                // Calculate position using utility function for consistency
                                const { leftPercent, topPercent } = calculateFieldPosition(conf.x, conf.y, fieldDims);
                                
                                // Check if this field is selected
                                const isSelected = selectedFieldKey === key;
                                const isBeingDragged = dragState.fieldKey === key;
                                
                                // Check if width is set and get alignment
                                const hasWidth = conf.width && conf.width > 0;
                                const alignment = conf.align || 'left'; // Default to left
                                
                                // Calculate transform based on alignment
                                // X coordinate is the anchor point based on alignment
                                let transformX = '0'; // left align: X is start point
                                if (hasWidth) {
                                    if (alignment === 'center') {
                                        transformX = '-50%'; // center: X is center point
                                    } else if (alignment === 'right') {
                                        transformX = '-100%'; // right: X is end point
                                    }
                                }
                                
                                return (
                                <div key={key}>
                                    {/* Draggable Field Label - ERP Style with Alignment-based Positioning */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            backgroundColor: 'rgba(37, 99, 235, 0.9)', // blue-600/90
                                            color: 'white',
                                            fontSize: '12px',
                                            lineHeight: '1.3',
                                            fontWeight: '600',
                                            padding: '6px 12px',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            cursor: dragState.isDragging && isBeingDragged ? 'grabbing' : 'move',
                                            borderRadius: '6px',
                                            userSelect: 'none',
                                            zIndex: isSelected ? 30 : 10,
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                                            // Position based on alignment
                                            transform: `translate(${transformX}, -100%)`,
                                            display: 'flex',
                                            flexDirection: hasWidth && conf.wrap_text ? 'column' : 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: alignment,
                                            whiteSpace: conf.wrap_text ? 'normal' : 'nowrap',
                                            wordBreak: conf.wrap_text ? 'break-all' : 'normal',
                                            width: hasWidth ? `${conf.width}px` : 'auto',
                                            outline: isSelected ? '4px solid #facc15' : 'none' // yellow-400 ring
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown(e, key, conf)}
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (onSelectField) onSelectField(key);
                                        }}
                                        onMouseOver={(e) => {
                                          if (!isBeingDragged) {
                                            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 1)';
                                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
                                          }
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.9)';
                                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                                        }}
                                        title={isSelected ? `Selected: ${key} (use arrow keys to move)` : `Click to select, drag to reposition ${key}`}
                                    >
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{key}</span>
                                        {/* Remove button */}
                                        {onRemoveField && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); onRemoveField(key); }}
                                            style={{
                                              marginLeft: '8px',
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
                                            onMouseOver={(e) => (e.currentTarget.style.opacity = '1', e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                                            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6', e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
                                            title={`Remove ${key}`}
                                          >
                                            ×
                                          </button>
                                        )}
                                        
                                        {/* Properties Popup (ERP editor style) */}
                                        {isSelected && onFieldPropertyChange && (
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
                                            <div style={{ marginBottom: '12px' }}>
                                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Width (px)</label>
                                              <input 
                                                type="number" 
                                                value={conf.width || ''}
                                                placeholder="Auto"
                                                onChange={(e) => {
                                                  const val = e.target.value ? parseInt(e.target.value) : 0;
                                                  onFieldPropertyChange(key, 'width', val);
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
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Wrap Text</label>
                                              <input 
                                                type="checkbox" 
                                                checked={conf.wrap_text || false}
                                                onChange={(e) => {
                                                  onFieldPropertyChange(key, 'wrap_text', e.target.checked);
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
                                                  onClick={(e) => { e.stopPropagation(); onFieldPropertyChange(key, 'align', 'left'); }}
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
                                                  onClick={(e) => { e.stopPropagation(); onFieldPropertyChange(key, 'align', 'center'); }}
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
                                                  onClick={(e) => { e.stopPropagation(); onFieldPropertyChange(key, 'align', 'right'); }}
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
                                            <div style={{ 
                                              fontSize: '10px', 
                                              color: '#9ca3af', 
                                              paddingTop: '8px', 
                                              marginTop: '12px', 
                                              borderTop: '1px solid #e5e7eb',
                                              display: 'flex',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span>X: {Math.round(conf.x)}</span>
                                              <span>Y: {Math.round(conf.y)}</span>
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
                                                ↔ {alignment === 'left' ? 'Starts' : alignment === 'center' ? 'Centered' : 'Ends'} at X:{Math.round(conf.x)}
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
                                            background: '#facc15', // yellow-400
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
                                            {/* Alignment anchor marker (red) - shows where X coordinate is */}
                                            <div style={{
                                              position: 'absolute',
                                              left: alignment === 'left' ? '0' : alignment === 'center' ? '50%' : '100%',
                                              transform: alignment === 'center' ? 'translateX(-50%)' : alignment === 'right' ? 'translateX(-100%)' : 'none',
                                              top: '-6px',
                                              width: '4px',
                                              height: '14px',
                                              background: '#ef4444', // red-500
                                              borderRadius: '2px'
                                            }} />
                                          </div>
                                        )}
                                    </div>
                                </div>
                            );
                            })}

                            {/* Visual Markers for Images/Signatures */}
                            {images && Object.entries(images).map(([key, img]) => {
                                const imagePage = img.page || 1;
                                if (imagePage !== pageNumber) return null;
                                
                                const imgDims = backendDimensions?.[imagePage] || dims;
                                const { leftPercent, topPercent } = calculateFieldPosition(img.x, img.y, imgDims);
                                const isSelected = selectedImageKey === key;
                                
                                // Calculate width/height in percent
                                const widthPercent = (img.width / imgDims.width) * 100;
                                const heightPercent = (img.height / imgDims.height) * 100;
                                
                                return (
                                    <div
                                        key={`img-${key}`}
                                        style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: `${heightPercent}%`,
                                            cursor: 'move',
                                            zIndex: isSelected ? 35 : 15,
                                            outline: isSelected ? '3px solid #10b981' : '2px dashed #10b981',
                                            borderRadius: '4px',
                                            overflow: 'visible',
                                            backgroundColor: 'rgba(255,255,255,0.9)'
                                        }}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('imageKey', key);
                                            e.dataTransfer.setData('type', 'moveImage');
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectImage) onSelectImage(key);
                                            if (onSelectField) onSelectField(null); // Deselect field
                                        }}
                                    >
                                        <img 
                                            src={img.dataUrl} 
                                            alt={img.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                pointerEvents: 'none'
                                            }}
                                        />
                                        
                                        {/* Image label */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-20px',
                                            left: '0',
                                            background: '#10b981',
                                            color: 'white',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            📷 {img.name.substring(0, 15)}{img.name.length > 15 ? '...' : ''}
                                        </div>
                                        
                                        {/* Remove button - always visible */}
                                        {onRemoveImage && (
                                            <button
                                                onClick={(e) => { 
                                                    e.preventDefault();
                                                    e.stopPropagation(); 
                                                    if (confirm('Remove this image?')) {
                                                        onRemoveImage(key); 
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-10px',
                                                    right: '-10px',
                                                    width: '22px',
                                                    height: '22px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: '2px solid white',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                                    zIndex: 100,
                                                    lineHeight: 1
                                                }}
                                                title="Remove image"
                                            >
                                                ×
                                            </button>
                                        )}
                                        
                                        {/* Resize handles - visible when selected */}
                                        {isSelected && onImagePropertyChange && (
                                            <>
                                                {/* Bottom-right resize handle */}
                                                <div
                                                    draggable={false}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-8px',
                                                        right: '-8px',
                                                        width: '16px',
                                                        height: '16px',
                                                        background: '#10b981',
                                                        border: '2px solid white',
                                                        borderRadius: '3px',
                                                        cursor: 'se-resize',
                                                        zIndex: 200,
                                                        touchAction: 'none'
                                                    }}
                                                    onDragStart={(e) => e.preventDefault()}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        // Disable draggable on parent temporarily
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) parent.setAttribute('draggable', 'false');
                                                        
                                                        const startX = e.clientX;
                                                        const startY = e.clientY;
                                                        const startWidth = img.width;
                                                        const startHeight = img.height;
                                                        const aspectRatio = startWidth / startHeight;
                                                        
                                                        const container = document.querySelector(`[data-pdf-page="${imagePage}"]`) as HTMLElement;
                                                        
                                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                                            moveEvent.preventDefault();
                                                            const deltaX = moveEvent.clientX - startX;
                                                            const deltaY = moveEvent.clientY - startY;
                                                            
                                                            if (container) {
                                                                const rect = container.getBoundingClientRect();
                                                                const mmPerPixelX = imgDims.width / rect.width;
                                                                const mmPerPixelY = imgDims.height / rect.height;
                                                                
                                                                if (moveEvent.shiftKey) {
                                                                    const deltaMm = Math.max(deltaX * mmPerPixelX, deltaY * mmPerPixelY);
                                                                    const newWidth = Math.max(5, startWidth + deltaMm);
                                                                    const newHeight = newWidth / aspectRatio;
                                                                    onImagePropertyChange(key, 'width', Math.round(newWidth));
                                                                    onImagePropertyChange(key, 'height', Math.round(newHeight));
                                                                } else {
                                                                    const newWidth = Math.max(5, startWidth + deltaX * mmPerPixelX);
                                                                    const newHeight = Math.max(5, startHeight + deltaY * mmPerPixelY);
                                                                    onImagePropertyChange(key, 'width', Math.round(newWidth));
                                                                    onImagePropertyChange(key, 'height', Math.round(newHeight));
                                                                }
                                                            }
                                                        };
                                                        
                                                        const handleMouseUp = () => {
                                                            // Re-enable draggable on parent
                                                            if (parent) parent.setAttribute('draggable', 'true');
                                                            document.removeEventListener('mousemove', handleMouseMove);
                                                            document.removeEventListener('mouseup', handleMouseUp);
                                                        };
                                                        
                                                        document.addEventListener('mousemove', handleMouseMove);
                                                        document.addEventListener('mouseup', handleMouseUp);
                                                    }}
                                                    title="Drag to resize (hold Shift for proportional)"
                                                />
                                                
                                                {/* Right edge resize handle */}
                                                <div
                                                    draggable={false}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        right: '-8px',
                                                        width: '10px',
                                                        height: '24px',
                                                        marginTop: '-12px',
                                                        background: '#10b981',
                                                        border: '2px solid white',
                                                        borderRadius: '3px',
                                                        cursor: 'e-resize',
                                                        zIndex: 200,
                                                        touchAction: 'none'
                                                    }}
                                                    onDragStart={(e) => e.preventDefault()}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) parent.setAttribute('draggable', 'false');
                                                        
                                                        const startX = e.clientX;
                                                        const startWidth = img.width;
                                                        const container = document.querySelector(`[data-pdf-page="${imagePage}"]`) as HTMLElement;
                                                        
                                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                                            moveEvent.preventDefault();
                                                            const deltaX = moveEvent.clientX - startX;
                                                            if (container) {
                                                                const rect = container.getBoundingClientRect();
                                                                const mmPerPixel = imgDims.width / rect.width;
                                                                const newWidth = Math.max(5, startWidth + deltaX * mmPerPixel);
                                                                onImagePropertyChange(key, 'width', Math.round(newWidth));
                                                            }
                                                        };
                                                        
                                                        const handleMouseUp = () => {
                                                            if (parent) parent.setAttribute('draggable', 'true');
                                                            document.removeEventListener('mousemove', handleMouseMove);
                                                            document.removeEventListener('mouseup', handleMouseUp);
                                                        };
                                                        
                                                        document.addEventListener('mousemove', handleMouseMove);
                                                        document.addEventListener('mouseup', handleMouseUp);
                                                    }}
                                                    title="Drag to resize width"
                                                />
                                                
                                                {/* Bottom edge resize handle */}
                                                <div
                                                    draggable={false}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '-8px',
                                                        left: '50%',
                                                        width: '24px',
                                                        height: '10px',
                                                        marginLeft: '-12px',
                                                        background: '#10b981',
                                                        border: '2px solid white',
                                                        borderRadius: '3px',
                                                        cursor: 's-resize',
                                                        zIndex: 200,
                                                        touchAction: 'none'
                                                    }}
                                                    onDragStart={(e) => e.preventDefault()}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) parent.setAttribute('draggable', 'false');
                                                        
                                                        const startY = e.clientY;
                                                        const startHeight = img.height;
                                                        const container = document.querySelector(`[data-pdf-page="${imagePage}"]`) as HTMLElement;
                                                        
                                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                                            moveEvent.preventDefault();
                                                            const deltaY = moveEvent.clientY - startY;
                                                            if (container) {
                                                                const rect = container.getBoundingClientRect();
                                                                const mmPerPixel = imgDims.height / rect.height;
                                                                const newHeight = Math.max(5, startHeight + deltaY * mmPerPixel);
                                                                onImagePropertyChange(key, 'height', Math.round(newHeight));
                                                            }
                                                        };
                                                        
                                                        const handleMouseUp = () => {
                                                            if (parent) parent.setAttribute('draggable', 'true');
                                                            document.removeEventListener('mousemove', handleMouseMove);
                                                            document.removeEventListener('mouseup', handleMouseUp);
                                                        };
                                                        
                                                        document.addEventListener('mousemove', handleMouseMove);
                                                        document.addEventListener('mouseup', handleMouseUp);
                                                    }}
                                                    title="Drag to resize height"
                                                />
                                            </>
                                        )}
                                        
                                        {/* Properties popup for selected image */}
                                        {isSelected && onImagePropertyChange && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: '0',
                                                    marginTop: '24px',
                                                    background: 'white',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                                    border: '1px solid #e5e7eb',
                                                    padding: '12px',
                                                    zIndex: 50,
                                                    color: '#374151',
                                                    width: '180px',
                                                    cursor: 'default'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Width (mm)</label>
                                                    <input
                                                        type="number"
                                                        value={img.width}
                                                        onChange={(e) => onImagePropertyChange(key, 'width', parseInt(e.target.value) || 0)}
                                                        style={{ width: '100%', padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Height (mm)</label>
                                                    <input
                                                        type="number"
                                                        value={img.height}
                                                        onChange={(e) => onImagePropertyChange(key, 'height', parseInt(e.target.value) || 0)}
                                                        style={{ width: '100%', padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Page</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={img.page || 1}
                                                        onChange={(e) => onImagePropertyChange(key, 'page', parseInt(e.target.value) || 1)}
                                                        style={{ width: '100%', padding: '4px 8px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}>
                                                    X: {Math.round(img.x)}mm | Y: {Math.round(img.y)}mm
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
                </div>
            </Document>
        </div>
    );
}
