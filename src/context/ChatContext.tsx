import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { messagesService, usersService } from '../services/database';
import { useUser } from './UserContext';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
}

interface ChatContextType {
  messages: Message[];
  chatUsers: ChatUser[];
  selectedChatUser: ChatUser | null;
  unreadCount: number;
  loading: boolean;
  selectChatUser: (user: ChatUser) => void;
  sendMessage: (message: string) => Promise<void>;
  loadChatUsers: () => Promise<void>;
  markAsRead: (userId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<ChatUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load available chat users
  const loadChatUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('ChatContext: Loading chat users for user:', user);
      let users: ChatUser[] = [];

      if (user.role === 'admin') {
        // Admins can see all non-admin users (students and faculty)
        const allUsers = await usersService.getAll();
        console.log('ChatContext: All users from database:', allUsers);
        users = allUsers
          .filter(u => u.role !== 'admin' && u.id !== user.id) // Exclude admins and self
          .map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as 'student' | 'faculty' | 'admin'
          }));
        console.log('ChatContext: Filtered users for admin:', users);
      } else {
        // Students/faculty can see all admin users
        const allUsers = await usersService.getAll();
        console.log('ChatContext: All users from database:', allUsers);
        users = allUsers
          .filter(u => u.role === 'admin' && u.id !== user.id) // Only admins, exclude self
          .map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as 'student' | 'faculty' | 'admin'
          }));
        console.log('ChatContext: Filtered admin users for student/faculty:', users);
      }

      setChatUsers(users);
    } catch (error) {
      console.error('Error loading chat users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages between current user and selected user
  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const messageHistory = await messagesService.getMessagesBetweenUsers(user.id, otherUserId);
      setMessages(messageHistory);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select a user to chat with
  const selectChatUser = (chatUser: ChatUser) => {
    setSelectedChatUser(chatUser);
    loadMessages(chatUser.id);
    markAsRead(chatUser.id);
  };

  // Send a message
  const sendMessage = async (messageText: string) => {
    if (!user || !selectedChatUser || !messageText.trim()) return;

    try {
      const newMessage = await messagesService.sendMessage(
        user.id,
        selectedChatUser.id,
        messageText.trim()
      );
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Mark messages as read (placeholder for future implementation)
  const markAsRead = (userId: string) => {
    // This would typically update a read status in the database
    // For now, we'll just reset the unread count for this user
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user) return;

    const subscription = messagesService.subscribeToMessages((payload) => {
      const newMessage = payload.new as Message;
      
      // Only add message if it involves the current user
      if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Update unread count if message is from someone else
        if (newMessage.sender_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }

        // Reload chat users to include new participants
        loadChatUsers();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Load chat users when user changes
  useEffect(() => {
    if (user) {
      loadChatUsers();
    } else {
      setChatUsers([]);
      setMessages([]);
      setSelectedChatUser(null);
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{
      messages,
      chatUsers,
      selectedChatUser,
      unreadCount,
      loading,
      selectChatUser,
      sendMessage,
      loadChatUsers,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};