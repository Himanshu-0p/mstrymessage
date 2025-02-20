import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const url = request.nextUrl;

    // Log the token and the requested URL for debugging purposes
    console.log('Token:', token);
    console.log('Request Path:', url.pathname);

    // Redirect logged-in users to the dashboard if trying to access /sign-in or /sign-up
    if (token && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect to /sign-in if there's no token and trying to access /dashboard
    if (!token && url.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Allow other requests to pass through
    return NextResponse.next();
}

// Define the matcher for paths to apply middleware
export const config = {
    matcher: ['/sign-in', '/sign-up', '/dashboard/:path*'],
};
