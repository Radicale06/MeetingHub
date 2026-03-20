import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { notification } from "antd";
import { RootState } from "../store/store";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL as string;

export function useAppWebSocket() {
  const auth = useSelector((state: RootState) => state.authState.auth);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) {
      // No token — make sure we're disconnected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${BACKEND_URL}/ws`, {
      auth: { token: auth.accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] connected", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] disconnected", reason);
    });

    socket.on("meeting:invited", (data: { title?: string; hostName?: string }) => {
      notification.info({
        message: "Meeting Invitation",
        description: `You've been invited to "${data.title || "a meeting"}" by ${data.hostName || "someone"}.`,
      });
    });

    socket.on("meeting:started", (data: { title?: string }) => {
      notification.success({
        message: "Meeting Started",
        description: `"${data.title || "A meeting"}" has started. Join now!`,
      });
    });

    socket.on("meeting:ended", (data: { title?: string }) => {
      notification.info({
        message: "Meeting Ended",
        description: `"${data.title || "A meeting"}" has ended.`,
      });
    });

    socket.on("recording:ready", (data: { title?: string; recordingId?: string }) => {
      notification.success({
        message: "Recording Ready",
        description: `The recording for "${data.title || "a meeting"}" is now available.`,
      });
    });

    socket.on("report:ready", (data: { title?: string; reportId?: string }) => {
      notification.success({
        message: "AI Report Ready",
        description: `The AI report for "${data.title || "a meeting"}" is ready to view.`,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth?.accessToken]);

  return socketRef;
}
