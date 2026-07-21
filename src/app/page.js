import { getCurrentUserId } from '@/lib/auth';
import Link from 'next/link';
import DashboardClient from './components/DashboardClient'; // We'll put the client hooks here

export default async function HomePage() {
  const userId = await getCurrentUserId();

  // If the user is NOT logged in, show the unauthorized / landing view
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8 font-sans">
        <main className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl text-center">
          <div className="inline-block p-3 bg-red-500/10 text-red-400 rounded-xl mb-4 font-mono text-sm border border-red-500/20">
            401: Unauthorized
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Access Restricted</h1>
          <p className="text-gray-400 text-sm mb-6">You must be signed in to access the Mail Merger dashboard.</p>
          
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full bg-blue-600 hover:bg-blue-500 transition-all py-3 rounded-xl font-semibold text-sm text-center">
              Sign In
            </Link>
            <Link href="/register" className="w-full bg-gray-800 hover:bg-gray-700 transition-all py-3 rounded-xl font-semibold text-sm text-center">
              Create an Account
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // If logged in, render the client dashboard component
  return <DashboardClient />;
}