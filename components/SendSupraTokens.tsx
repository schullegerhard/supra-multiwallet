"use client";

import { Button } from '@/components/ui/button';
import useMoveLangConversionUtils from '@/hooks/useConversionUtils';
import useSupraMultiWallet from '@/hooks/useSupraMultiWallet';
import { useState } from 'react';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SendSupraTokens() {
    const supraMultiWallet = useSupraMultiWallet();
    const moveUtils = useMoveLangConversionUtils();
    const [formData, setFormData] = useState({
        receiverAddress: '',
        amount: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.receiverAddress || !formData.amount) {
            toast.error('Missing Fields', {
                description: 'Please fill in all fields'
            });
            return;
        }

        if (!supraMultiWallet.accounts.length) {
            toast.error('Wallet Not Connected', {
                description: 'Please connect your wallet first'
            });
            return;
        }

        const amountNumber = parseFloat(formData.amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            toast.error('Invalid Amount', {
                description: 'Please enter a valid amount greater than 0'
            });
            return;
        }

        setIsSubmitting(true);

    try {
            // Serialize transaction arguments using ABI-based serialization
            // const serializedArgs = await moveUtils.serializeTransactionArgs(
            //     [
            //     formData.receiverAddress, // Raw address string
            //     Number(formData.amount) * 100_000_000, // Raw number (will be converted to u64)
            //     ],
            //     "0x0000000000000000000000000000000000000000000000000000000000000001",
            //     "supra_account",
            //     "transfer_coins"
            // );

            // const txHash = await supraMultiWallet.sendRawTransaction(
            //     "0x0000000000000000000000000000000000000000000000000000000000000001",
            //     "supra_account",
            //     "transfer_coins",
            //     serializedArgs,
            //     ["0x1::supra_coin::SupraCoin"]
            // );
            
            // DO NOT MODIFY - User's exact transaction parameters
            const txHash = await supraMultiWallet.sendRawTransaction(
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "supra_account",
                "transfer_coins",
                [
                    moveUtils.addressToUint8Array(formData.receiverAddress),
                    moveUtils.serializeUint64(BigInt(Number(formData.amount) * 100_000_000))
                ],
                ["0x1::supra_coin::SupraCoin"]
            );

            toast.success('Transaction Sent!', {
                description: `Successfully sent ${formData.amount} SUPRA`,
                action: txHash ? {
                    label: 'View TX',
                    onClick: () => window.open(`https://testnet.suprascan.io/tx/${txHash}`, '_blank')
                } : undefined
            });

            // Reset form
            setFormData({
                receiverAddress: '',
                amount: ''
            });

        } catch (error: any) {
            console.error('Transfer error:', error);
            toast.error('Transaction Failed', {
                description: error?.message || 'Failed to send transaction. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="receiverAddress" className="text-sm font-medium text-gray-200 block">
                    Recipient Address
                </label>
                <input
                    type="text"
                    id="receiverAddress"
                    value={formData.receiverAddress}
                    onChange={(e) => setFormData({...formData, receiverAddress: e.target.value})}
                    placeholder="0x..."
                    suppressHydrationWarning={true}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
                <p className="text-xs text-gray-400">
                    The Supra address to receive the tokens
                </p>
            </div>

            <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium text-gray-200 block">
                    Amount (SUPRA)
                </label>
                <input
                    type="number"
                    id="amount"
                    step="0.00000001"
                    min="0"
                    value={formData.amount}
                    suppressHydrationWarning={true}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
                <p className="text-xs text-gray-400">
                    Enter the amount of SUPRA to send
                </p>
            </div>

            {supraMultiWallet.accounts.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-300">
                            <p className="font-medium mb-1">Sending from:</p>
                            <p className="font-mono text-blue-200/80 break-all">
                                {supraMultiWallet.accounts[0]}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                disabled={isSubmitting || !supraMultiWallet.accounts.length}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Send SUPRA
                    </>
                )}
            </Button>

            {!supraMultiWallet.accounts.length && (
                <p className="text-center text-sm text-gray-400">
                    Please connect your wallet to send tokens
                </p>
            )}
        </form>
    );
} 