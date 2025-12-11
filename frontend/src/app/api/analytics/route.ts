// Next.js API Route - Proxy to avoid CORS issues
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:30081';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, page_url } = body;

    const response = await axios.get(`${BACKEND_URL}/analytics/events`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: { user_id, page_url },
    });
    console.log(response.data)
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: error.response?.status || 500 }
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
        console.log(`Fetching ${pageUrl}...`);
        const response = await axios.get(`${BACKEND_URL}/analytics/events`, {
          headers: { 'Content-Type': 'application/json' },
          data: { user_id: userId, page_url: pageUrl },
        });
        
        console.log(`Response for ${pageUrl}: status=${response.status}`);
        console.log(`Data for ${pageUrl}:`, response.data);
        return response.data;
      } catch (error: any) {
        if (error.response) {
          console.error(`Failed for ${pageUrl}: ${error.response.status} - ${error.response.data}`);
        } else {
          console.error(`Exception for ${pageUrl}:`, error.message);
        }
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

