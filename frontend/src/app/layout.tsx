import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fundio Analytics",
  description: "Real-time analytics dashboard",
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
            width: '100px', 
            backgroundColor: 'var(--bg-sidebar)', 
            padding: '2rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
            position: 'fixed',
            height: '100vh',
            zIndex: 10
          }}>
            {/* Logo */}
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'white', 
              borderRadius: '50%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              ⚡
            </div>

            {/* Nav Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
              <NavItem href="/" icon="📊" active />
              <NavItem href="/ingest" icon="⚡" />
              <NavItem href="/analytics" icon="🔍" />
              <NavItem href="#" icon="⚙️" />
            </nav>

            {/* Bottom Avatar */}
            <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%' }}></div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main style={{ marginLeft: '100px', flex: 1, padding: '2rem', backgroundColor: 'var(--bg-body)', minHeight: '100vh' }}>
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}

// Helper Component for Sidebar Items
function NavItem({ href, icon, active }: { href: string; icon: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      width: '48px',
      height: '48px',
      borderRadius: '16px',
      backgroundColor: active ? 'var(--primary)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      color: active ? '#0D1E16' : '#666',
      transition: '0.2s'
    }}>
      {icon}
    </Link>
  )
}
