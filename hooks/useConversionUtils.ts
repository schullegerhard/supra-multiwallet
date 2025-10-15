import { useCallback } from 'react';
import { BCS, HexString, TxnBuilderTypes } from 'supra-l1-sdk-core';

const useConversionUtils = () => {
    // Convert a human-readable string to Uint8Array
    const stringToUint8Array = useCallback((humanReadableStr: string) => {
        return BCS.bcsToBytes(new TxnBuilderTypes.Identifier(humanReadableStr));
    }, []);

    const serializeString = useCallback((humanReadableStr: string) => {
        return BCS.bcsSerializeStr(humanReadableStr);
    }, []);

    // Convert a crypto address to Uint8Array
    const addressToUint8Array = useCallback((cryptoAddress: string) => {
        //return new HexString(cryptoAddress).toUint8Array();
        return BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(cryptoAddress));
    }, []);

    const deserializeString = (uint8Array: string) => {
        return BCS.bcsSerializeStr(uint8Array);
      };
    const deserializeVector = (uint8Array: Uint8Array) => {
        const deserializer = new BCS.Deserializer(uint8Array);
        return BCS.deserializeVector(deserializer, BCS.bcsSerializeU8);
    };

    // Serialize a uint64 value
    const serializeUint64 = useCallback((value: bigint) => {
        return BCS.bcsSerializeUint64(value);
    }, []);

    const serializeU256 = useCallback((value: bigint) => {
        return BCS.bcsSerializeU256(value);
    }, []);

    const serializeBool = useCallback((value: boolean) => {
        return BCS.bcsSerializeBool(value);
    }, []);

    const serializeVector = useCallback((values: any[], type: 'u8' | 'u64' | 'bool' | 'string' | 'address') => {
        const serializer = new BCS.Serializer();
        serializer.serializeU32AsUleb128(values.length);
        
        values.forEach(value => {
            if (type === 'u64') {
                serializer.serializeU64(value as bigint);
            } else if (type === 'bool') {
                serializer.serializeBool(value as boolean);
            } else if (type === 'string') {
                serializer.serializeStr(value as string);
            } else if (type === 'address') {
                const accountAddress = TxnBuilderTypes.AccountAddress.fromHex(value as string);
                serializer.serializeFixedBytes(accountAddress.address);
            } else {
                serializer.serializeStr(value as string);
            }
        });
        return serializer.getBytes();
    }, []);

    const hexToString = (hex: string, type: string) => {
        if (!hex) {
            return '';
        }
        
        if (type !== "String") {
            // For numeric types, convert hex to decimal string

            try {
                return BigInt(hex).toString();
            } catch (error) {
                console.error('Error converting hex to string:', error);
                return hex;
            }
        }
        
        try {
            // Remove the '0x' prefix
            const cleanHex = hex.slice(2);
            // Convert hex to string and remove the first character (length prefix)
            return Buffer.from(cleanHex, 'hex').toString().slice(1);
        } catch (error) {
            console.error('Error converting hex to string:', error);
            return hex;
        }
    };

    const stringToHex = (str: string) => {
        // Convert string to UTF-8 encoded bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        
        // Convert bytes to hex string
        let hexString = '';
        for (let i = 0; i < bytes.length; i++) {
          const hex = bytes[i].toString(16).padStart(2, '0');
          hexString += hex;
        }
        
        return hexString;
      }

    return {
        stringToUint8Array,
        addressToUint8Array,
        serializeUint64,
        serializeU256,
        serializeBool,
        serializeVector,
        deserializeString,
        deserializeVector,
        hexToString,
        serializeString,
        stringToHex
    };
};

export default useConversionUtils;
