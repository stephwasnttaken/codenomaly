import { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import type { ChatMessage } from "../../types";

interface ChatPanelProps {
  onSendChat: (text: string) => void;
}

export function ChatPanel({ onSendChat }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessages = useGameStore((s) => s.chatMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    onSendChat(t);
  }, [input, onSendChat]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-amber-800/50">
        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
          Chat
        </h3>
      </div>
      <div className="flex-1 overflow-auto p-2 min-h-0">
        {chatMessages.length === 0 ? (
          <p className="text-sm text-amber-800/80 italic">No messages yet...</p>
        ) : (
          <ul className="space-y-2">
            {chatMessages.map((m: ChatMessage) => (
              <li key={m.id} className="text-sm">
                <span className="font-medium text-amber-900">{m.sender}:</span>{" "}
                <span className="text-amber-950">{m.text}</span>
                <span className="ml-1 text-xs text-amber-600">{m.time}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-amber-800/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type..."
          className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-950 placeholder:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={handleSend}
          className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-medium transition"
          aria-label="Send message"
          title="Send"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
