import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, User, Shield } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';

const Chat = () => {
  const { user } = useUser();
  const {
    messages,
    chatUsers,
    selectedChatUser,
    loading,
    selectChatUser,
    sendMessage,
    loadChatUsers
  } = useChat();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(messageText);
      setMessageText('');
    } catch (error) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUserIcon = (role: string) => {
    return role === 'admin' ? Shield : User;
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">
                {selectedChatUser ? selectedChatUser.name : 'Chat'}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Users List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">
                  {user.role === 'admin' ? 'Conversas' : 'Administradores'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Carregando...
                  </div>
                ) : chatUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {user.role === 'admin' 
                      ? 'Nenhuma conversa ainda' 
                      : 'Nenhum admin disponível'
                    }
                  </div>
                ) : (
                  chatUsers.map((chatUser) => {
                    const Icon = getUserIcon(chatUser.role);
                    return (
                      <button
                        key={chatUser.id}
                        onClick={() => selectChatUser(chatUser)}
                        className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200 ${
                          selectedChatUser?.id === chatUser.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded-full ${
                            chatUser.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            <Icon className={`h-3 w-3 ${
                              chatUser.role === 'admin' ? 'text-purple-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {chatUser.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {chatUser.role}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedChatUser ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm">
                        Nenhuma mensagem ainda. Inicie a conversa!
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isFromCurrentUser = message.sender_id === user.id;
                        const showDate = index === 0 || 
                          formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="text-center text-xs text-gray-500 my-2">
                                {formatDate(message.created_at)}
                              </div>
                            )}
                            <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                isFromCurrentUser
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}>
                                <p>{message.message_text}</p>
                                <p className={`text-xs mt-1 ${
                                  isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Selecione uma conversa para começar
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;