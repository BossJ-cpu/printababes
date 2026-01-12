'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
type Submission = {
    id: number;
    name: string;
};

type Template = {
    id: number;
    key: string;
    name: string;
};

export default function ModernLandingPage() {
    // Form 1 State - Data Submission
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error' | 'loading'>(null);
    const [submitMessage, setSubmitMessage] = useState('');
    
    // Form 2 State - PDF Generation
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
    const [pdfStatus, setPdfStatus] = useState<null | 'loading'>(null);

    useEffect(() => {
        fetchSubmissions();
        fetchTemplates();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-templates`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        setSubmitMessage('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ name, age: parseInt(age), email })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Submission failed');
            }

            setSubmitStatus('success');
            setSubmitMessage('Data saved successfully!');
            setName('');
            setAge('');
            setEmail('');
            fetchSubmissions();
        } catch (error) {
            setSubmitStatus('error');
            setSubmitMessage(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const handleGeneratePdf = async () => {
        if (!selectedSubmissionId || !selectedTemplateKey) return;
        
        setPdfStatus('loading');
        
        setTimeout(() => {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/app/generate-submission-pdf/${selectedSubmissionId}/${selectedTemplateKey}`;
            window.open(url, '_blank');
            setPdfStatus(null);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                <div className="relative px-6 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            PDF Printables Studio
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            A modern platform for creating, managing, and generating dynamic PDF documents. 
                            Submit your data and generate beautiful PDFs with custom templates in seconds.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Forms Section */}
            <div className="relative px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                        
                        {/* Form 1: Data Submission */}
                        <div className="group">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">Data Submission</h2>
                                        <p className="text-gray-600">Submit your information to the system</p>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <h3 className="font-semibold text-blue-800 mb-2">📝 How to use:</h3>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• Fill in your personal information below</li>
                                        <li>• All fields are required for submission</li>
                                        <li>• Data will be stored and available for PDF generation</li>
                                        <li>• You can submit multiple entries</li>
                                    </ul>
                                </div>

                                {submitStatus === 'success' && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fadeIn">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-green-800 font-medium">{submitMessage}</span>
                                        </div>
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-red-800 font-medium">{submitMessage}</span>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Age *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                                            placeholder="Enter your age"
                                            min="1"
                                            max="120"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                                            placeholder="Enter your email address"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitStatus === 'loading'}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitStatus === 'loading' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </div>
                                        ) : (
                                            'Submit Data'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Form 2: PDF Generation */}
                        <div className="group">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">PDF Generation</h2>
                                        <p className="text-gray-600">Generate PDFs from submitted data</p>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                    <h3 className="font-semibold text-purple-800 mb-2">📄 How to use:</h3>
                                    <ul className="text-sm text-purple-700 space-y-1">
                                        <li>• Select a previously submitted data record</li>
                                        <li>• Choose a PDF template from available options</li>
                                        <li>• Generate your personalized PDF document</li>
                                        <li>• PDF will open in a new tab for download</li>
                                    </ul>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Data Record *
                                        </label>
                                        <select
                                            value={selectedSubmissionId}
                                            onChange={(e) => setSelectedSubmissionId(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                                        >
                                            <option value="">Choose a data record...</option>
                                            {submissions.map(sub => (
                                                <option key={sub.id} value={sub.id}>
                                                    #{sub.id} - {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select PDF Template *
                                        </label>
                                        <select
                                            value={selectedTemplateKey}
                                            onChange={(e) => setSelectedTemplateKey(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                                        >
                                            <option value="">Choose a template...</option>
                                            {templates.map(tmpl => (
                                                <option key={tmpl.key} value={tmpl.key}>
                                                    {tmpl.name || tmpl.key}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleGeneratePdf}
                                        disabled={!selectedSubmissionId || !selectedTemplateKey || pdfStatus === 'loading'}
                                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {pdfStatus === 'loading' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating PDF...
                                            </div>
                                        ) : (
                                            'Generate PDF'
                                        )}
                                    </button>
                                </div>

                                {/* Advanced Options */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Advanced Options</h3>
                                    <div className="space-y-3">
                                        <Link
                                            href="/pdf-editor"
                                            className="block w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                                        >
                                            📐 Configure PDF Coordinates
                                        </Link>
                                        <Link
                                            href="/simple-form"
                                            className="block w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                                        >
                                            🔧 Advanced Settings
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white/50 backdrop-blur-sm py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose PDF Printables Studio?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Lightning Fast</h3>
                            <p className="text-gray-600">Generate professional PDFs in seconds with our optimized processing engine.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Fully Customizable</h3>
                            <p className="text-gray-600">Configure PDF coordinates, fonts, and layouts to match your exact requirements.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
                            <p className="text-gray-600">Your data is protected with enterprise-grade security and reliable processing.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-gray-400">© 2026 PDF Printables Studio. Built with Next.js and modern web technologies.</p>
                </div>
            </footer>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}