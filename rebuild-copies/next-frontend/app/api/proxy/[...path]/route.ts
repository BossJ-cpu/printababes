import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

async function handleRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    // URL Encode each segment to handle spaces/special chars in filenames
    const path = resolvedParams.path.map(p => encodeURIComponent(p)).join('/');
    const query = req.nextUrl.search;
    
    // The actual backend URL (Tunnel)
    const backendUrl = process.env.BACKEND_API_URL;

    if (!backendUrl) {
        return NextResponse.json(
            { error: 'Configuration Error: BACKEND_API_URL is missing' },
            { status: 500 }
        );
    }

    // specific check to avoid recursive calls if misconfigured
    if (backendUrl.includes('/api/proxy')) {
        return NextResponse.json(
            { error: 'Configuration Error: Recursive Proxy' },
            { status: 500 }
        );
    }

    const targetUrl = `${backendUrl}/${path}${query}`;

    // Prepare headers to forward
    const headers = new Headers();
    req.headers.forEach((value, key) => {
        // Skip headers that node/fetch will handle or that cause issues
        if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    // Inject the specific headers to bypass tunnel warnings
    headers.set('Bypass-Tunnel-Reminder', 'true');
    headers.set('ngrok-skip-browser-warning', 'true');
    headers.set('User-Agent', 'NextJS-Proxy/1.0');

    try {
        const fetchOptions: RequestInit = {
            method: req.method,
            headers: headers,
            cache: 'no-store', // Never cache API responses
            // @ts-ignore - 'duplex' is a valid option for node fetch in Next.js but types might lag
            duplex: 'half' 
        };

        // Only attach body for methods that support it
        if (req.method !== 'GET' && req.method !== 'HEAD') {
             fetchOptions.body = req.body;
        }

        const backendResponse = await fetch(targetUrl, fetchOptions);

        // Prepare response to client
        const resHeaders = new Headers(backendResponse.headers);
        
        // Remove CORS headers from upstream as we are now serving Same-Origin
        resHeaders.delete('access-control-allow-origin');
        resHeaders.delete('access-control-allow-methods');
        resHeaders.delete('access-control-allow-headers');
        
        // CRITICAL: Remove content-encoding headers to prevent decoding issues
        // Let the browser handle the content as-is from our proxy
        resHeaders.delete('content-encoding');
        resHeaders.delete('content-length'); // Let browser recalculate
        resHeaders.delete('transfer-encoding');
        
        // Ensure content-type is passed
        if (!resHeaders.has('content-type')) {
             // fallback or leave empty
        }

        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: resHeaders
        });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Backend Connection Failed', details: error.message },
            { status: 502 }
        );
    }
}

// Export handlers for all HTTP methods
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const OPTIONS = async () => {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};
