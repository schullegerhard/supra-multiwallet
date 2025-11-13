import { supraAccountABI } from "./abis/supra_account";
import { standardizeAddress } from "./utils";

export interface ModuleABI {
  address: string;
  name: string;
  friends?: string[];
  exposed_functions: Array<{
    name: string;
    visibility?: string;
    is_entry?: boolean;
    is_view?: boolean;
    generic_type_params?: Array<{ constraints?: any[] }>;
    params: string[];
    return?: string[];
  }>;
  structs?: Array<{
    name: string;
    is_native?: boolean;
    abilities?: string[];
    generic_type_params?: any[];
    fields?: Array<{ name: string; type: string }>;
  }>;
}

export interface ABIStorage {
  [moduleAddress: string]: {
    [moduleName: string]: ModuleABI;
  };
}

// Abi storage
// always standardize address for consistency
export const abiStorage: ABIStorage = {
  [standardizeAddress("0x1")]: {
    supra_account: supraAccountABI,
  },
};

export function getStoredABI(
  moduleAddress: string,
  moduleName: string
): ModuleABI | null {
  // Standardize address to match storage keys (always 64 chars + 0x)
  const standardizedAddress = standardizeAddress(moduleAddress);
  const normalizedName = moduleName;

  if (abiStorage[standardizedAddress]?.[normalizedName]) {
    return abiStorage[standardizedAddress][normalizedName];
  }

  return null;
}
