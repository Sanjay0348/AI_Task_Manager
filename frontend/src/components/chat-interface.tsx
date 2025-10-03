// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Send, Bot, User, Loader2 } from "lucide-react";
// import { useWebSocket, WebSocketMessage } from "@/lib/websocket";
// import { formatRelativeTime } from "@/lib/utils";

// interface ChatMessage {
//   id: string;
//   type: "user" | "agent";
//   content: string;
//   timestamp: Date;
//   isLoading?: boolean;
// }

// interface ChatInterfaceProps {
//   onSendMessage: (message: string) => boolean;
//   isConnected: boolean;
//   onWebSocketMessage?: (message: WebSocketMessage) => void;
// }

// export function ChatInterface({
//   onSendMessage,
//   isConnected,
//   onWebSocketMessage,
// }: ChatInterfaceProps) {
//   const [messages, setMessages] = useState<ChatMessage[]>([
//     {
//       id: "1",
//       type: "agent",
//       content:
//         "Hi! I'm your AI task management assistant. I can help you create, update, delete, and manage your tasks using natural language. Try saying something like 'Create a task to buy groceries tomorrow' or 'Show me all my pending tasks'.",
//       timestamp: new Date(),
//     },
//   ]);
//   const [inputValue, setInputValue] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // Handle WebSocket messages from parent
//   useEffect(() => {
//     if (onWebSocketMessage) {
//       const handleWebSocketMessage = (message: WebSocketMessage) => {
//         if (message.type === "agent_response") {
//           // Remove loading message and add agent response
//           setMessages((prev) => {
//             const filtered = prev.filter((msg) => !msg.isLoading);
//             return [
//               ...filtered,
//               {
//                 id: Date.now().toString(),
//                 type: "agent",
//                 content: message.data.agent_response,
//                 timestamp: new Date(),
//               },
//             ];
//           });
//           setIsTyping(false);
//         } else if (message.type === "typing_indicator") {
//           setIsTyping(message.data.typing);
//         }
//       };

//       // Store the handler for the parent to call
//       (window as any).__chatWebSocketHandler = handleWebSocketMessage;

//       return () => {
//         delete (window as any).__chatWebSocketHandler;
//       };
//     }
//   }, [onWebSocketMessage]);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!inputValue.trim() || !isConnected) return;

//     const userMessage: ChatMessage = {
//       id: Date.now().toString(),
//       type: "user",
//       content: inputValue.trim(),
//       timestamp: new Date(),
//     };

//     // Add user message immediately
//     setMessages((prev) => [...prev, userMessage]);

//     // Send message via WebSocket
//     const success = onSendMessage(inputValue.trim());

//     if (success) {
//       // Add loading message for agent response
//       const loadingMessage: ChatMessage = {
//         id: `loading-${Date.now()}`,
//         type: "agent",
//         content: "Thinking...",
//         timestamp: new Date(),
//         isLoading: true,
//       };
//       setMessages((prev) => [...prev, loadingMessage]);
//       setIsTyping(true);
//     }

//     setInputValue("");
//   };

//   const examplePrompts = [
//     "Create a task to call mom tomorrow",
//     "Show me all my pending tasks",
//     "Mark 'buy groceries' as done",
//     "List all high priority tasks",
//     "Update task 1 to high priority",
//     "Delete the task about cleaning",
//   ];

//   const handleExampleClick = (prompt: string) => {
//     setInputValue(prompt);
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Messages Area */}
//       <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex items-start space-x-3 animate-slide-up ${
//               message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
//             }`}
//           >
//             {/* Avatar */}
//             <div
//               className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
//                 message.type === "user"
//                   ? "bg-primary text-primary-foreground"
//                   : "bg-muted text-muted-foreground"
//               }`}
//             >
//               {message.type === "user" ? (
//                 <User className="w-4 h-4" />
//               ) : (
//                 <Bot className="w-4 h-4" />
//               )}
//             </div>

//             {/* Message Bubble */}
//             <div
//               className={`max-w-[75%] rounded-lg px-4 py-2 ${
//                 message.type === "user"
//                   ? "bg-primary text-primary-foreground"
//                   : "bg-muted text-muted-foreground"
//               }`}
//             >
//               <div className="text-sm">
//                 {message.isLoading ? (
//                   <div className="flex items-center space-x-2">
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     <span>Processing your request...</span>
//                   </div>
//                 ) : (
//                   message.content
//                 )}
//               </div>
//               <div className="text-xs mt-1 opacity-70">
//                 {formatRelativeTime(message.timestamp)}
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* Typing Indicator */}
//         {isTyping && (
//           <div className="flex items-start space-x-3 animate-fade-in">
//             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
//               <Bot className="w-4 h-4" />
//             </div>
//             <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
//               <div className="flex space-x-1">
//                 <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
//                 <div
//                   className="w-2 h-2 bg-current rounded-full animate-pulse"
//                   style={{ animationDelay: "0.2s" }}
//                 ></div>
//                 <div
//                   className="w-2 h-2 bg-current rounded-full animate-pulse"
//                   style={{ animationDelay: "0.4s" }}
//                 ></div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* Example Prompts */}
//       {messages.length <= 1 && (
//         <div className="mb-4 p-3 bg-muted/50 rounded-lg">
//           <p className="text-sm text-muted-foreground mb-2">
//             Try these example commands:
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {examplePrompts.slice(0, 3).map((prompt, index) => (
//               <button
//                 key={index}
//                 onClick={() => handleExampleClick(prompt)}
//                 className="text-xs px-2 py-1 bg-background hover:bg-accent hover:text-accent-foreground rounded border border-border transition-colors btn-hover"
//               >
//                 {prompt}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Input Form */}
//       <form onSubmit={handleSubmit} className="flex space-x-2">
//         <input
//           type="text"
//           value={inputValue}
//           onChange={(e) => setInputValue(e.target.value)}
//           placeholder={
//             isConnected
//               ? "Type your task management command..."
//               : "Connecting to AI agent..."
//           }
//           // disabled={!isConnected}
//           className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-lg focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
//         />
//         <button
//           type="submit"
//           // disabled={!inputValue.trim() || !isConnected}
//           className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus-ring disabled:opacity-50 disabled:cursor-not-allowed btn-hover transition-colors"
//         >
//           <Send className="w-4 h-4" />
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { WebSocketMessage } from "@/lib/websocket";
import { formatRelativeTime } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => boolean;
  isConnected: boolean;
}

export function ChatInterface({
  onSendMessage,
  isConnected,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "agent",
      content:
        "Hi! I'm your AI task management assistant. I can help you create, update, delete, and manage your tasks using natural language. Try saying something like 'Create a task to buy groceries tomorrow' or 'Show me all my pending tasks'.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Register WebSocket message handler BEFORE any rendering
  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      console.log("ChatInterface received message:", message);

      if (message.type === "agent_response") {
        // Remove loading message and add agent response
        setMessages((prev) => {
          const filtered = prev.filter((msg) => !msg.isLoading);
          return [
            ...filtered,
            {
              id: Date.now().toString(),
              type: "agent",
              content: message.data.agent_response,
              timestamp: new Date(),
            },
          ];
        });
        setIsTyping(false);
      } else if (message.type === "typing_indicator") {
        setIsTyping(message.data.typing);
      }
    };

    // Store the handler for the parent to call
    (window as any).__chatWebSocketHandler = handleWebSocketMessage;
    console.log("WebSocket handler registered");

    return () => {
      delete (window as any).__chatWebSocketHandler;
      console.log("WebSocket handler unregistered");
    };
  }, []); // Empty dependency array - only run once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);

    // Send message via WebSocket
    const success = onSendMessage(inputValue.trim());

    if (success) {
      // Add loading message for agent response
      const loadingMessage: ChatMessage = {
        id: `loading-${Date.now()}`,
        type: "agent",
        content: "Thinking...",
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);
      setIsTyping(true);
    }

    setInputValue("");
  };

  const examplePrompts = [
    "Create a task to call mom tomorrow",
    "Show me all my pending tasks",
    "Mark 'buy groceries' as done",
    "List all high priority tasks",
    "Update task 1 to high priority",
    "Delete the task about cleaning",
  ];

  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 p-6 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-4 animate-slide-up ${
              message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                message.type === "user"
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                  : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
              }`}
            >
              {message.type === "user" ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                message.type === "user"
                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                  : "bg-gradient-to-br from-card to-card/90 text-card-foreground border border-border/50"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.isLoading ? (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing your request...</span>
                  </div>
                ) : (
                  message.content
                )}
              </div>
              <div className="text-xs mt-2 opacity-60">
                {formatRelativeTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-4 animate-fade-in">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/80 text-muted-foreground flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-gradient-to-br from-card to-card/90 text-card-foreground rounded-2xl px-5 py-3 border border-border/50 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-current rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
            <p className="text-sm font-medium text-primary mb-3">
              💡 Try these example commands:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examplePrompts.slice(0, 4).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="text-left text-xs px-3 py-2 bg-background/80 hover:bg-primary/10 hover:text-primary rounded-lg border border-border/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isConnected
                  ? "Ask me to create, update, or manage your tasks..."
                  : "Connecting to AI agent..."
              }
              disabled={!isConnected}
              className="w-full px-4 py-3 pr-12 border border-border/50 bg-background/80 text-foreground rounded-xl focus-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm backdrop-blur-sm"
            />
            {!isConnected && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary focus-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
