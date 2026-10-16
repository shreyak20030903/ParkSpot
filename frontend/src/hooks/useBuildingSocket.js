import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_URL } from '../api';

// Listens on /topic/building/{id}. The backend publishes a short "changed"
// message whenever a slot in that building is booked, freed or expires,
// and we simply refetch the slots. Returns whether the socket is connected.
export default function useBuildingSocket(buildingId, onChange) {
  const [connected, setConnected] = useState(false);
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/building/${buildingId}`, () => callback.current());
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    client.activate();
    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [buildingId]);

  return connected;
}
