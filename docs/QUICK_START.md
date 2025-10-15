# Quick Start Guide

Get your Supra multiwallet authentication up and running in **5 minutes**!

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/supra-multiwallet.git
cd supra-multiwallet

# Install dependencies
npm install
```

## 🔐 Environment Setup

Create a `.env.local` file:

```bash
# Generate a secure JWT secret (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env.local`:

```env
JWT_SECRET=your-generated-secret-from-above
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPRA_CHAIN_ID=6
```

## 🚀 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Verify It Works

1. Click "Connect Wallet"
2. Select either Starkey or Ribbit wallet
3. Approve the connection in your wallet
4. Sign the authentication message
5. You should be logged in!

## 🔍 What Just Happened?

```
1. Frontend requested a nonce from /api/auth/nonce
2. You signed "message + nonce" in your wallet
3. Backend verified your signature (/api/auth/create-jwt)
4. JWT token was created and stored in httpOnly cookie
5. You're now authenticated!
```

## 📁 Project Structure

```
supra-multiwallet/
├── app/
│   ├── api/auth/          # Authentication endpoints
│   │   ├── nonce/         # Generate time-based nonces
│   │   ├── create-jwt/    # Verify signature & create token
│   │   ├── wallet-login/  # Set httpOnly cookie
│   │   ├── wallet-logout/ # Clear cookie
│   │   └── check/         # Verify authentication
│   ├── components/        # UI components
│   └── page.tsx          # Landing page
├── hooks/
│   └── useSupraMultiWallet.ts  # Main wallet hook
├── lib/
│   └── auth.ts           # Auth utilities (nonce, JWT, signature)
└── docs/                 # Documentation
```

## 🎯 Next Steps

### For Learning

1. Read `docs/SECURITY_IMPLEMENTATION.md` - Understand the security model
2. Explore `hooks/useSupraMultiWallet.ts` - See how wallets are integrated
3. Check `lib/auth.ts` - Learn about signature verification

### For Integration

1. **Copy the auth system** to your project:
   ```
   lib/auth.ts
   app/api/auth/*
   hooks/useSupraMultiWallet.ts
   ```

2. **Use the wallet hook** in your components:
   ```tsx
   import useSupraMultiWallet from '@/hooks/useSupraMultiWallet';
   
   function YourComponent() {
     const { accounts, connectWallet, disconnectWallet } = useSupraMultiWallet();
     
     return (
       <div>
         {accounts.length > 0 ? (
           <div>
             <p>Connected: {accounts[0]}</p>
             <button onClick={disconnectWallet}>Disconnect</button>
           </div>
         ) : (
           <button onClick={() => connectWallet('starkey')}>
             Connect Starkey
           </button>
         )}
       </div>
     );
   }
   ```

3. **Protect routes** using the auth check:
   ```tsx
   // In your protected page
   import { cookies } from 'next/headers';
   import { verifyToken } from '@/lib/auth';
   import { redirect } from 'next/navigation';
   
   export default async function ProtectedPage() {
     const cookieStore = cookies();
     const token = cookieStore.get('authToken')?.value;
     const verified = await verifyToken(token);
     
     if (!verified) {
       redirect('/');
     }
     
     return <div>Protected content for {verified.address}</div>;
   }
   ```

4. **Make authenticated requests**:
   ```tsx
   const { authFetch } = useSupraMultiWallet();
   
   // This automatically includes the auth cookie
   const response = await authFetch('/api/your-endpoint');
   ```

## 🛠️ Customization

### Change Auth Message

Edit in `lib/auth.ts`:
```typescript
const AUTH_MESSAGE = 'Your custom message here';
```

And in `hooks/useSupraMultiWallet.ts` (lines ~498, ~578, etc.):
```typescript
const signature = await signMessage('Your custom message here', nonce);
```

### Adjust Nonce Expiration

Edit in `lib/auth.ts`:
```typescript
// Default: 5 minutes
const NONCE_EXPIRY_MS = 5 * 60 * 1000;

// Tighter security: 2 minutes
const NONCE_EXPIRY_MS = 2 * 60 * 1000;

// More user-friendly: 10 minutes
const NONCE_EXPIRY_MS = 10 * 60 * 1000;
```

### Change Token Expiration

Edit in `lib/auth.ts`:
```typescript
// Default: 24 hours
.setExpirationTime('24h')

// Shorter: 1 hour
.setExpirationTime('1h')

// Longer: 7 days
.setExpirationTime('7d')
```

## 🔒 Security Checklist

Before deploying:

- [ ] ✅ JWT_SECRET is 64+ characters and cryptographically random
- [ ] ✅ Different JWT_SECRET for dev/staging/production
- [ ] ✅ HTTPS enabled in production
- [ ] ✅ Review error messages (don't leak sensitive info)
- [ ] ⚠️ Consider adding rate limiting
- [ ] ⚠️ Consider upgrading to KV storage for zero replay window
- [ ] ⚠️ Run `npm audit` and fix vulnerabilities

## 🆘 Troubleshooting

### "JWT_SECRET is not defined"
- Make sure `.env.local` exists in the root directory
- Make sure you have `JWT_SECRET=...` in the file
- Restart the dev server after creating/editing `.env.local`

### "Wallet extension not installed"
- Install Starkey or Ribbit wallet extension
- Refresh the page after installation
- Check browser console for errors

### "Invalid signature"
- Make sure the AUTH_MESSAGE matches exactly between frontend and backend
- Check that the nonce hasn't expired (5-minute window)
- Verify you're signing with the correct wallet

### "Authentication failed" on protected routes
- Check that the httpOnly cookie is being set (use browser DevTools)
- Verify the JWT_SECRET is the same across all API routes
- Check cookie domain/path settings

## 💬 Get Help

- Open an issue on GitHub
- Check existing issues for solutions
- Read the security implementation guide
- Review the code - it's well-commented!

---

**Ready to build?** Start by exploring the demo app and reading through the code. Everything is documented and designed to be copy-paste friendly!
