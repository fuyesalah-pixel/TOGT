"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { io } from "socket.io-client";
import { useLocale } from "next-intl";
import { API_URL } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useMarkNotificationRead } from "@/hooks/useNotifications";

interface ToastNotification { id?: string; title: string; message: string; type?: string }
interface ToastContextValue { showToast: (notification: ToastNotification) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside Providers");
  return value;
}

function NotificationToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { user } = useAuth();
  const locale = useLocale();
  const markRead = useMarkNotificationRead();
  const showToast = (notification: ToastNotification) => setToasts((current) => [...current, notification]);

  useEffect(() => {
    if (!user) return;
    const socket = io(API_URL, { withCredentials: true });
    const onNotification = (notification: ToastNotification) => {
      showToast(notification);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item !== notification)), 8000);
    };
    socket.on("newNotification", onNotification);
    return () => { socket.off("newNotification", onNotification); socket.disconnect(); };
  }, [user]);

  const dismiss = (toast: ToastNotification) => {
    setToasts((current) => current.filter((item) => item !== toast));
    if (toast.id) markRead.mutate(toast.id);
  };

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast, index) => <motion.div key={`${toast.id ?? toast.title}-${index}`} initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="pointer-events-auto rounded-xl border-l-4 border-togt-orange bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-togt-orange" /><div className="min-w-0 flex-1"><p className="font-bold text-togt-navy">{toast.title}</p><p className="mt-1 text-sm text-gray-600">{toast.message}</p></div><button onClick={() => dismiss(toast)} aria-label="Dismiss"><X className="h-4 w-4 text-gray-400" /></button></div>
          <div className="mt-3 flex gap-2"><button onClick={() => { dismiss(toast); window.location.href = `/${locale}/dashboard?tab=notifications`; }} className="flex-1 rounded-lg bg-togt-orange py-1.5 text-sm font-semibold text-white">View</button><button onClick={() => dismiss(toast)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-sm text-gray-600">Dismiss</button></div>
        </motion.div>)}
      </AnimatePresence>
    </div>
  </ToastContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}><NotificationToasts>{children}</NotificationToasts></QueryClientProvider>;
}
