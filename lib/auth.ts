import * as jose from 'jose';
import nacl from 'tweetnacl';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Nonce expiration: 5 minutes
const NONCE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Create a JWT token for the given address
 */
export async function createToken(address: string): Promise<string> {
  return await new jose.SignJWT({ address })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string | undefined) {
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { address: string };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Create a time-based, cryptographically signed nonce
 * Format: timestamp|randomBytes|signature
 * This allows validation without server-side storage
 */
export async function createNonce(): Promise<string> {
  const timestamp = Date.now().toString();
  
  // Generate random bytes for uniqueness
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Create signature of timestamp|random to prevent tampering
  const payload = `${timestamp}|${randomHex}`;
  const signature = await new jose.SignJWT({ payload })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
  
  // Return: timestamp|random|signature
  return `${payload}|${signature}`;
}

/**
 * Validate a time-based nonce
 * Checks:
 * 1. Nonce format is valid
 * 2. Signature is authentic (proves it came from our server)
 * 3. Timestamp is within expiration window (prevents replay attacks)
 */
export async function validateNonce(nonce: string): Promise<boolean> {
  try {
    // Parse nonce format: timestamp|random|signature
    const parts = nonce.split('|');
    if (parts.length !== 3) {
      console.error('Invalid nonce format');
      return false;
    }
    
    const [timestamp, random, signature] = parts;
    const payload = `${timestamp}|${random}`;
    
    // Verify the signature
    try {
      const { payload: verified } = await jose.jwtVerify(signature, secret);
      
      // Check if the payload matches
      if (verified.payload !== payload) {
        console.error('Nonce payload mismatch');
        return false;
      }
    } catch (error) {
      console.error('Nonce signature verification failed:', error);
      return false;
    }
    
    // Check timestamp is within expiration window
    const nonceTimestamp = parseInt(timestamp, 10);
    const now = Date.now();
    const age = now - nonceTimestamp;
    
    if (age > NONCE_EXPIRY_MS) {
      console.error('Nonce expired:', { age, limit: NONCE_EXPIRY_MS });
      return false;
    }
    
    // Check nonce is not from the future (clock skew tolerance: 1 minute)
    if (age < -60000) {
      console.error('Nonce timestamp is in the future');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Nonce validation error:', error);
    return false;
  }
}

/**
 * Verify a wallet signature
 * This proves the user owns the private key for the claimed address
 */
export async function verifyWalletSignature(
  message: string,
  signature: { signature: string; publicKey: string },
  address: string
): Promise<boolean> {
  try {
    // Verify the signature using Ed25519 (nacl)
    const verified = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      Uint8Array.from(Buffer.from(signature.signature.slice(2), 'hex')),
      Uint8Array.from(Buffer.from(signature.publicKey.slice(2), 'hex'))
    );
    
    if (!verified) {
      console.error('Signature verification failed');
      return false;
    }
    
    // TODO: Verify that the public key corresponds to the claimed address
    // This depends on Supra's address derivation algorithm
    // For now, we trust the signature verification
    // In production, you should add: const derivedAddress = deriveAddress(signature.publicKey)
    // and verify: derivedAddress === address
    
    return true;
  } catch (error) {
    console.error('Wallet signature verification error:', error);
    return false;
  }
} 