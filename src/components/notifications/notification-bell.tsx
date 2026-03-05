"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Notification } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-[min(100vw-2rem,22rem)] sm:max-w-sm bg-background border-l border-border shadow-[var(--shadow-card)] rounded-l-2xl flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="shrink-0 px-4 pt-4 pb-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center justify-between gap-3 pr-8">
            <SheetTitle className="text-base font-semibold text-foreground">Bildirimler</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-primary font-medium cursor-pointer hover:underline whitespace-nowrap"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 py-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border shadow-sm min-w-0 break-words transition ${
                    !n.read
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border/60 hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground break-words leading-snug">
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-3">
                      {n.message}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
