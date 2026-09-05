"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
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
  const queryClient = useQueryClient();
  const showToast = useCallback((notification: ToastNotification) => {
    setToasts((current) => [...current, notification]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item !== notification));
      if (notification.id) markRead.mutate(notification.id);
    }, 3000);
  }, [markRead]);

  useEffect(() => {
    if (!user) return;
    const socket = io(API_URL, { path: '/api/socket.io', withCredentials: true });
    const onNotification = (notification: ToastNotification) => {
      showToast(notification);
    };
    socket.on("newNotification", onNotification);
    const onRoleChanged = (change: { newRole: string }) => {
      showToast({ title: "Role Updated", message: `Your role has been updated to ${change.newRole}. Redirecting...` });
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      window.setTimeout(() => { window.location.href = `/${locale}/dashboard/${change.newRole.toLowerCase()}`; }, 2000);
    };
    socket.on("roleChanged", onRoleChanged);
    return () => { socket.off("newNotification", onNotification); socket.off("roleChanged", onRoleChanged); socket.disconnect(); };
  }, [user, locale, queryClient, showToast]);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast, index) => <motion.div key={`${toast.id ?? toast.title}-${index}`} initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="pointer-events-auto rounded-xl border-l-4 border-togt-orange bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-togt-orange" /><div className="min-w-0 flex-1"><p className="font-bold text-togt-navy">{toast.title}</p><p className="mt-1 text-sm text-gray-600">{toast.message}</p></div></div>
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
