'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Submission = {
    id: number;
    name: string;
};

type Template = {
    id: number;
    key: string;
    name: string;
};

export default function SimpleForm() {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<null | 'success' | 'error'>(null);
    const [message, setMessage] = useState('');
    
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
    
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');

    useEffect(() => {
        fetchSubmissions();
        fetchTemplates();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/submissions');
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (error) {
            console.error('Failed to fetch submissions', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/pdf-templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
                // Removed auto-selection of first template/default
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        setMessage('');

        try {
            const res = await fetch('http://localhost:8000/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, age: parseInt(age), email })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Submission failed');
            }

            setStatus('success');
            setMessage('Saved successfully!');
            setName('');
            setAge('');
            setEmail('');
            fetchSubmissions(); // Refresh list
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const handleGeneratePdf = async () => {
        if (!selectedSubmissionId || !selectedTemplateKey) return;
        
        // Open PDF in new tab with optional template key
        let url = `http://localhost:8000/app/generate-submission-pdf/${selectedSubmissionId}/${selectedTemplateKey}`;
        window.open(url, '_blank');
    };

    // Shared Styles
    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6', // gray-100
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '28rem', // max-w-md
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151', // gray-700
        marginBottom: '0.25rem',
    };

    const inputStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        borderRadius: '0.375rem',
        border: '1px solid #d1d5db', // gray-300
        padding: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        marginBottom: '1rem',
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        borderRadius: '0.25rem',
        padding: '0.5rem 1rem',
        fontWeight: 'bold',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Simple Form</h1>
                
                {status === 'success' && (
                    <div style={{ marginBottom: '1rem', borderRadius: '0.25rem', backgroundColor: '#dcfce7', padding: '0.75rem', color: '#15803d' }}>
                        {message}
                    </div>
                )}
                
                {status === 'error' && (
                    <div style={{ marginBottom: '1rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', padding: '0.75rem', color: '#b91c1c' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Age</label>
                        <input 
                            type="number" 
                            required
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{ ...buttonStyle, backgroundColor: '#2563eb' }}
                    >
                        Submit
                    </button>
                </form>

                <div style={{ paddingTop: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Generate PDF from Submission</h2>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                         <label style={{...labelStyle, fontSize: '0.75rem'}}>Select Submission:</label>
                         <select 
                            style={{ ...inputStyle, marginBottom: '0.5rem' }}
                            value={selectedSubmissionId}
                            onChange={(e) => setSelectedSubmissionId(e.target.value)}
                        >
                            <option value="">-- Choose Submission --</option>
                            {submissions.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    ID: {sub.id} - {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                         <label style={{...labelStyle, fontSize: '0.75rem'}}>Select PDF Template:</label>
                         <select 
                            style={{ ...inputStyle, marginBottom: '0.5rem' }}
                            value={selectedTemplateKey}
                            onChange={(e) => setSelectedTemplateKey(e.target.value)}
                        >
                            <option value="">-- Select Template --</option>
                            {templates.map(tmpl => (
                                <option key={tmpl.key} value={tmpl.key}>
                                    {tmpl.name || tmpl.key}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            onClick={handleGeneratePdf}
                            disabled={!selectedSubmissionId || !selectedTemplateKey}
                            style={{ 
                                ...buttonStyle, 
                                width: '100%', 
                                backgroundColor: (!selectedSubmissionId || !selectedTemplateKey) ? '#9ca3af' : '#16a34a',
                                cursor: (!selectedSubmissionId || !selectedTemplateKey) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Generate PDF
                        </button>
                    </div>
                </div>

                <div style={{ paddingTop: '1.5rem' }}>
                    <Link
                        href="/pdf-editor"
                        style={{ ...buttonStyle, backgroundColor: '#1f2937', display: 'block', textDecoration: 'none' }}
                    >
                        Insert PDF Coordinates
                    </Link>
                </div>
            </div>
        </div>
    );
}
