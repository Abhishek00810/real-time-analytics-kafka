// API Client for Real-Time Analytics Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:30081';

export interface AnalyticsResponse {
  user_id: string;
  page_url: string;
  count: number;
}

export interface PageStats {
  page_url: string;
  click_count: number;
}

// Fetch click count for a specific user + page
export async function getEventCount(userId: string, pageUrl: string): Promise<AnalyticsResponse> {
  const response = await fetch(`${API_BASE_URL}/analytics/events`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      page_url: pageUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Fetch stats for multiple pages (for a user)
export async function getUserPageStats(userId: string, pages: string[]): Promise<PageStats[]> {
  const promises = pages.map(async (pageUrl) => {
    try {
      const result = await getEventCount(userId, pageUrl);
      return {
        page_url: result.page_url,
        click_count: result.count,
      };
    } catch (error) {
      console.error(`Failed to fetch stats for ${pageUrl}:`, error);
      return {
        page_url: pageUrl,
        click_count: 0,
      };
    }
  });

  const results = await Promise.all(promises);
  return results.sort((a, b) => b.click_count - a.click_count);
}

// Known pages for user_123 (static list for demo)
export const KNOWN_PAGES = [
  '/blog/k8s-guide',
  '/docs',
  '/about',
  '/faq',
  '/home',
  '/products',
  '/contact',
  '/pricing',
];

// Static user for demo
export const DEMO_USER_ID = 'user_123';

