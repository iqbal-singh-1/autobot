import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChatInput } from './components/ChatInput';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ThemeProvider } from './context/ThemeContext';
import { Chat, ChatState, Message } from './types';
import { Menu } from 'lucide-react';

const WEBSOCKET_URL = 'ws://localhost:3001';

function ChatApp() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastMouseY, setLastMouseY] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      const isTopArea = e.clientY < 60;
      setIsNavbarVisible(isTopArea);
      setLastMouseY(e.clientY);

      if (!isTopArea) {
        timeoutId = window.setTimeout(() => {
          setIsNavbarVisible(false);
        }, 2000);
      } else {
        clearTimeout(timeoutId);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 3000; // 3 seconds
  
    const connectWebSocket = () => {
      const socket = new WebSocket(WEBSOCKET_URL);
  
      socket.onopen = () => {
        console.log('Connected to WebSocket');
        setWsConnected(true);
        // Reset reconnect attempts on successful connection
        reconnectAttempts = 0;
        
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: "Hi there! 🚗 Just tell me the name of any vehicle and I'll give you all the juicy details.",
          timestamp: new Date(),
        };
        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, welcomeMessage],
        }));
      };
  
      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          const newMessage: Message = {
            id: Date.now().toString(),
            type: 'bot',
            content: response.content,
            timestamp: new Date(),
          };
  
          setChatState((prev) => ({
            isLoading: false,
            messages: [...prev.messages, newMessage],
          }));
  
          if (!activeChat) {
            const newChat: Chat = {
              id: Date.now().toString(),
              title: chatState.messages.length > 0 ? 
                chatState.messages[chatState.messages.length - 1]?.content?.slice(0, 30) || 'New Chat' : 
                'New Chat',
              messages: [...chatState.messages, newMessage],
              timestamp: new Date(),
            };
            setChats((prev) => [newChat, ...prev]);
            setActiveChat(newChat.id);
          } else {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === activeChat
                  ? {
                      ...chat,
                      messages: [...chat.messages, newMessage],
                      timestamp: new Date(),
                    }
                  : chat
              )
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
  
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        // Don't attempt reconnection here - let onclose handle it
      };
  
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason || ''}`);
        setWsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          
          // Show reconnecting message to user if this is the first attempt
          if (reconnectAttempts === 1) {
            const reconnectingMessage: Message = {
              id: Date.now().toString(),
              type: 'bot',
              content: "Connection lost. Attempting to reconnect...",
              timestamp: new Date(),
            };
            
            setChatState((prev) => ({
              ...prev,
              messages: [...prev.messages, reconnectingMessage],
            }));
          }
          
          // Clear any existing timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          
          // Schedule reconnection
          reconnectTimeout = setTimeout(() => {
            setWs(connectWebSocket());
          }, RECONNECT_INTERVAL);
        } else {
          // Max reconnect attempts reached
          const failedMessage: Message = {
            id: Date.now().toString(),
            type: 'bot',
            content: "Unable to connect to the server after multiple attempts. Please refresh the page or try again later.",
            timestamp: new Date(),
          };
          
          setChatState((prev) => ({
            isLoading: false,
            messages: [...prev.messages, failedMessage],
          }));
        }
      };
  
      return socket;
    };
  
    // Create initial connection
    const socket = connectWebSocket();
    setWs(socket);
  
    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };
  }, []);
  
  const handleSendMessage = useCallback(
    (content: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content,
          timestamp: new Date(),
        };
  
        setChatState((prev) => ({
          isLoading: true,
          messages: [...prev.messages, newMessage],
        }));
  
        if (!activeChat) {
          const newChat: Chat = {
            id: Date.now().toString(),
            title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
            messages: [...chatState.messages, newMessage],
            timestamp: new Date(),
          };
          setChats((prev) => [newChat, ...prev]);
          setActiveChat(newChat.id);
        } else {
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    timestamp: new Date(),
                  }
                : chat
            )
          );
        }
  
        try {
          ws.send(JSON.stringify({ type: 'query', content }));
        } catch (error) {
          console.error('Error sending message:', error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'bot',
            content: "Failed to send message. Please try again.",
            timestamp: new Date(),
          };
          
          setChatState((prev) => ({
            isLoading: false,
            messages: [...prev.messages, errorMessage],
          }));
        }
      } else {
        console.error('WebSocket is not connected');
        // Add a message to inform the user
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: "Sorry, I'm having trouble connecting to the server. Attempting to reconnect...",
          timestamp: new Date(),
        };
        setChatState((prev) => ({
          isLoading: false,
          messages: [...prev.messages, errorMessage],
        }));
        
        // Force reconnection by closing and re-initializing
        if (ws) {
          ws.close();
        }
      }
    },
    [ws, activeChat, chatState.messages]
  );
  
  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat.id);
    setChatState({
      messages: chat.messages,
      isLoading: false,
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <div
        className={`fixed top-0 z-50 w-full transform transition-transform duration-300 ${
          isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Header />
      </div>
      <div className="flex flex-1 overflow-hidden pt-16">
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-20 z-40 rounded-full bg-blue-500 p-2 text-white shadow-lg transition-all hover:bg-blue-600"
        >
          <Menu className="h-6 w-6" />
        </button>
        {isSidebarOpen && (
          <div className="fixed left-0 top-16 z-30 h-full">
            <Sidebar
              chats={chats}
              onSelectChat={handleSelectChat}
              activeChat={activeChat}
            />
          </div>
        )}
        <main className={`flex flex-1 flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <ChatWindow messages={chatState.messages} />
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={chatState.isLoading}
          />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;