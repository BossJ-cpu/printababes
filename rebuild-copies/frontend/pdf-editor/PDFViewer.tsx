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
        <div className="shadow-xl bg-gray-100">
            <Document 
                file={url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div className="p-10">Loading PDF...</div>}
                error={<div className="p-10 text-red-500">Failed to render PDF.</div>}
                className="flex flex-col gap-4"
            >
                {Array.from(new Array(numPages), (el, index) => {
                    const pageNumber = index + 1;
                    return (
                        <div 
                            key={pageNumber} 
                            className="relative bg-white shadow-sm cursor-crosshair"
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
                                    className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded z-50 transform -translate-y-full -translate-x-1/2"
                                    style={{ 
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
                                    className="absolute border-2 border-red-500 bg-red-500 bg-opacity-10 text-red-600 text-[10px] font-bold px-1"
                                    style={{
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
