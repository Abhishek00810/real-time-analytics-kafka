import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Real-Time Analytics | Dashboard",
  description: "Microservices Analytics Platform Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard-container">
          
          {/* Dark Sidebar */}
          <aside style={{ 
            width: '88px', 
            backgroundColor: 'var(--bg-sidebar)', 
            padding: '1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'fixed',
            height: '100vh',
            zIndex: 10,
            borderRadius: '0 24px 24px 0'
          }}>
            {/* Logo */}
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #8FB831 100%)', 
              borderRadius: '14px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 12px rgba(193, 225, 74, 0.3)'
            }}>
              ⚡
            </div>

            {/* Nav Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <NavItem href="/" icon="📊" label="Dashboard" active />
              <NavItem href="/ingest" icon="📤" label="Ingest" />
              <NavItem href="/analytics" icon="🔍" label="Query" />
              <NavItem href="#" icon="⚙️" label="Settings" />
            </nav>

            {/* Status Indicator */}
            <div style={{ 
              padding: '12px',
              background: 'rgba(193, 225, 74, 0.1)',
              borderRadius: '12px',
              marginTop: 'auto',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                background: 'var(--primary)', 
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--primary)'
              }}></div>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ 
            marginLeft: '88px', 
            flex: 1, 
            padding: '2rem 2.5rem', 
            backgroundColor: 'var(--bg-body)', 
            minHeight: '100vh' 
          }}>
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      backgroundColor: active ? 'var(--primary)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.4rem',
      color: active ? '#0D1E16' : '#6B7280',
      transition: 'all 0.2s',
      position: 'relative'
    }} title={label}>
      {icon}
      {active && (
        <div style={{
          position: 'absolute',
          right: '-8px',
          width: '4px',
          height: '24px',
          background: 'var(--primary)',
          borderRadius: '4px 0 0 4px'
        }}></div>
      )}
    </Link>
  )
}
