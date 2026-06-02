/**
 * WhatsApp Share Button Component
 * 
 * A reusable button component for sharing content via WhatsApp.
 * Features mobile-optimized touch target and proper loading states.
 * 
 * @component
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppShareButtonProps {
  /** The message to share on WhatsApp */
  message: string;
  /** Optional className for styling */
  className?: string;
  /** Optional variant for the button */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Optional size for the button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Optional callback after share attempt */
  onShareComplete?: (success: boolean) => void;
  /** Button text (defaults to "Share on WhatsApp") */
  buttonText?: string;
  /** Mobile short text (defaults to "Share") */
  mobileShortText?: string;
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  message,
  className,
  variant = 'default',
  size = 'default',
  onShareComplete,
  buttonText = "Share Hisaab on WhatsApp",
  mobileShortText = "Share"
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleShare = async () => {
    setIsSharing(true);
    setShareStatus('idle');
    
    try {
      // Encode the message for WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
      
      // Track share attempt (for analytics)
      console.log('📱 WhatsApp Share Initiated:', { 
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');
      
      setShareStatus('success');
      toast({
        title: "✅ WhatsApp opened!",
        description: "Apna hisaab share karo jaldi! 📱",
        duration: 3000,
      });
      
      onShareComplete?.(true);
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      setShareStatus('error');
      
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(message);
        toast({
          title: "📋 Link copy ho gaya!",
          description: "WhatsApp nahi khula, lekin message copy ho gaya. WhatsApp mein paste karo!",
          variant: "destructive",
          duration: 5000,
        });
      } catch (clipError) {
        toast({
          title: "❌ Kuch gadbad ho gayi",
          description: "Please manually share karo",
          variant: "destructive",
        });
      }
      
      onShareComplete?.(false);
    } finally {
      setIsSharing(false);
      // Reset status after 3 seconds
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  // Determine button style based on status
  const getButtonVariant = () => {
    if (shareStatus === 'success') return 'secondary';
    if (shareStatus === 'error') return 'destructive';
    return variant;
  };

  return (
    <Button
      onClick={handleShare}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        // Mobile-first touch target (minimum 44px)
        'min-h-[44px] min-w-[44px]',
        // Responsive text sizing
        'text-sm sm:text-base',
        // Hover effects for desktop
        'hover:scale-105 transition-transform duration-200',
        // Active state for mobile
        'active:scale-95',
        // Monochrome color scheme for default variant
        variant === 'default' && !shareStatus && 'bg-foreground hover:bg-foreground/90 text-surface',
        className
      )}
      disabled={isSharing}
      aria-label="Share on WhatsApp"
    >
      {isSharing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span className="hidden sm:inline">Opening WhatsApp...</span>
        </>
      ) : shareStatus === 'success' ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Shared!</span>
        </>
      ) : shareStatus === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Try again</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{buttonText}</span>
          <span className="sm:hidden">{mobileShortText}</span>
        </>
      )}
    </Button>
  );
};
