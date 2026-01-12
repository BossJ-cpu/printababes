'use client';

import React, { useState } from 'react';
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
}

export default function PDFViewer({ url, template, onAddField }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageDims, setPageDims] = useState<Record<number, {width: number, height: number}>>({});
    const [hoverCoords, setHoverCoords] = useState<{x: number, y: number} | null>(null);

    const onPageLoad = (page: any) => {
        // page.originalWidth/Height are in points (1/72 inch)
        // Convert to mm: points * (25.4 / 72)
        const toMm = 25.4 / 72;
        setPageDims(prev => ({
            ...prev,
            [page.pageNumber]: {
                width: page.originalWidth * toMm,
                height: page.originalHeight * toMm
            }
        }));
    };

    const getCoordinates = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dims = pageDims[pageNumber] || { width: 210, height: 297 }; // Default A4
        
        const scaleX = dims.width / rect.width;
        const scaleY = dims.height / rect.height;

        return {
            x: Math.round(x * scaleX),
            y: Math.round(y * scaleY)
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        setHoverCoords(getCoordinates(e, pageNumber));
    };

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        if (!onAddField) return;
        const coords = getCoordinates(e, pageNumber);
        onAddField(coords.x, coords.y, pageNumber);
    };

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
                            style={{ position: 'relative', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'crosshair', marginBottom: '1rem' }}
                            onMouseMove={(e) => handleMouseMove(e, pageNumber)} 
                            onMouseLeave={() => setHoverCoords(null)}
                            onClick={(e) => handlePageClick(e, pageNumber)}
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
                                        backgroundColor: 'black',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        zIndex: 50,
                                        transform: 'translate(-50%, -100%)',
                                        left: (hoverCoords.x / dims.width) * 100 + '%', 
                                        top: (hoverCoords.y / dims.height) * 100 + '%',
                                        marginTop: '-10px'
                                    }}
                                >
                                    x: {hoverCoords.x}, y: {hoverCoords.y} (P{pageNumber})
                                </div>
                            )}
                            
                            {/* Visual Markers for Existing Fields */}
                            {template && Object.entries(template.fields_config).map(([key, conf]) => {
                                // Default to page 1 if not set
                                const fieldPage = conf.page || 1;
                                if (fieldPage !== pageNumber) return null;
                                
                                return (
                                <div
                                    key={key}
                                    style={{
                                        position: 'absolute',
                                        border: '2px solid #ef4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#dc2626',
                                        fontSize: '12px',
                                        lineHeight: '1',
                                        fontWeight: 'bold',
                                        padding: '0 0.25rem',
                                        left: (conf.x / dims.width) * 100 + '%',
                                        top: (conf.y / dims.height) * 100 + '%',
                                        // transform removed to align backend/frontend coordinate systems (Top-Left origin)
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Prevent adding new field when clicking existing
                                >
                                    {key}
                                </div>
                            )})}
                        </div>
                    );
                })}
                </div>
            </Document>
        </div>
    );
}
