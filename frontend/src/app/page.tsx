'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Chart Options for that "Clean Bar" look
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { boxWidth: 8, usePointStyle: true }
    },
    title: { display: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: { 
      grid: { color: '#f0f0f0', borderDash: [5, 5] },
      border: { display: false }
    }
  },
  elements: {
    bar: { borderRadius: 4 }
  }
};

const chartData = {
  labels: ['10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'],
  datasets: [
    {
      label: 'Ingested Events',
      data: [65, 59, 80, 81, 56, 55, 40, 70],
      backgroundColor: '#0D1E16', // Dark Green bar
      barThickness: 12,
    },
    {
      label: 'Processed',
      data: [28, 48, 40, 19, 86, 27, 90, 60],
      backgroundColor: '#C1E14A', // Lime Green bar
      barThickness: 12,
    }
  ],
};

export default function Dashboard() {
  return (
    <div>
      {/* Top Header Section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Hey, Analytics Team 👋</h1>
          <p>Here is your real-time system performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid #ddd', background: 'white', fontWeight: 600 }}>
             Running
           </button>
           <button className="btn-primary">
             Download Report
           </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Card 1: Dark Accumulation Card */}
            <div className="card" style={{ backgroundColor: '#0D1E16', color: 'white', flexDirection: 'row', alignItems: 'center' }}>
               <div>
                 <p style={{ color: '#888', marginBottom: '0.5rem' }}>Total Events</p>
                 <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>1.2M+</h2>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>16%</span>
                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>28%</span>
                 </div>
               </div>
               {/* Circle Graphic Placeholder */}
               <div style={{ 
                 width: '100px', height: '100px', 
                 border: '8px solid #C1E14A', 
                 borderRadius: '50%', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 fontWeight: 'bold', fontSize: '1.2rem',
                 marginLeft: 'auto'
               }}>
                 85%
               </div>
            </div>

            {/* Card 2: 4-Grid Status */}
            <div className="card">
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <h3>System Health</h3>
                 <span style={{ color: '#aaa' }}>•••</span>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <ServiceStatus name="Ingestion" status="Up" icon="📥" />
                  <ServiceStatus name="Processor" status="Up" icon="⚙️" />
                  <ServiceStatus name="Analytics" status="Up" icon="📊" />
                  <ServiceStatus name="Redis" status="98%" icon="💾" />
               </div>
            </div>
          </div>

          {/* Big Chart Section */}
          <div className="card" style={{ minHeight: '400px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>Traffic Statistics</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                      <span style={{ width: 8, height: 8, background: '#0D1E16', borderRadius: '50%' }}></span> Ingested
                   </span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                      <span style={{ width: 8, height: 8, background: '#C1E14A', borderRadius: '50%' }}></span> Processed
                   </span>
                </div>
             </div>
             <div style={{ flex: 1 }}>
                <Bar options={chartOptions} data={chartData} />
             </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           
           {/* Total Balance / Latency Card */}
           <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p>Avg Latency</p>
                <span>📄</span>
              </div>
              <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>45ms</h2>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                 <span style={{ color: '#C1E14A' }}>↗ 12%</span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                 <button className="btn-primary" style={{ flex: 1 }}>Refresh</button>
                 <button style={{ flex: 1, border: '1px solid #ddd', borderRadius: '12px', background: 'transparent' }}>Log</button>
              </div>
           </div>

           {/* Top Pages List */}
           <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                 <h3>Top Pages</h3>
                 <button style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #eee', background: 'white' }}>+</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <PageItem url="/home" count="45k" color="#0D1E16" />
                 <PageItem url="/pricing" count="12k" color="#C1E14A" />
                 <PageItem url="/blog" count="8k" color="#0D1E16" />
                 <PageItem url="/contact" count="2k" color="#C1E14A" />
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

// Sub-components
function ServiceStatus({ name, status, icon }: { name: string, status: string, icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 40, height: 40, background: '#F4F5F7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
         <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
         <div style={{ fontSize: '0.8rem', color: '#888' }}>{status}</div>
      </div>
    </div>
  )
}

function PageItem({ url, count, color }: { url: string, count: string, color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#F9FAFB', borderRadius: '12px' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
             {count}
          </div>
          <span style={{ fontWeight: 500 }}>{url}</span>
       </div>
       <span style={{ color: '#aaa' }}>•••</span>
    </div>
  )
}
