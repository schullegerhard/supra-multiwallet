"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, Key, CheckCircle } from 'lucide-react';

export const runtime = 'edge';

interface ProtectedClientProps {
  address: string;
}

export default function ProtectedClient({ address }: ProtectedClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Security Info
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-8"
        >
          <h2 className="text-xl font-bold mb-4">Protected Route Demo</h2>
          <p className="text-gray-400 mb-6">
            This is a demonstration of a JWT-protected route. Only authenticated users with the correct wallet address can access this page.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Server-Side Authentication</h3>
                <p className="text-sm text-gray-400">
                  Your JWT token was verified on the server before rendering this page
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Address Verification</h3>
                <p className="text-sm text-gray-400">
                  The wallet address in the URL was matched against your authenticated address
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Automatic Redirect</h3>
                <p className="text-sm text-gray-400">
                  Unauthorized users are automatically redirected to the home page
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Use Case:</strong> This pattern is perfect for user dashboards, account settings, private profiles, or any wallet-specific content.
            </p>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-8"
        >
          <h2 className="text-xl font-bold mb-4">Security Features</h2>
          <p className="text-gray-400 mb-6">
            This page is protected by multiple layers of security:
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">HttpOnly Cookies</h3>
                <p className="text-sm text-gray-400">
                  Your JWT token is stored in httpOnly cookies, making it inaccessible to JavaScript and protecting against XSS attacks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ed25519 Signature Verification</h3>
                <p className="text-sm text-gray-400">
                  Your wallet signature was cryptographically verified using Ed25519 before issuing the JWT token.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <Key className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Time-Based Nonce Validation</h3>
                <p className="text-sm text-gray-400">
                  Cryptographically signed, time-based nonces (5-minute expiry) prevent replay attacks without requiring external storage.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Token Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Algorithm:</span>
                <span className="text-white font-mono">HS256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expiration:</span>
                <span className="text-white font-mono">24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono truncate max-w-[200px]">{address}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Implementation Guide */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <h2 className="text-xl font-bold mb-4">Implementation</h2>
        <p className="text-gray-400 mb-4">
          This protected route pattern can be easily reused:
        </p>

        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
          <pre className="text-xs text-gray-300">
            <code>{`// app/protected/[walletAddress]/page.tsx
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage({ params }) {
  const token = cookies().get('authToken')?.value;
  const verified = await verifyToken(token);
  
  if (!verified) redirect('/');
  
  const isAuthorized = 
    verified.address === params.walletAddress;
  
  if (!isAuthorized) redirect('/');
  
  return <YourProtectedContent />;
}`}</code>
          </pre>
        </div>

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-300">
            <strong>Note:</strong> This page will automatically redirect unauthorized users to the home page. Try accessing someone else's wallet address path to see the protection in action!
          </p>
        </div>
      </div>
    </div>
  );
}
