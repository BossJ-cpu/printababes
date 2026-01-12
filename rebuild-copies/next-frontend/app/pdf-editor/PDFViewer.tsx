'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FieldConfig = {
  x: number;
  y: number;
  page?: number;
};

type TemplateConfig = {
  fields_config: Record<string, FieldConfig>;
};

interface PDFViewerProps {
    url: string;
    template: TemplateConfig | null;
    onAddField?: (x: number, y: number, page: number) => void;
    onUpdateField?: (fieldKey: string, x: number, y: number) => void;
    coordinateTestMode?: boolean;
    onCoordinateTest?: (x: number, y: number, page: number) => void;
}

export default function PDFViewer({ url, template, onAddField, onUpdateField, coordinateTestMode, onCoordinateTest }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageDims, setPageDims] = useState<Record<number, {width: number, height: number}>>({});
    const [hoverCoords, setHoverCoords] = useState<{x: number, y: number} | null>(null);
    
    // Dragging state
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
        const dims = pageDims[pageNumber] || { width: 210, height: 297 }; // Default A4 in mm
        
        // Get click position relative to the container
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // The PDF is rendered at a fixed width of 600px
        // Calculate the actual rendered height based on PDF aspect ratio
        const renderWidth = 600;
        const renderHeight = (dims.height / dims.width) * renderWidth;
        
        // Convert click pixels to millimeters using the render dimensions
        const mmX = (clickX / renderWidth) * dims.width;
        const mmY = (clickY / renderHeight) * dims.height;
        
        // Round to 1 decimal place for precision
        const resultX = parseFloat(mmX.toFixed(1));
        const resultY = parseFloat(mmY.toFixed(1));
        
        // console.log('Coordinate calculation:', {
        //     pageNumber,
        //     clickPixels: { x: clickX, y: clickY },
        //     renderSize: { width: renderWidth, height: renderHeight },
        //     containerSize: { width: rect.width, height: rect.height },
        //     pageDimsMm: dims,
        //     resultMm: { x: resultX, y: resultY }
        // });
        
        return { x: resultX, y: resultY };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        setHoverCoords(getCoordinates(e, pageNumber));
    };

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        // Don't add field if we're dragging
        if (dragState.isDragging) return;
        
        const coords = getCoordinates(e, pageNumber);
        
        if (coordinateTestMode && onCoordinateTest) {
            onCoordinateTest(coords.x, coords.y, pageNumber);
        } else if (onAddField) {
            onAddField(coords.x, coords.y, pageNumber);
        }
    };

    const handleFieldMouseDown = (e: React.MouseEvent, fieldKey: string, fieldConfig: FieldConfig) => {
        e.stopPropagation(); // Prevent page click
        e.preventDefault();
        
        const rect = e.currentTarget.parentElement?.getBoundingClientRect();
        if (!rect) return;
        
        setDragState({
            isDragging: true,
            fieldKey,
            startX: e.clientX,
            startY: e.clientY,
            initialFieldX: fieldConfig.x,
            initialFieldY: fieldConfig.y
        });
        
        // Add global mouse event listeners
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.isDragging || !dragState.fieldKey || !template) return;
        
        // Calculate mouse delta in pixels
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        
        // Find the page container
        const pageContainer = document.querySelector(`[data-page-number="${template.fields_config[dragState.fieldKey]?.page || 1}"]`) as HTMLElement;
        if (!pageContainer) return;
        
        const fieldPage = template.fields_config[dragState.fieldKey]?.page || 1;
        const dims = pageDims[fieldPage] || { width: 210, height: 297 };
        
        // Convert pixel delta to millimeter delta using same logic as coordinate calculation
        const renderWidth = 600;
        const renderHeight = (dims.height / dims.width) * renderWidth;
        
        const mmDeltaX = (deltaX / renderWidth) * dims.width;
        const mmDeltaY = (deltaY / renderHeight) * dims.height;
        
        // Calculate new position with bounds checking
        const newX = Math.max(0, Math.min(dims.width, dragState.initialFieldX + mmDeltaX));
        const newY = Math.max(0, Math.min(dims.height, dragState.initialFieldY + mmDeltaY));
        
        if (onUpdateField) {
            onUpdateField(dragState.fieldKey, parseFloat(newX.toFixed(1)), parseFloat(newY.toFixed(1)));
        }
    }, [dragState, template, pageDims, onUpdateField]);

    const handleGlobalMouseUp = useCallback(() => {
        setDragState({
            isDragging: false,
            fieldKey: null,
            startX: 0,
            startY: 0,
            initialFieldX: 0,
            initialFieldY: 0
        });
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [handleGlobalMouseMove]);

    // Cleanup effect for drag listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);

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
                    const dims = pageDims[pageNumber] || { width: 210, height: 297 };

                    return (
                        <div 
                            key={pageNumber} 
                            data-page-number={pageNumber}
                            style={{ position: 'relative', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'crosshair', marginBottom: '1rem' }}
                            onMouseMove={(e) => handleMouseMove(e, pageNumber)} 
                            onMouseLeave={() => setHoverCoords(null)}
                            onClick={(e) => handlePageClick(e, pageNumber)}
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
                                width={600}
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
                                        left: (hoverCoords.x / dims.width) * 100 + '%', 
                                        top: (hoverCoords.y / dims.height) * 100 + '%',
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
                                
                                // Calculate position as percentage - same logic as coordinate calculation
                                const leftPercent = (conf.x / dims.width) * 100;
                                const topPercent = (conf.y / dims.height) * 100;
                                
                                return (
                                <div key={key}>
                                    {/* Draggable Field Label */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            border: '2px solid #ef4444',
                                            backgroundColor: dragState.fieldKey === key ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)',
                                            color: '#dc2626',
                                            fontSize: '11px',
                                            lineHeight: '1.2',
                                            fontWeight: 'bold',
                                            padding: '2px 4px',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            cursor: dragState.isDragging && dragState.fieldKey === key ? 'grabbing' : 'grab',
                                            borderRadius: '3px',
                                            minWidth: '60px',
                                            textAlign: 'center',
                                            userSelect: 'none',
                                            zIndex: 1001,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            transform: 'translate(0, -100%)'
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown(e, key, conf)}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Drag to reposition ${key}`}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <span>📍</span>
                                            <span>{key}</span>
                                        </div>
                                        <div style={{ 
                                            fontSize: '9px', 
                                            fontWeight: 'normal',
                                            color: 'rgba(239, 68, 68, 0.8)',
                                            marginTop: '1px'
                                        }}>
                                            {conf.x.toFixed(1)}, {conf.y.toFixed(1)}mm
                                        </div>
                                    </div>
                                    
                                    {/* Precision Crosshair Marker */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${leftPercent}%`,
                                        top: `${topPercent}%`,
                                        width: '16px',
                                        height: '16px',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 1000,
                                        pointerEvents: 'none'
                                    }}>
                                        {/* Vertical line */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '0',
                                            width: '1px',
                                            height: '100%',
                                            backgroundColor: dragState.fieldKey === key ? '#dc2626' : '#ef4444',
                                            transform: 'translateX(-50%)'
                                        }} />
                                        {/* Horizontal line */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '0',
                                            top: '50%',
                                            width: '100%',
                                            height: '1px',
                                            backgroundColor: dragState.fieldKey === key ? '#dc2626' : '#ef4444',
                                            transform: 'translateY(-50%)'
                                        }} />
                                        {/* Center dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            width: '3px',
                                            height: '3px',
                                            backgroundColor: dragState.fieldKey === key ? '#dc2626' : '#ef4444',
                                            borderRadius: '50%',
                                            transform: 'translate(-50%, -50%)'
                                        }} />
                                    </div>
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
