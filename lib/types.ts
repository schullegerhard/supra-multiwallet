export interface IWalletAccount {
    id?: string;
    username: string;
    avatar?: string;
    isAccountImported?: string;
    address: string;
    networkEnvironment?: string;
    currentNetwork?: {
      walletAddress: string;
      networkName: string;
      rpcNetworkName: string;
      chainId: string;
    };
  }
  export interface IWalletBalance {
    formattedBalance: string;
    displayUnit: string;
  }