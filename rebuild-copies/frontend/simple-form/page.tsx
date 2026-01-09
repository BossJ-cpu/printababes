'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Submission = {
    id: number;
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

    useEffect(() => {
        fetchSubmissions();
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
        if (!selectedSubmissionId) return;
        
        // Open PDF in new tab
        window.open(`http://localhost:8000/app/generate-submission-pdf/${selectedSubmissionId}`, '_blank');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-gray-800">Simple Form</h1>
                
                {status === 'success' && (
                    <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
                        {message}
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <input 
                            type="number" 
                            required
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
                    >
                        Submit
                    </button>
                </form>

                <div className="pt-4">
                    <h2 className="text-lg font-semibold mb-3">Generate PDF from Submission</h2>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                            value={selectedSubmissionId}
                            onChange={(e) => setSelectedSubmissionId(e.target.value)}
                        >
                            <option value="">Select a submission</option>
                            {submissions.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    ID: {sub.id} - {sub.name}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={handleGeneratePdf}
                            disabled={!selectedSubmissionId}
                            className="rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                <div className="pt-6">
                    <Link
                        href="/pdf-editor"
                        className="block w-full rounded bg-gray-800 px-4 py-2 text-center font-bold text-white hover:bg-gray-900"
                    >
                        Insert PDF Coordinates
                    </Link>
                </div>
            </div>
        </div>
    );
}
