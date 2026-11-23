import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Zoning Feasibility Agent | Municipal Land Feasibility Studio',
  description: 'Automated municipal zoning feasibility analysis, setbacks, FAR, and buildable envelope clearance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased flex flex-col font-sans transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
