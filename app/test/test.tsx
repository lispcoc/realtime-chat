"use client";

import { useEffect, useState } from "react";
import { Database } from '@/types/supabasetype';

type Message = Omit<Database["public"]["Tables"]["Messages"]["Row"], "created_at" | "id">

type Packet = {
  type: string,
  data: Message
}

export default function WebSocketClient() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<WebSocket>(null!);

  const url = 'ws://localhost:8001'

  useEffect(() => {
    const _socket = new WebSocket(url + "?roomId=1");
    setSocket(_socket)
    _socket.onopen = () => {
      console.log("Connected to WebSocket server");
    }

    _socket.onmessage = (event) => {
      console.log("Message received:", event.data);
      setMessages((prev) => [...prev, event.data]);
    }

    _socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    }

    _socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    }

    return () => {
      socket.close();
    }
  }, []);

  const sendMessage = () => {
    if (socket) {
      const packet: Packet = {
        type: "message",
        data: {
          room_id: 1,
          color: 0,
          name: "anon",
          text: input,
          system: false
        },
      }

      socket.send(JSON.stringify(packet))
      setInput("")
    }
  }

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
