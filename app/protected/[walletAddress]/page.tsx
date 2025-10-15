import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProtectedClient from './client';

interface PageProps {
  params: {
    walletAddress: string;
  };
}

export default async function ProtectedPage({ params }: PageProps) {
  // Get the auth token from cookies
  const cookieStore = cookies();
  const token = cookieStore.get('authToken')?.value;
  
  // Verify the user's token on the server
  const verified = await verifyToken(token);

  // If no valid token, redirect to home
  if (!verified) {
    return <div className="min-h-screen bg-gray-900 text-white pt-24 px-4">Unauthorized, requires sign-in to wallet to access this page.</div>;
  }

  // Check if the wallet address in the URL matches the authenticated user's address
  const { walletAddress } = params;
  const isAuthorized = verified.address.toLowerCase() === walletAddress.toLowerCase();

  // If the addresses don't match, redirect to home (unauthorized)
  if (!isAuthorized) {
    return <div className="min-h-screen bg-gray-900 text-white pt-24 px-4">Unauthorized, requires sign-in to wallet to access this page.</div>;
  }

  // User is authenticated and authorized to view this page
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">✅ Authenticated</h1>
              <p className="text-gray-400 text-sm">You are authorized to view this page</p>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Connected Wallet Address:</p>
            <p className="font-mono text-sm break-all text-white">{verified.address}</p>
          </div>
        </div>

        {/* Client Component */}
        <ProtectedClient address={verified.address} />
      </div>
    </div>
  );
}
