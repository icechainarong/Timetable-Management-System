import { useRef, useEffect, useCallback, useState } from 'react';
import type { FullTimetableState, UpdateAction } from '../types';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

/**
 * A custom hook to manage the WebSocket connection to the timetable server.
 * @param onStateReceived - A callback function that is invoked with the new state when a message is received from the server.
 * @returns An object containing a `sendAction` function to send updates to the server, the current `connectionStatus`, and a `retryConnection` function.
 */
export const useTimetableSocket = (onStateReceived: (state: FullTimetableState) => void) => {
    const ws = useRef<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

    const onStateReceivedRef = useRef(onStateReceived);
    useEffect(() => {
        onStateReceivedRef.current = onStateReceived;
    }, [onStateReceived]);

    const connect = useCallback(() => {
        // If there's an existing socket, ensure it's closed before creating a new one.
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            ws.current.close();
        }

        setConnectionStatus('connecting');
        
        // Use environment variable for production, fallback to localhost for development
        // This is the standard way to configure different environments.
        const productionWsUrl = (process.env as any).VITE_WEBSOCKET_URL;
        const localWsUrl = `ws://${window.location.hostname || 'localhost'}:8080`;
        const wsUrl = productionWsUrl || localWsUrl;

        console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            setConnectionStatus('open');
        };

        socket.onmessage = (event) => {
            try {
                const serverState: FullTimetableState = JSON.parse(event.data);
                if (serverState && serverState.settings) {
                    onStateReceivedRef.current(serverState);
                }
            } catch (e) {
                console.error('Error parsing state from server:', e);
            }
        };
        
        socket.onclose = () => {
            console.log('WebSocket disconnected.');
            setConnectionStatus('closed');
        };
        
        socket.onerror = (event) => {
            console.warn('WebSocket connection failed. This is expected if the server is not running. App will work in offline mode.');
            // The 'onclose' event will fire immediately after this, which handles the UI state change.
        };
    }, []); // Empty dependency array as connect should be stable

    useEffect(() => {
        connect(); // Initial connection attempt

        // Cleanup on component unmount.
        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent onclose logic from running on unmount
                ws.current.close();
            }
        };
    }, [connect]); // This effect runs only once to establish the initial connection.

    const sendAction = useCallback((action: UpdateAction) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(action));
        } else {
            console.warn('WebSocket not connected. Action not sent:', action);
        }
    }, []);

    return { sendAction, connectionStatus, retryConnection: connect };
};