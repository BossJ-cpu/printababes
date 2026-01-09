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
    const [hoverCoords, setHoverCoords] = useState<{x: number, y: number} | null>(null);

    const getCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const scaleX = 210 / rect.width;
        const scaleY = 297 / rect.height;

        return {
            x: Math.round(x * scaleX),
            y: Math.round(y * scaleY)
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        setHoverCoords(getCoordinates(e));
    };

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
        if (!onAddField) return;
        const coords = getCoordinates(e);
        onAddField(coords.x, coords.y, pageNumber);
    };

    return (
        <div style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#f3f4f6' }}>
            <Document 
                file={url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div style={{ padding: '2.5rem' }}>Loading PDF...</div>}
                error={<div style={{ padding: '2.5rem', color: '#ef4444' }}>Failed to render PDF.</div>}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
                {Array.from(new Array(numPages), (el, index) => {
                    const pageNumber = index + 1;
                    return (
                        <div 
                            key={pageNumber} 
                            style={{ position: 'relative', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', cursor: 'crosshair', marginBottom: '1rem' }}
                            onMouseMove={handleMouseMove} 
                            onMouseLeave={() => setHoverCoords(null)}
                            onClick={(e) => handlePageClick(e, pageNumber)}
                        >
                            <Page 
                                pageNumber={pageNumber} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                                width={600} 
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
                                        left: (hoverCoords.x / 210) * 100 + '%', 
                                        top: (hoverCoords.y / 297) * 100 + '%',
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
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        padding: '0 0.25rem',
                                        left: (conf.x / 210) * 100 + '%',
                                        top: (conf.y / 297) * 100 + '%',
                                        transform: 'translateY(-50%)' 
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Prevent adding new field when clicking existing
                                >
                                    {key}
                                </div>
                            )})}
                        </div>
                    );
                })}
            </Document>
        </div>
    );
}
