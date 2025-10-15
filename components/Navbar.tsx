'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Menu, X, Wallet, LogOut, Shield } from 'lucide-react';
import ConnectWalletHandler from './ConnectWalletHandler';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  return (
    <ConnectWalletHandler>
      {({ isConnected, accounts, loading, balance, handleConnect, handleDisconnect }) => (
        <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                onClick={() => router.push('/')}
                className="flex items-center"
              >
                <h1  className="text-xl font-bold bg-gradient-to-r from-green-400 via-teal-400-400 to-orange-400 text-transparent bg-clip-text">
                  Supra Multiwallet Connect
                </h1>
              </motion.div>

              {/* Desktop: Wallet Info & Connect Button */}
              <div className="hidden md:flex items-center gap-4">
                {isConnected && (
                  <>
                    <Link href={`/protected/${accounts[0]}`}>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Access Protected Page
                      </Button>
                    </Link>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700"
                    >
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className="text-sm font-semibold text-white">
                          {parseFloat(balance || '0').toFixed(2)} SUPRA
                        </p>
                      </div>
                      <div className="h-8 w-px bg-gray-700"></div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="text-sm font-mono text-white">
                          {accounts[0] ? `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}` : ''}
                        </p>
                      </div>
                    </motion.div>
                    

                  </>
                )}

                {!isConnected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Mobile: Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden border-t border-gray-800 bg-gray-900"
              >
                <div className="px-4 py-4 space-y-4">
                  {isConnected && (
                    <>
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Balance</p>
                          <p className="text-lg font-semibold text-white">
                            {parseFloat(balance || '0').toFixed(2)} SUPRA
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Address</p>
                          <p className="text-sm font-mono text-white break-all">
                            {accounts[0]}
                          </p>
                        </div>
                      </div>
                      
                      <Link href={`/protected/${accounts[0]}`} className="block">
                        <Button
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20"
                        >
                          <Shield className="mr-2 h-5 w-5" />
                          Protected Page
                        </Button>
                      </Link>
                    </>
                  )}

                  {!isConnected ? (
                    <Button
                      onClick={() => {
                        handleConnect();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        handleDisconnect();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={loading}
                      variant="outline"
                      className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 font-semibold py-3 rounded-lg transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-5 w-5" />
                          Disconnect Wallet
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      )}
    </ConnectWalletHandler>
  );
};

export default Navbar;
