import './globals.css';
import { AuthProvider } from '../lib/auth';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Zoning Feasibility Agent | Municipal Land Feasibility Studio',
  description: 'Automated municipal zoning feasibility analysis, setbacks, FAR, and buildable envelope clearance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

