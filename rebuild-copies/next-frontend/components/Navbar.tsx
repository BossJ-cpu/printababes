'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    
    const isActive = (path: string) => pathname === path;
    
    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            PDF Studio
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-1">
                        <Link
                            href="/landing"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive('/landing') || isActive('/')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/simple-form"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive('/simple-form')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            Forms
                        </Link>
                        <Link
                            href="/pdf-editor"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive('/pdf-editor')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            PDF Editor
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}