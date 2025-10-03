"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || isConnected) {
      console.log("Already connecting or connected, skipping...");
      return;
    }

    // Don't reconnect if we've exceeded attempts
    if (reconnectCount >= reconnectAttempts) {
      console.log("Max reconnection attempts reached");
      setError(`Failed to reconnect after ${reconnectAttempts} attempts`);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      console.log("WebSocket URL input:", url);

      let wsUrl: string;
      if (url.startsWith("ws://") || url.startsWith("wss://")) {
        wsUrl = url;
      } else {
        // Use backend host and port for WebSocket connection
        const backendHost =
          process.env.NEXT_PUBLIC_WS_URL ||
          (process.env.NODE_ENV === "production"
            ? `${protocol}//${window.location.host}`
            : `${protocol}//localhost:8000`);

        // FIX: Append /ws to the URL
        wsUrl = `${backendHost}`;
      }

      console.log("WebSocket connecting to:", wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;

        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(0);
        setError(null);
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      wsRef.current.onclose = (event) => {
        if (!mountedRef.current) return;

        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Clean up the WebSocket reference
        wsRef.current = null;

        onDisconnect?.();

        // Only reconnect if:
        // 1. We should reconnect (not manually closed)
        // 2. Haven't exceeded attempts
        // 3. Wasn't a clean close (code 1000)
        // 4. Component is still mounted
        if (
          shouldReconnectRef.current &&
          reconnectCount < reconnectAttempts &&
          event.code !== 1000 &&
          mountedRef.current
        ) {
          console.log(
            `Scheduling reconnection attempt ${
              reconnectCount + 1
            }/${reconnectAttempts}...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setReconnectCount((count) => count + 1);
            }
          }, reconnectInterval);
        } else if (reconnectCount >= reconnectAttempts) {
          setError(`Failed to reconnect after ${reconnectAttempts} attempts`);
        }
      };

      wsRef.current.onerror = (error) => {
        if (!mountedRef.current) return;

        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
        setIsConnecting(false);
        onError?.(error);
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError("Failed to create WebSocket connection");
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    isConnected,
    reconnectCount,
    reconnectAttempts,
    url,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval,
  ]);

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebSocket...");
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (wsRef.current) {
      // Remove event listeners to prevent callbacks
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;

      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setReconnectCount(0);
  }, []);

  const sendMessage = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || "message",
        data: message.data || {},
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(fullMessage));
      return true;
    }
    console.warn("WebSocket is not connected");
    return false;
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "ping",
          data: {},
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, []);

  // Keep-alive ping mechanism
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  // Reconnect effect - triggers when reconnectCount changes
  useEffect(() => {
    if (reconnectCount > 0 && reconnectCount <= reconnectAttempts) {
      console.log(`Reconnecting... (${reconnectCount}/${reconnectAttempts})`);
      connect();
    }
  }, [reconnectCount, reconnectAttempts, connect]);

  // Initial connection effect
  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.onopen = null;
        wsRef.current.close(1000, "Component unmount");
        wsRef.current = null;
      }
    };
  }, []); // Only run once on mount

  return {
    isConnected,
    isConnecting,
    error,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    ping,
  };
}
