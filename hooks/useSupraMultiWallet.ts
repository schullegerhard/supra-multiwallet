import { useState, useEffect, useRef } from 'react';
import nacl from 'tweetnacl';
import { ethers } from 'ethers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import useMoveLangConversionUtils from '@/hooks/useConversionUtils';

// Import types from ribbit-connect package
import {
  type DappMetadata,
  type WalletBalanceRequest,
  type RawTransactionResponse,
  type SignMessageResponse,
  type RawTxnRequest,
  SupraChainId,
  BCS,
  type WalletInfo,
  initSdk,
  type RibbitWalletSDK,
} from 'ribbit-wallet-connect';

// Define wallet types
export type WalletType = 'starkey' | 'ribbit';

// Define wallet capabilities interface
interface WalletCapabilities {
  signMessage: boolean;
  accountSwitching: boolean;
  networkSwitching: boolean;
  rawTransactions: boolean;
  eventListeners: boolean;
  tokenRevalidation: boolean;
}

// Wallet configuration
const WALLET_CONFIGS = {
  starkey: {
    capabilities: {
      signMessage: true,
      accountSwitching: true,
      networkSwitching: true,
      rawTransactions: true,
      eventListeners: true,
      tokenRevalidation: true,
    },
    provider: () =>
      typeof window !== 'undefined' && (window as any)?.starkey?.supra,
  },
  ribbit: {
    capabilities: {
      signMessage: true,
      accountSwitching: false, // Ribbit doesn't support account switching
      networkSwitching: false, // Ribbit network switching happens in-app
      rawTransactions: true,
      eventListeners: false,
      tokenRevalidation: false, // Ribbit doesn't support token revalidation
    },
    provider: () => initSdk(),
  },
} as const;

// Wallet events for communication with the parent window
export const WALLET_EVENTS = {
  CONNECTED: 'wallet-connected',
  PRESIGNED_STATE: 'presigned-state',
  POSTSIGNED_STATE: 'postsigned-state',
  ERROR: 'wallet-error',
} as const;

// Get cookie function
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((r) => r.startsWith(name + '='));
  return match
    ? decodeURIComponent(match.split('=').slice(1).join('='))
    : null;
};

// Storage utility functions
const STORAGE_KEY = 'multiwallet.selectedWallet';

const setStoredWalletType = (walletType: WalletType) => {
  try {
    // Try localStorage first
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, walletType);
      return;
    }
  } catch (e) {
    console.warn('localStorage not available');
  }

  try {
    // Fallback to sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, walletType);
      return;
    }
  } catch (e) {
    console.warn('sessionStorage not available');
  }

  try {
    // Fallback to cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${STORAGE_KEY}=${walletType}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      return;
    }
  } catch (e) {
    console.warn('cookies not available');
  }
};

const getStoredWalletType = (): WalletType => {
  if (typeof window === 'undefined') return 'starkey';

  try {
    // Try localStorage first
    if (window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY) as WalletType;
      if (stored && ['starkey', 'ribbit'].includes(stored)) {
        return stored;
      }
    }
  } catch (e) {
    console.warn('localStorage read failed');
  }

  try {
    // Fallback to sessionStorage
    if (window.sessionStorage) {
      const stored = sessionStorage.getItem(STORAGE_KEY) as WalletType;
      if (stored && ['starkey', 'ribbit'].includes(stored)) {
        return stored;
      }
    }
  } catch (e) {
    console.warn('sessionStorage read failed');
  }

  try {
    // Fallback to cookie
    if (typeof document !== 'undefined') {
      const stored = getCookie(STORAGE_KEY) as WalletType;
      if (stored && ['starkey', 'ribbit'].includes(stored)) {
        return stored;
      }
    }
  } catch (e) {
    console.warn('cookie read failed');
  }

  return 'starkey'; // Default fallback
};

const clearStoredWalletType = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // Silent fail
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // Silent fail
  }

  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch (e) {
    // Silent fail
  }
};

const useSupraMultiWallet = () => {
  const router = useRouter();

  // Initialize wallet selection from storage
  const [selectedWallet, setSelectedWallet] = useState<WalletType>(getStoredWalletType);
  const [walletCapabilities, setWalletCapabilities] = useState<WalletCapabilities>(
    WALLET_CONFIGS[getStoredWalletType()].capabilities
  );

  // Provider states (keep separate for compatibility)
  const [supraProvider, setSupraProvider] = useState<any>(
    WALLET_CONFIGS.starkey.provider()
  );
  const [ribbitProvider, setRibbitProvider] = useState<RibbitWalletSDK | null>(
    WALLET_CONFIGS.ribbit.provider()
  );

  // Existing states
  const [isExtensionInstalled, setIsExtensionInstalled] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [networkData, setNetworkData] = useState<any>();
  const [balance, setBalance] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [justRequestedRelative, setJustRequestedRelative] =
    useState<boolean>(false);
  const [transactions, setTransactions] = useState<{ hash: string }[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string>('');

  const addTransactions = (hash: string) => {
    setTransactions((prev) => [{ hash }, ...prev]);
  };

  // Get current wallet provider
  const getCurrentProvider = () => {
    switch (selectedWallet) {
      case 'starkey': {
        return supraProvider;
      }
      case 'ribbit': {
        return ribbitProvider;
      }
      default: {
        return supraProvider;
      }
    }
  };

  // Check if extension is installed
  const checkExtensionInstalled = async () => {
    switch (selectedWallet) {
      case 'starkey': {
        const provider = WALLET_CONFIGS.starkey.provider();
        setSupraProvider(provider);
        setIsExtensionInstalled(!!provider);
        return !!provider;
      }
      case 'ribbit': {
        const provider = WALLET_CONFIGS.ribbit.provider();
        if (!provider) {
          setRibbitProvider(null);
          setIsExtensionInstalled(false);
          return false;
        }

        try {
          setRibbitProvider(provider);
          setIsExtensionInstalled(true);
          return true;
        } catch (error) {
          console.error('Error checking Ribbit wallet readiness:', error);
          setRibbitProvider(null);
          setIsExtensionInstalled(false);
          return false;
        }
      }
      default: {
        return false;
      }
    }
  };

  // Initial provider setup
  useEffect(() => {
    checkExtensionInstalled();
    if (isExtensionInstalled) {
      updateAccounts();
    }
  }, [selectedWallet, isExtensionInstalled]);

  // Extension detection effect
  useEffect(() => {
    const checkExtension = async () => {
      return await checkExtensionInstalled();
    };

    // Initial check
    checkExtension().then((isInstalled) => {
      if (isInstalled && selectedWallet === 'ribbit') {
        updateAccounts();
      }
    });

    // For non-ribbit wallets or if ribbit is not ready, keep polling
    const intv = setInterval(async () => {
      const isInstalled = await checkExtension();
      if (isInstalled) {
        clearInterval(intv);
        if (selectedWallet === 'ribbit') {
          updateAccounts();
        }
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(intv);
    }, 5000);

    return () => clearInterval(intv);
  }, [selectedWallet]);

  const checkIsExtensionInstalled = () => {
    const intervalId = setInterval(async () => {
      const isInstalled = await checkExtensionInstalled();
      if (isInstalled) {
        clearInterval(intervalId);
        updateAccounts();
      }
    }, 500);

    setTimeout(() => clearInterval(intervalId), 5000);
  };

  const updateAccounts = async () => {
    const provider = getCurrentProvider();
    if (!provider) return;

    try {
      switch (selectedWallet) {
        case 'starkey': {
          const responseAcc = await provider.account();
          setAccounts(responseAcc.length > 0 ? responseAcc : []);
          if (responseAcc.length > 0) {
            localStorage.setItem('starkey.accounts.0', responseAcc[0]);
          }
          await updateBalance();
          await getNetworkData();
          break;
        }
        case 'ribbit': {
          // Connect to wallet and get current walletAddress. Currently it will return only supra address(string). In future it will return other chain address as well or may be an array of addresses with their chain types({walletAddress: string; chain: string;}).
          const wallet = provider.getWalletInfo();
          if (wallet?.connected) {
            setAccounts([wallet.walletAddress]);
            await updateBalance();
          } else {
            setAccounts(["0xnotconnected"]);
          }
          break;
        }
        default: {
          setAccounts([]);
          break;
        }
      }
    } catch (error) {
      setAccounts([]);
      switch (selectedWallet) {
        case 'starkey': {
          localStorage.removeItem('starkey.accounts.0');
          break;
        }
        case 'ribbit': {
          // Reset ribbit session
          break;
        }
      }
    }
  };

  const updateBalance = async () => {
    const provider = getCurrentProvider();
    if (!provider || !accounts.length) {
      setBalance('');
      return;
    }

    try {
      switch (selectedWallet) {
        case 'starkey': {
          const balance = await provider.balance();
          if (balance) {
            setBalance(`${balance.formattedBalance} ${balance.displayUnit}`);
          }
          break;
        }
        case 'ribbit': {
          const walletBalanceRequest: WalletBalanceRequest = {
            chainId: parseInt(process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'),
            resourceType: '0x1::supra_coin::SupraCoin',
            decimals: 7,
          };
          const balanceStr = await provider.getWalletBalance(
            walletBalanceRequest
          );
          setBalance(`${balanceStr.balance || 0} SUPRA`);
          break;
        }
        default: {
          setBalance('');
          break;
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      setBalance('');
    }
  };

  const getNetworkData = async () => {
    const provider = getCurrentProvider();
    if (!provider) return;

    try {
      switch (selectedWallet) {
        case 'starkey': {
          const data = await provider.getChainId();
          setNetworkData(data || {});
          return data;
        }
        case 'ribbit': {
          // Ribbit doesn't have network switching, assume current chain
          const chainId = parseInt(
            process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'
          );
          const mockNetworkData = { chainId: chainId.toString() };
          setNetworkData(mockNetworkData);
          return mockNetworkData;
        }
        default: {
          setNetworkData({});
          return {};
        }
      }
    } catch (error) {
      console.error('Error getting network data:', error);
      setNetworkData({});
      return {};
    }
  };

  const connectWallet = async (walletType?: WalletType) => {
    // Update wallet selection if provided
    if (walletType) {
      updateSelectedWallet(walletType);
    }

    const provider = walletType
      ? WALLET_CONFIGS[walletType].provider()
      : getCurrentProvider();

    if (!provider) {
      toast('Extension not installed',  {
        description: `Please install the ${
          walletType || selectedWallet
        } extension`,
      });
      return false;
    }

    setLoading(true);

    try {
      switch (walletType || selectedWallet) {
        case 'starkey': {
          await provider.connect();
          await updateAccounts();
          const responseAcc = await provider.account();

          if(responseAcc.length == 0) {
            throw new Error('No account found');
          }

          if (responseAcc.length) {
            localStorage.setItem('isSigningWallet', 'false');

            localStorage.setItem('starkey.accounts.0', responseAcc[0]);

            window.dispatchEvent(
              new CustomEvent(WALLET_EVENTS.PRESIGNED_STATE, {
                detail: {
                  timestamp: Date.now(),
                  account: accounts[0],
                },
              })
            );

            // Network validation
            let networkData = await getNetworkData();
            if (
              networkData.chainId !== process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID
            ) {
              setSelectedChainId(
                () => process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'
              );
              await switchToChain(
                process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'
              );
            }

            // Authentication flow
            const nonce = await fetch('/api/auth/nonce').then((r) => r.text());
            const signature = await signMessage(
              'Sign message to login to multiwallet. By signing this message, you agree to the Terms of Service and Privacy Policy of multiwallet at https://multiwallet.trade/tos',
              nonce,
              responseAcc[0]
            );

            window.dispatchEvent(
              new CustomEvent(WALLET_EVENTS.POSTSIGNED_STATE, {
                detail: {
                  timestamp: Date.now(),
                  account: accounts[0],
                },
              })
            );

            const response = await fetch('/api/auth/create-jwt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: responseAcc[0],
                signature,
                nonce,
              }),
            });

            const { token } = await response.json();

            await fetch('/api/auth/wallet-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });

            // Dispatch connection event
            window.dispatchEvent(
              new CustomEvent(WALLET_EVENTS.CONNECTED, {
                detail: {
                  timestamp: Date.now(),
                  account: responseAcc[0],
                  wallet: 'starkey',
                },
              })
            );
          }
          break;
        }
        case 'ribbit': {

          const dappMetadata: DappMetadata = {
            name: 'multiwallet',
            description: 'NFT Marketplace and Lootbox Platform',
            logo: window.location.origin + '/favicon.ico',
            url: window.location.origin,
          };

          const response: WalletInfo = await provider.connectToWallet(
            dappMetadata
          );

          if(response.walletAddress == null) {
            throw new Error('No account found');
          }

          if (response?.connected) {
            await updateAccounts();

            if (response.walletAddress) {
              localStorage.setItem('isSigningWallet', 'false');

              window.dispatchEvent(
                new CustomEvent(WALLET_EVENTS.PRESIGNED_STATE, {
                  detail: {
                    timestamp: Date.now(),
                    account: response.walletAddress, // Fixed: was accounts[0]
                  },
                })
              );

              // Authentication flow - matching Starkey exactly
              const nonce = await fetch('/api/auth/nonce').then((r) => r.text());
              const signature = await signMessage(
                'Sign message to login to multiwallet. By signing this message, you agree to the Terms of Service and Privacy Policy of multiwallet at https://multiwallet.trade/tos', // Fixed: matching Starkey message
                nonce,
                response.walletAddress
              );

              window.dispatchEvent(
                new CustomEvent(WALLET_EVENTS.POSTSIGNED_STATE, {
                  detail: {
                    timestamp: Date.now(),
                    account: response.walletAddress, // Fixed: was accounts[0]
                  },
                })
              );

              const responseAuth = await fetch('/api/auth/create-jwt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  address: response.walletAddress,
                  signature,
                  nonce, // Fixed: was Date.now()
                }),
              });
  
              const { token } = await responseAuth.json();

              await fetch('/api/auth/wallet-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              });

              // Dispatch connection event
              window.dispatchEvent(
                new CustomEvent(WALLET_EVENTS.CONNECTED, {
                  detail: {
                    timestamp: Date.now(),
                    account: response.walletAddress,
                    wallet: 'ribbit',
                  },
                })
              );
            }
          } else {
            throw new Error('Connection rejected');
          }
          break;
        }
        default: {
          throw new Error(
            `Unsupported wallet: ${walletType || selectedWallet}`
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Connect error:', error);

      window.dispatchEvent(
        new CustomEvent(WALLET_EVENTS.ERROR, {
          detail: {
            timestamp: Date.now(),
            error: error,
          },
        })
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    const provider = getCurrentProvider();
    if (!provider) return;

    try {
      switch (selectedWallet) {
        case 'starkey': {
          await provider.disconnect();
          await fetch('/api/auth/wallet-logout', { method: 'POST' });
          break;
        }
        case 'ribbit': {
          await provider.disconnect();
          // any further clean up required do that.
          break;
        }
      }

      resetWalletData();
      // Clear wallet selection on disconnect
      clearStoredWalletType();
      router.push('/');
    } catch (error) {
      console.error('Disconnect error:', error);
      resetWalletData();
      // Clear wallet selection on error too
      clearStoredWalletType();
    }
  };

  const resetWalletData = () => {
    setAccounts([]);
    setBalance('');
    setNetworkData({});

    switch (selectedWallet) {
      case 'starkey': {
        localStorage.setItem('isSigningWallet', 'false');
        localStorage.removeItem('starkey.accounts.0');
        break;
      }
      case 'ribbit': {
        // Any required clean up
        break;
      }
    }
  };

  // THis is just an example about fetching sequence number. To be used in sendTRansaction. In case you want this function to be added in sdk I can do that. 
  const getSequenceNumber = async (address: string): Promise<number> => {
    const data = await fetch(
      `https://rpc-testnet.supra.com/rpc/v1/accounts/${address}`
    );
    if (!data.ok) {
      throw new Error(`Failed to fetch sequence number for ${address}`);
    }
    const accountData = await data.json();
    return accountData.sequence_number;
  };
  // End of example

  const sendRawTransaction = async (
    moduleAddress?: string,
    moduleName?: string,
    functionName?: string,
    params?: any[],
    runTimeParams: any[] = [],
    txExpiryTime: number = Math.ceil(Date.now() / 1000) + 3000
  ) => {
    const provider = getCurrentProvider();
    if (
      !provider ||
      !accounts.length ||
      !moduleAddress ||
      !moduleName ||
      !functionName
    )
      return;

    try {
      switch (selectedWallet) {
        case 'starkey': {
          if (!walletCapabilities.rawTransactions) {
            throw new Error('Raw transactions not supported by current wallet');
          }

          let networkData = await getNetworkData();
          if (networkData.chainId !== process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID) {
            setSelectedChainId(
              () => process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'
            );
            await provider.changeNetwork({
              chainId: process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6',
            });
          }

          const rawTxPayload = [
            accounts[0],
            0, // sequence number
            moduleAddress,
            moduleName,
            functionName,
            runTimeParams,
            params,
            {},
          ];

          const data = await provider.createRawTransactionData(rawTxPayload);
          const txHash = await provider.sendTransaction({
            data,
            from: accounts[0],
            to: moduleAddress,
            chainId: process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6',
            value: '',
          });

          addTransactions(txHash || 'failed');
          return txHash;
        }
        case 'ribbit': {
          if (!walletCapabilities.rawTransactions) {
            throw new Error('Raw transactions not supported by current wallet');
          }

          let chainId = SupraChainId.TESTNET;

          if (process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID == "6") {
            chainId = SupraChainId.TESTNET;
          } else if (process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID == "8") {
            chainId = SupraChainId.MAINNET;
          }
          
          const rawTxnRequest: RawTxnRequest = {
            sender: accounts[0], // Use actual sender address
            moduleAddress: moduleAddress!, // Use provided module address
            moduleName: moduleName!, // Use provided module name
            functionName: functionName!, // Use provided function name
            typeArgs: runTimeParams, // Use converted runtime parameters
            args: params || [], // Use provided parameters
            chainId,
          };

          const rawTxnBase64: string =
            await provider.createRawTransactionBuffer(rawTxnRequest);

          // Send to wallet
          const response: RawTransactionResponse =
            await provider.signAndSendRawTransaction({
              rawTxn: rawTxnBase64,
              chainId,
              meta: {
                description: `Call ${moduleName}::${functionName}`, // Dynamic description
              },
            });

          if (response.approved) {
            addTransactions(response.txHash || response.result || 'success');
            return response.result || response.txHash;
          } else {
            throw new Error(response.error || 'Transaction rejected');
          }
        }
        default: {
          throw new Error(
            `Raw transactions not supported for wallet: ${selectedWallet}`
          );
        }
      }
    } catch (error) {
      console.error('Send raw transaction error:', error);
      throw error;
    }
  };

  const signMessage = async (
    message: string,
    nonce = '12345',
    account?: any,
    forceSign = false
  ) => {
    const provider = getCurrentProvider();
    if (!provider) return;

    switch (selectedWallet) {
      case 'starkey': {
        if (!walletCapabilities.signMessage) {
          throw new Error('Message signing not supported by current wallet');
        }

        if (!accounts.length && !account) return;
        if (!accounts.length && account) {
          accounts[0] = account;
        }
        if (localStorage.getItem('isSigningWallet') === 'true' && !forceSign) {
          return;
        }

        localStorage.setItem('isSigningWallet', 'true');

        const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex');

        const response = await provider.signMessage({
          message: hexMessage,
          nonce,
        });

        const { publicKey, signature } = response;
        const verified = nacl.sign.detached.verify(
          new TextEncoder().encode(message),
          Uint8Array.from(Buffer.from(signature.slice(2), 'hex')),
          Uint8Array.from(Buffer.from(publicKey.slice(2), 'hex'))
        );

        localStorage.setItem('isSigningWallet', 'false');
        return { ...response, verified };
      }
      case 'ribbit': {
        if (!walletCapabilities.signMessage) {
          throw new Error('Message signing not supported by current wallet');
        }

        if (!accounts.length && !account) return;
        if (!accounts.length && account) {
          accounts[0] = account;
        }
        if (localStorage.getItem('isSigningWallet') === 'true' && !forceSign) {
          return;
        }

        localStorage.setItem('isSigningWallet', 'true');

        const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex');
        const response: SignMessageResponse = await provider.signMessage({
          message: hexMessage,
          nonce: parseInt(nonce),
          chainId: parseInt(process.env.NEXT_PUBLIC_SUPRA_CHAIN_ID || '6'),
        });

        if (response.approved && response.publicKey && response.signature) {
          const { publicKey, signature } = response;
          const verified = nacl.sign.detached.verify(
            new TextEncoder().encode(message),
            Uint8Array.from(Buffer.from(signature.slice(2), 'hex')),
            Uint8Array.from(Buffer.from(publicKey.slice(2), 'hex'))
          );

          localStorage.setItem('isSigningWallet', 'false');
          return { ...response, verified }; // Changed: return full response like Starkey
        } else {
          localStorage.setItem('isSigningWallet', 'false');
          throw new Error(response.error || 'Message signing rejected');
        }
      }
      default: {
        throw new Error(
          `Message signing not supported for wallet: ${selectedWallet}`
        );
      }
    }
  };

  const signIn = async () => {
    if (!walletCapabilities.signMessage) {
      // For wallets without signing capability, skip token revalidation
      return true;
    }

    const provider = getCurrentProvider();
    if (provider && accounts.length) {
      const nonce = await fetch('/api/auth/nonce').then((r) => r.text());
      const signature = await signMessage(
        'Sign message to revalidate login to multiwallet. By signing this message, you agree to the Terms of Service and Privacy Policy of multiwallet at https://multiwallet.trade/tos',
        nonce,
        accounts[0]
      );

      const response = await fetch('/api/auth/create-jwt', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: accounts[0],
          signature,
          nonce,
        }),
      });

      const { token: newToken } = await response.json();
      localStorage.setItem('authToken', newToken);
      document.cookie = `authToken=${newToken}; path=/; max-age=${
        60 * 60 * 24
      }; SameSite=Lax; ${
        window.location.protocol === 'https:' ? 'Secure;' : ''
      } HttpOnly`;

      window.dispatchEvent(
        new CustomEvent(WALLET_EVENTS.CONNECTED, {
          detail: {
            token: newToken,
            timestamp: Date.now(),
            account: accounts[0],
          },
        })
      );
    }
  };

  const checkAndRevalidateToken = async () => {
    if (!walletCapabilities.tokenRevalidation) {
      return true;
    }

    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const provider = getCurrentProvider();
        if (provider && accounts.length && !justRequestedRelative) {
          const nonce = await fetch('/api/auth/nonce').then((r) => r.text());
          setJustRequestedRelative(true);
          const signature = await signMessage(
            'Token Expiry: Sign message to revalidate login to multiwallet. By signing this message, you agree to the Terms of Service and Privacy Policy of multiwallet at https://multiwallet.trade/tos',
            nonce,
            accounts[0]
          );

          const authResponse = await fetch('/api/auth/create-jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: accounts[0],
              signature,
              nonce,
            }),
          });
          setJustRequestedRelative(false);

          const { token } = await authResponse.json();

          await fetch('/api/auth/wallet-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          window.dispatchEvent(
            new CustomEvent(WALLET_EVENTS.CONNECTED, {
              detail: {
                timestamp: Date.now(),
                account: accounts[0],
              },
            })
          );

          return true;
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Event handling for Starkey wallet only
  useEffect(() => {
    if (selectedWallet === 'starkey' && walletCapabilities.eventListeners) {
      const handleExtensionEvents = (event: any) => {
        if (event?.data?.name?.startsWith('starkey-')) {
          switch (event?.data?.name) {
            case 'starkey-extension-installed': {
              checkIsExtensionInstalled();
              break;
            }
            case 'starkey-wallet-updated': {
              (async () => {
                const authCheckResponse = await fetch('/api/auth/check', {
                  credentials: 'include',
                });
                if (authCheckResponse.ok) {
                  await fetch('/api/auth/wallet-logout', { method: 'POST' });
                }

                const responseAcc = await supraProvider.account();
                if (responseAcc.length) {
                  setAccounts(responseAcc);
                  try {
                    const nonce = await fetch('/api/auth/nonce').then((r) =>
                      r.text()
                    );
                    const signResult = await signMessage(
                      'Sign this message to login to multiwallet. By signing this message, you agree to the Terms of Service and Privacy Policy of multiwallet at https://multiwallet.trade/tos',
                      nonce,
                      responseAcc[0]
                    );

                    if (!signResult) return;

                    const { signature } = signResult;

                    const authResponse = await fetch('/api/auth/create-jwt', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        address: responseAcc[0],
                        signature,
                        nonce,
                      }),
                    });

                    const { token } = await authResponse.json();

                    await fetch('/api/auth/wallet-login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token }),
                    });

                    window.dispatchEvent(
                      new CustomEvent(WALLET_EVENTS.CONNECTED, {
                        detail: {
                          timestamp: Date.now(),
                          account: responseAcc[0],
                        },
                      })
                    );

                    await updateAccounts();
                  } catch (error) {
                    console.error('Account switch auth error:', error);
                    toast('Authentication Failed', {
                      description: 'Failed to authenticate new account',
                    });
                  }
                } else {
                  resetWalletData();
                  router.push('/');
                }
                setLoading(false);
              })();
              break;
            }
            case 'starkey-wallet-disconnected': {
              resetWalletData();
              router.push('/');
              setLoading(false);
              break;
            }
            case 'starkey-window-removed': {
              setLoading(false);
              break;
            }
          }
        }
      };

      checkIsExtensionInstalled();
      window.addEventListener('message', handleExtensionEvents);
      return () => window.removeEventListener('message', handleExtensionEvents);
    }
  }, [selectedWallet, walletCapabilities, supraProvider]);

  // Token revalidation effect
  useEffect(() => {
    if (accounts.length > 0 && walletCapabilities.tokenRevalidation) {
      const checkInterval = setInterval(checkAndRevalidateToken, 86400000); // Check every day
      return () => clearInterval(checkInterval);
    }
  }, [accounts, walletCapabilities]);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (walletCapabilities.tokenRevalidation) {
      const isValid = await checkAndRevalidateToken();
      if (!isValid) {
        throw new Error('Authentication failed');
      }
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
      },
    });
  };

  const switchToChain = async (chainId?: string) => {
    if (!walletCapabilities.networkSwitching) {
      throw new Error('Network switching not supported by current wallet');
    }

    switch (selectedWallet) {
      case 'starkey': {
        if (selectedChainId && supraProvider) {
          await supraProvider.changeNetwork({
            chainId: chainId || selectedChainId,
          });
          await getNetworkData();
        }
        break;
      }
      case 'ribbit': {
        // Ribbit doesn't support network switching
        // call provider.onChangeNetwork when its handler is added on the app side.
        throw new Error('Network switching not available for Ribbit wallet');
      }
    }
  };

  const getAvailableWallets = () => {
    const availableWallets: Array<{
      type: WalletType;
      name: string;
      isInstalled: boolean;
      capabilities: WalletCapabilities;
    }> = [];

    // Check each wallet type
    Object.entries(WALLET_CONFIGS).forEach(([walletType, config]) => {
      const provider = config.provider();
      const isInstalled = !!provider;

      switch (walletType as WalletType) {
        case 'starkey': {
          availableWallets.push({
            type: 'starkey',
            name: 'Starkey Wallet',
            isInstalled,
            capabilities: config.capabilities,
          });
          break;
        }
        case 'ribbit': {
          availableWallets.push({
            type: 'ribbit',
            name: 'Ribbit Wallet',
            isInstalled,
            capabilities: config.capabilities,
          });
          break;
        }
      }
    });

    return availableWallets;
  };

  const updateSelectedWallet = (walletType: WalletType) => {
    setSelectedWallet(walletType);
    setWalletCapabilities(WALLET_CONFIGS[walletType].capabilities);
    setStoredWalletType(walletType);
  };

  return {
    // New wallet selection functionality
    selectedWallet,
    walletCapabilities,
    getAvailableWallets, // Add this new function

    // Existing interface (unchanged)
    getCurrentProvider,
    isExtensionInstalled,
    accounts,
    networkData,
    balance,
    transactions,
    selectedChainId,
    connectWallet, // Now accepts optional walletType parameter
    disconnectWallet,
    sendRawTransaction,
    signMessage,
    setSelectedChainId,
    switchToChain,
    loading,
    authFetch,
    checkAndRevalidateToken,
    signIn,
  };
};

export default useSupraMultiWallet;
