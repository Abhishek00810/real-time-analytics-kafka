// Next.js API Route - Proxy to avoid CORS issues
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:30081';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, page_url } = body;

    const response = await fetch(`${BACKEND_URL}/analytics/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, page_url }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Backend API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}

// GET handler to fetch all pages for a user
export async function GET(request: NextRequest) {
  // Always use user_123 for demo
  const userId = 'user_123';
  
  const pages = [
    '/blog/k8s-guide',
    '/docs',
    '/about',
    '/faq',
    '/home',
    '/products',
    '/contact',
    '/pricing',
  ];

  const results = await Promise.all(
    pages.map(async (pageUrl) => {
      try {
        const response = await fetch(`${BACKEND_URL}/analytics/events`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, page_url: pageUrl }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Return the raw backend response format: { user_id, page_url, count }
          return data;
        }
        // Return default format if request fails
        return { user_id: userId, page_url: pageUrl, count: 0 };
      } catch {
        return { user_id: userId, page_url: pageUrl, count: 0 };
      }
    })
  );

  // Sort by count descending
  results.sort((a, b) => b.count - a.count);
  
  // Calculate total
  const totalClicks = results.reduce((sum, r) => sum + (r.count || 0), 0);

  return NextResponse.json({
    user_id: userId,
    total_clicks: totalClicks,
    pages: results,
  });
}

