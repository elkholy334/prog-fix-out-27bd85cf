import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if dismissed recently (24 hours)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS guide after 3 seconds
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show reminder after 5 seconds even without the event
    const fallbackTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt available — show manual guide
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-card border-2 border-accent/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-4 max-w-md mx-auto">
        {showIOSGuide ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              <h3 className="font-bold text-foreground text-sm">📱 طريقة التثبيت</h3>
            </div>
            {isIOS ? (
              <div className="space-y-2 text-sm text-muted-foreground text-right">
                <p>1️⃣ اضغط على زر <strong>المشاركة</strong> ⬆️ في المتصفح</p>
                <p>2️⃣ اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></p>
                <p>3️⃣ اضغط <strong>"إضافة"</strong> ✅</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground text-right">
                <p>1️⃣ اضغط على <strong>⋮ القائمة</strong> في أعلى المتصفح</p>
                <p>2️⃣ اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong></p>
                <p>3️⃣ اضغط <strong>"تثبيت"</strong> ✅</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={handleDismiss}>
              فهمت، شكراً
            </Button>
          </div>
        ) : (
          // Install prompt
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-right">
              <h3 className="font-bold text-sm text-foreground">📲 ثبّت التطبيق على جهازك</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                للوصول السريع والعمل بدون إنترنت
              </p>
            </div>
            <Button
              onClick={handleInstall}
              className="gradient-hero text-primary-foreground font-bold px-4 shrink-0"
              size="sm"
            >
              {isIOS ? <Smartphone className="h-4 w-4 ml-1" /> : <Download className="h-4 w-4 ml-1" />}
              تثبيت
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
