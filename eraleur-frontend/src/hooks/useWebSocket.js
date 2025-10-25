import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing WebSocket connection to Eraleur backend
 *
 * @param {string} url - WebSocket server URL (e.g., 'ws://localhost:8080')
 * @returns {Object} WebSocket state and methods
 */
const useWebSocket = (url) => {
  // Connection states: 'connecting' | 'connected' | 'disconnected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Project data received from server
  const [projectData, setProjectData] = useState({
    project_name: '',
    requirements: {},
    ddd: {},
    frontend_data: {},
    technical_architecture: {}
  });

  // Last received message
  const [lastMessage, setLastMessage] = useState(null);

  // WebSocket instance reference
  const wsRef = useRef(null);

  // Reconnection attempt counter
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  // Reconnection timer reference
  const reconnectTimerRef = useRef(null);

  // Message queue for offline messages
  const messageQueueRef = useRef([]);

  /**
   * Send message to WebSocket server
   * If disconnected, queues the message for later
   */
  const sendMessage = useCallback((type, data = {}) => {
    const message = {
      type,
      data,
      timestamp: Date.now()
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 Sent message:', type);
    } else {
      // Queue message if connection is not open
      messageQueueRef.current.push(message);
      console.log('📋 Queued message:', type);
    }
  }, []);

  /**
   * Process queued messages when connection is established
   */
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`📤 Processing ${messageQueueRef.current.length} queued messages`);

      messageQueueRef.current.forEach((message) => {
        wsRef.current.send(JSON.stringify(message));
      });

      messageQueueRef.current = [];
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    try {
      console.log('🔌 Connecting to WebSocket server:', url);
      setConnectionStatus('connecting');

      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Send client ready message
        sendMessage('client_ready', { timestamp: Date.now() });

        // Process any queued messages
        processMessageQueue();
      };

      // Message received from server
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 Received message:', message.type);

          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'project_initialized':
              console.log('🎯 Project initialized:', message.data.project_name);
              setProjectData(message.data);
              break;

            case 'project_switched':
              console.log('🔄 Project switched:', message.data.project_name);
              setProjectData(message.data);
              break;

            case 'files_updated':
              console.log('📝 Files updated');
              setProjectData((prevData) => ({
                ...prevData,
                ...message.data
              }));
              break;

            case 'project_deleted':
              console.log('🗑️ Project deleted:', message.data.project_name);
              // Clear project data when project is deleted
              setProjectData({
                project_name: '',
                requirements: {},
                ddd: {},
                frontend_data: {},
                technical_architecture: {}
              });
              break;

            case 'switch_to_figma_mode':
              console.log('🎨 Switching to Figma mode');
              // This will be handled in Phase 2
              break;

            case 'canvas_edit_confirmed':
              console.log('✅ Canvas edit confirmed');
              // This will be handled in Phase 2
              break;

            default:
              console.log('⚠️  Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      // Connection closed
      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setConnectionStatus('disconnected');

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = 3000; // 3 seconds

          console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };

      // Connection error
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [url, sendMessage, processMessageQueue]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    reconnectAttempts.current = 0;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any pending reconnection timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    // Connect
    connect();
  }, [connect]);

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');

      // Clear reconnection timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connectionStatus,
    projectData,
    sendMessage,
    lastMessage,
    reconnect
  };
};

export default useWebSocket;
