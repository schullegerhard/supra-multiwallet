'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  X, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';
import { WalletType } from '@/hooks/useSupraMultiWallet';
import useSupraMultiWallet from '@/hooks/useSupraMultiWallet';
import starkeyIcon from '@/public/walletIcons/Starkey.png';
import ribbitIcon from '@/public/walletIcons/Ribbit.jpg';
import logo from '@/public/main/icon.png';

// Constants
const RECENT_WALLET_KEY = 'recent_wallet_type';
export const PROFILE_CACHE_KEY = 'user_profile_cache';
export const PROFILE_CACHE_TIMESTAMP_KEY = 'user_profile_cache_timestamp';
const CACHE_TTL = 600 * 1000; // 10 minutes

// Types
export interface UserProfile {
  address: string;
  username: string | null;
  profileImage: string | null;
}

interface ProfileCache {
  address: string;
  username: string | null;
  profileImage: string | null;
}

export interface ConnectWalletHandlerProps {
  onConnect?: (account: string) => void;
  onDisconnect?: () => void;
  children: (props: {
    isConnected: boolean;
    accounts: string[];
    loading: boolean;
    balance: string;
    userProfile: UserProfile | null;
    handleConnect: () => void;
    handleDisconnect: () => void;
  }) => React.ReactNode;
}

// Wallet configuration
const WALLET_INFO = {
  starkey: {
    name: 'Starkey Wallet',
    icon: (
      <img
        src={starkeyIcon.src}
        alt="Starkey Wallet"
        className="w-10 h-10 rounded-full"
      />
    ),
    downloadUrl:
      'https://chromewebstore.google.com/detail/starkey-wallet-the-offici/hcjhpkgbmechpabifbggldplacolbkoh',
  },
  ribbit: {
    name: 'Ribbit Wallet',
    icon: (
      <img
        src={ribbitIcon.src}
        alt="Ribbit Wallet"
        className="w-10 h-10 rounded-full"
      />
    ),
    downloadUrl: 'https://ribbitwallet.com',
  },
} as const;

export const ConnectWalletHandler: React.FC<ConnectWalletHandlerProps> = ({
  onConnect,
  onDisconnect,
  children,
}) => {
  // Core wallet hook
  const starKeyWalletHook = useSupraMultiWallet();

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  const [availableWallets, setAvailableWallets] = useState<
    Array<{
      type: WalletType;
      name: string;
      isInstalled: boolean;
      capabilities: any;
    }>
  >([]);
  const [recentWallet, setRecentWallet] = useState<WalletType | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [hoveredWallet, setHoveredWallet] = useState<WalletType | null>(null);
  const [connectionStage, setConnectionStage] = useState<
    'idle' | 'connecting' | 'signing' | 'success' | 'error' | 'connected-not-signed'
  >('idle');
  const [connectionStageStartTime, setConnectionStageStartTime] = useState<number | null>(null);
  const [canClickOutside, setCanClickOutside] = useState(false);

  // Cache helper function
  const getProfileFromCache = (): ProfileCache | null => {
    try {
      if (typeof window === 'undefined') return null;

      const cachedData = sessionStorage.getItem(PROFILE_CACHE_KEY);
      const timestamp = sessionStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);

      if (!cachedData || !timestamp) return null;

      const now = Date.now();
      const cacheTime = parseInt(timestamp);

      if (now - cacheTime > CACHE_TTL) {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        sessionStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
        return null;
      }

      return JSON.parse(cachedData) as ProfileCache;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  };

  // Balance update function
  const updateWalletBalance = async () => {
    const provider = starKeyWalletHook.getCurrentProvider();
    try {
      await new Promise((resolve) => setTimeout(resolve, 1));

      switch (starKeyWalletHook.selectedWallet) {
        case 'starkey': {
          const balance = await provider.balance();
          if (balance && balance.formattedBalance) {
            setWalletBalance(balance.formattedBalance);
          }
          break;
        }
        case 'ribbit': {
          const walletBalanceRequest = {
            chainId: parseInt(process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'),
            resourceType: '0x1::supra_coin::SupraCoin',
            decimals: 8,
          };
          const balance = await provider.getWalletBalance(walletBalanceRequest);
          const balanceStr = balance.balance;
          console.log("balance.balance", balanceStr, "balance", balance);
          const numericBalance = balanceStr;
          if (numericBalance) {
            setWalletBalance(numericBalance);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Connect wallet function
  const connectWallet = async (walletType?: WalletType) => {
    if (walletType) {
      setLoading(true);
      setSelectedWallet(walletType);
      setConnectionStage('connecting');
      try {
        const success = await starKeyWalletHook.connectWallet(walletType);
        if (success) {
          localStorage.setItem(RECENT_WALLET_KEY, walletType);
          setRecentWallet(walletType);
          if (starKeyWalletHook.accounts.length > 0) {
            onConnect?.(starKeyWalletHook.accounts[0]);
          }
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setConnectionStage('idle');
      } finally {
        setLoading(false);
      }
    } else {
      handleConnectClick();
    }
  };

  // Handle connect click
  const handleConnectClick = () => {
    const installedWallets = availableWallets.filter((w) => w.isInstalled);

    if (installedWallets.length === 0) {
      setShowWalletModal(true);
    } else if (installedWallets.length === 1) {
      setShowWalletModal(true);
        //connectWallet(installedWallets[0].type);
    } else {
      setShowWalletModal(true);
    }
  };

  // Disconnect wallet function
  const handleDisconnectWallet = async () => {
    setLoading(true);
    try {
      await starKeyWalletHook.disconnectWallet();
      setUserProfile(null);
      setWalletBalance('0.00');
      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get connection stage info
  const getConnectionStageInfo = () => {
    const wallet = selectedWallet ? WALLET_INFO[selectedWallet] : null;

    switch (connectionStage) {
      case 'connecting':
        return {
          title: `Waiting for ${wallet?.name || 'Wallet'}`,
          subtitle: 'For a better experience, connect only one wallet at a time',
          buttonText: 'Connecting',
        };
      case 'signing':
        return {
          title: 'Sign to verify',
          subtitle: 'For a better experience, connect only one wallet at a time',
          buttonText: 'Signing',
        };
      case 'success':
        return {
          title: `Connected to ${wallet?.name.replace(' Wallet', '') || 'Wallet'}`,
          subtitle: 'Welcome back to Crystara',
          buttonText: 'Connected',
        };
      case 'error':
        return {
          title: 'Error',
          subtitle: 'Wallet connection failed. Please try again.',
          buttonText: 'Close',
        };

     case 'connected-not-signed':
        return {
            title: `Connected to ${wallet?.name.replace(' Wallet', '') || 'Wallet'}`,
            subtitle: 'Sign-in request rejected. General access allowed, but some features may be limited.',
            buttonText: 'Connected',
          };
      default:
        return null;
    }
  };

  // Load recent wallet on mount
  useEffect(() => {
    const recent = localStorage.getItem(RECENT_WALLET_KEY) as WalletType;
    if (recent && ['starkey', 'ribbit'].includes(recent)) {
      setRecentWallet(recent);
    }
  }, []);

  // Check available wallets
  useEffect(() => {
    const checkWallets = () => {
      const wallets = starKeyWalletHook.getAvailableWallets();
      setAvailableWallets(wallets);
    };

    checkWallets();
    const interval = setInterval(checkWallets, 2000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Update balance when wallet connects
  useEffect(() => {
    if (starKeyWalletHook.accounts.length > 0) {
      updateWalletBalance();
    }
  }, [starKeyWalletHook.accounts, starKeyWalletHook.selectedWallet]);

  // Listen for wallet events
  useEffect(() => {
    const handlePresignedState = () => {setConnectionStage( () => 'signing'); };
    const handlePostsignedState = () => {
      setConnectionStage('success');
      setTimeout(() => {
        setConnectionStage('idle');
        setShowWalletModal(false);
        updateWalletBalance();
      }, 2500);
    };
    const handleWalletError = () => {
        if(connectionStage == "signing") {
          setConnectionStage(() => 'connected-not-signed');
        } else {
          setConnectionStage(() => 'error');
        }
    
        setTimeout(() => {
          setShowWalletModal(false);
          setSelectedWallet(null);
          setConnectionStage('idle');
          setLoading(false);
        }, 2500);
      };

    const handleStarkeyEvents = (event: any) => {
      if (event?.data?.name?.startsWith('starkey-')) {
        switch (event?.data?.name) {
          case 'starkey-wallet-updated':
          case 'starkey-wallet-connected':
            setTimeout(updateWalletBalance, 1);
            break;
          case 'starkey-wallet-disconnected':
            setWalletBalance('0.00');
            break;
        }
      }
    };

    window.addEventListener('presigned-state', handlePresignedState);
    window.addEventListener('postsigned-state', handlePostsignedState);
    window.addEventListener('wallet-error', handleWalletError);
    window.addEventListener('message', handleStarkeyEvents);

    return () => {
      window.removeEventListener('presigned-state', handlePresignedState);
      window.removeEventListener('postsigned-state', handlePostsignedState);
      window.removeEventListener('wallet-error', handleWalletError);
      window.removeEventListener('message', handleStarkeyEvents);
    };
  }, [connectionStage]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdated = (event: CustomEvent<UserProfile>) => {
      const { address, username, profileImage } = event.detail;
      if (starKeyWalletHook.accounts[0] === address) {
        setUserProfile({ address, username, profileImage });
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated as EventListener);
    };
  }, [starKeyWalletHook.accounts]);

  // Periodic balance refresh
  useEffect(() => {
    if (starKeyWalletHook.accounts.length > 0) {
      const balanceInterval = setInterval(updateWalletBalance, 30000);
      return () => clearInterval(balanceInterval);
    }
  }, [starKeyWalletHook.accounts]);

  // Track connection stage timing
  useEffect(() => {
    if (connectionStage === 'connecting' || connectionStage === 'signing') {
      setConnectionStageStartTime(Date.now());
      setCanClickOutside(false);
      
      const timer = setTimeout(() => {
        setCanClickOutside(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setConnectionStageStartTime(null);
      setCanClickOutside(false);
    }
  }, [connectionStage]);

  // Handle modal close with loading state check
  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Allow closing if:
      // 1. Connection stage is idle or success
      // 2. User has been in loading state for > 2s and can click outside
      if (
        connectionStage === 'idle' || 
        connectionStage === 'success' ||
        connectionStage === 'connected-not-signed' ||
        connectionStage === 'error' ||
        (canClickOutside && (connectionStage === 'connecting' || connectionStage === 'signing'))
      ) {
        setShowWalletModal(false);
        setSelectedWallet(null);
        setLoading(false);
        setCanClickOutside(false);
        setConnectionStageStartTime(null);
        setTimeout(() => {
          setConnectionStage('idle');
        }, 100);
      }
    }
  };

  return (
    <>
      {children({
        isConnected: starKeyWalletHook.accounts.length > 0,
        accounts: starKeyWalletHook.accounts,
        loading: loading || starKeyWalletHook.loading,
        balance: walletBalance,
        userProfile,
        handleConnect: handleConnectClick,
        handleDisconnect: handleDisconnectWallet,
      })}

      {/* Wallet Selection Modal */}
      <Dialog
        open={showWalletModal}
        onOpenChange={handleModalClose}
      >
        <DialogContent className="px-4 py-6 w-[90%] mx-auto max-w-sm bg-gradient-to-br from-brand-dark via-gray-900 to-brand-dark border border-brand-dark sm:rounded-3xl rounded-3xl">


          {/* Add visual indicator when clickable */}
          {canClickOutside && (connectionStage === 'connecting' || connectionStage === 'signing') && (
            <div className="absolute top-4 right-4">
              <X className="h-5 w-5" />
            </div>
          )}

          <div className="">
            {connectionStage === 'idle' ? (
              <>
                <p className="text-center text-sm text-brand-light/75 mb-6">
                  Log in or sign up
                </p>

                <div className="flex justify-center mb-8">
                  <img className="h-12 w-auto mx-auto" src={logo.src} alt="Crystara" />
                </div>

                <div className="space-y-3">
                  {availableWallets.map((wallet) => {
                    if (wallet.isInstalled) {
                      return (
                        <div key={wallet.type} className="w-full relative">
                          <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.05, ease: 'easeInOut' }}
                            onClick={() =>
                              wallet.isInstalled
                                ? connectWallet(wallet.type)
                                : window.open(WALLET_INFO[wallet.type].downloadUrl, '_blank')
                            }
                            disabled={loading && wallet.isInstalled}
                            onMouseEnter={() => setHoveredWallet(wallet.type)}
                            onMouseLeave={() => setHoveredWallet(null)}
                            className="w-full px-4 py-2 rounded-2xl border border-gray-950/60 hover:border-gray-800/80 bg-gray-950/20 hover:bg-gray-900/40 transition-all duration-300 flex items-center gap-4 group"
                          >
                            <div className="flex-shrink-0">
                              {WALLET_INFO[wallet.type].icon}
                            </div>

                            <div className="flex-1 text-left">
                              <h3 className="font-medium text-white">
                                {WALLET_INFO[wallet.type].name}
                              </h3>
                              {!wallet.isInstalled && (
                                <p className="text-sm text-gray-400">
                                  Not installed - Click to download
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0">
                              {recentWallet === wallet.type && wallet.isInstalled ? (
                                <span className="bg-gray-800/60 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700/40">
                                  Recent
                                </span>
                              ) : wallet.isInstalled ? (
                                loading && wallet.type === selectedWallet ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : (
                                  hoveredWallet === wallet.type && (
                                    <span className="text-gray-400 text-sm font-medium">
                                      Connect
                                    </span>
                                  )
                                )
                              ) : (
                                <ExternalLink className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </motion.button>
                        </div>
                      );
                    }
                  })}

                  {availableWallets.filter((w) => w.isInstalled).length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No Wallets Detected
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Please install a wallet extension to connect to Crystara
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4">
                  <p className="text-center text-xs text-brand-light/50">
                    © Powered by Crystara
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full text-center py-8">
                {(() => {
                  const stageInfo = getConnectionStageInfo();
                  const wallet = selectedWallet ? WALLET_INFO[selectedWallet] : null;

                  return (
                    <>
                      <div className="relative flex justify-center mb-6">
                        {connectionStage === 'success' || connectionStage === 'connected-not-signed' ? (
                          <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
                            {wallet && (
                              <div className="w-12 h-12 flex items-center justify-center">
                                {wallet.icon}
                              </div>
                            )}
                          </div>
                        ) : connectionStage === 'error' ? (
                          <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center">
                            {wallet && (
                                <div className="w-12 h-12 flex items-center justify-center">
                                    {wallet.icon}
                                </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-gray-600 border-t-gray-400 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {wallet && (
                                <div className="w-12 h-12 flex items-center justify-center">
                                  {wallet.icon}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2">
                        {stageInfo?.title}
                      </h3>

                      <p className="text-sm text-gray-400 mb-6">
                        {stageInfo?.subtitle}
                      </p>

                      <Button
                        disabled
                        className="w-full bg-gray-700 text-gray-400 cursor-not-allowed rounded-2xl py-3"
                      >
                        {stageInfo?.buttonText}
                      </Button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectWalletHandler; 