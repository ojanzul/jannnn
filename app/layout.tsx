import "./globals.css";

export const metadata = {
  title: "AURORA — Signal Dashboard",
  description: "Read-only view of the automated signal pipeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">A</div>
            <div className="brand-text">
              <h1>AURORA</h1>
              <p>Automated Signal Dashboard</p>
            </div>
          </div>
          <nav className="nav">
            <a href="/">Signals</a>
            <a href="/models">AI Models</a>
            <a href="/performance">Live vs Backtest</a>
            <a href="/journal">Journal</a>
          </nav>
          <div className="status-chip"><span className="dot" /> Notify-only — no auto-execution</div>
        </div>
        {children}
      </body>
    </html>
  );
}
