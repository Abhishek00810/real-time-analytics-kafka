'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Types
interface PageStats {
  page_url: string;
  count: number;
}

interface AnalyticsData {
  user_id: string;
  total_clicks: number;
  pages: PageStats[];
}

// Static user for demo
const DEMO_USER_ID = 'user_123';

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const barChartData = {
    labels: data?.pages.map(p => p.page_url) || [],
    datasets: [{
      label: 'Clicks',
      data: data?.pages.map(p => p.count) || [],
      backgroundColor: data?.pages.map((_, i) => 
        i % 2 === 0 ? '#0D1E16' : '#C1E14A'
      ) || [],
      borderRadius: 6,
      barThickness: 24,
    }],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: { 
        grid: { color: '#f0f0f0', borderDash: [5, 5] },
        border: { display: false },
        beginAtZero: true,
      }
    },
  };

  const topPage = data?.pages[0];
  const doughnutData = {
    labels: data?.pages.slice(0, 4).map(p => p.page_url) || [],
    datasets: [{
      data: data?.pages.slice(0, 4).map(p => p.count) || [],
      backgroundColor: ['#0D1E16', '#C1E14A', '#4A5568', '#A0AEC0'],
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  return (
    <div>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Analytics Dashboard 📊
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time click analytics for <span style={{ 
              background: 'var(--primary-soft)', 
              padding: '2px 8px', 
              borderRadius: '6px',
              fontWeight: 600,
              color: '#6b7f1a'
            }}>{DEMO_USER_ID}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button className="btn btn-outline" onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          <button className="btn btn-primary">
            📥 Export
          </button>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div style={{ 
          background: '#FEE2E2', 
          color: '#DC2626', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ⚠️ {error} - Make sure the backend is running on port 30081
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Total Clicks Card */}
        <div className="card card-dark" style={{ 
          background: 'linear-gradient(135deg, #0D1E16 0%, #1a3a28 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Clicks</p>
            <div className="stat-value" style={{ color: 'white' }}>
              {loading ? <span className="skeleton" style={{ width: '100px', height: '40px', display: 'block' }}></span> : data?.total_clicks.toLocaleString()}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span className="badge badge-success">↑ 12% vs last week</span>
            </div>
          </div>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            width: '120px',
            height: '120px',
            background: 'var(--primary)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>
        </div>

        {/* Top Page Card */}
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Top Page</p>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            {loading ? <span className="skeleton" style={{ width: '150px', height: '24px', display: 'block' }}></span> : topPage?.page_url || '-'}
          </div>
          <div className="stat-value">
            {loading ? <span className="skeleton" style={{ width: '80px', height: '40px', display: 'block' }}></span> : topPage?.count.toLocaleString()}
          </div>
          <p className="stat-label">clicks</p>
        </div>

        {/* Pages Tracked Card */}
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pages Tracked</p>
          <div className="stat-value">
            {loading ? <span className="skeleton" style={{ width: '60px', height: '40px', display: 'block' }}></span> : data?.pages.filter(p => p.count > 0).length}
          </div>
          <p className="stat-label">active pages</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Ingestion', 'Processor', 'Analytics', 'Redis'].map(s => (
              <span key={s} className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ {s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Bar Chart */}
        <div className="card" style={{ minHeight: '400px' }}>
          <div className="card-header">
            <h3 style={{ fontWeight: 600 }}>Clicks by Page</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#0D1E16', borderRadius: '3px' }}></span> Odd
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#C1E14A', borderRadius: '3px' }}></span> Even
              </span>
            </div>
          </div>
          <div style={{ height: '320px' }}>
            {loading ? (
              <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
            ) : (
              <Bar options={barChartOptions} data={barChartData} />
            )}
          </div>
        </div>

        {/* Right Side - Doughnut + List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Doughnut Chart */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Distribution</h3>
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                <div className="skeleton" style={{ width: '140px', height: '140px', borderRadius: '50%' }}></div>
              ) : (
                <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: '70%' }} />
              )}
            </div>
          </div>

          {/* Top Pages List */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600 }}>Top Pages</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '48px', width: '100%' }}></div>
                ))
              ) : (
                data?.pages.slice(0, 4).map((page, i) => (
                  <div key={page.page_url} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg-body)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: i % 2 === 0 ? '#0D1E16' : '#C1E14A',
                      color: i % 2 === 0 ? 'white' : '#0D1E16',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{page.page_url}</div>
                      <div className="progress-bar" style={{ marginTop: '4px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(page.count / (data?.pages[0]?.count || 1)) * 100}%`,
                            background: i % 2 === 0 ? '#0D1E16' : '#C1E14A'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {page.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem 1.5rem', 
        background: 'var(--bg-card)', 
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <span>📡 Connected to API Gateway at <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>localhost:30081</code></span>
        <span>User: <strong>{DEMO_USER_ID}</strong> • Auto-refresh: 30s</span>
      </div>
    </div>
  );
}
