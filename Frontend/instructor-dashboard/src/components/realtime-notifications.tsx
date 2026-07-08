import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { useStoredAuth } from "@/lib/auth";

const socketOrigin = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:4000";
  }
})();

type IncomingNotification = { title?: string; body?: string; link?: string | null };

/**
 * Opens an authenticated Socket.io connection and live-updates the notification
 * badge + list when the server pushes `notification:new`. Mounted once in the
 * authed shell; no-ops until the instructor is signed in.
 */
export function RealtimeNotifications() {
  const queryClient = useQueryClient();
  const auth = useStoredAuth();
  const token = auth?.accessToken;

  useEffect(() => {
    if (typeof window === "undefined" || !token) {
      return;
    }

    const socket = io(socketOrigin, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("notification:new", (n: IncomingNotification) => {
      queryClient.invalidateQueries({ queryKey: ["instructor-notifications-badge"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-notifications"] });
      toast(n?.title ?? "New notification", { description: n?.body });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);

  return null;
}
