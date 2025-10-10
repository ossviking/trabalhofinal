import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, User, Shield, Sparkles, Loader } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { useReservation } from '../context/ReservationContext';
import { sendMessageToAI, getChatContext } from '../services/aiService';

const Chat = () => {
  const { user } = useUser();
  const { refreshData } = useReservation();
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
  const [activeTab, setActiveTab] = useState<'users' | 'ai'>('users');
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isAITyping, setIsAITyping] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'ai' && aiMessages.length === 0) {
      loadAIChatHistory();
    }
  }, [user, activeTab]);

  const loadAIChatHistory = async () => {
    if (!user) return;
    try {
      const context = await getChatContext(user.id);
      if (context && context.conversation_history) {
        setAiMessages(context.conversation_history);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de IA:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      if (activeTab === 'ai') {
        await handleSendAIMessage(messageText);
      } else {
        await sendMessage(messageText);
      }
      setMessageText('');
    } catch (error) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAIMessage = async (message: string) => {
    if (!user) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setIsAITyping(true);

    try {
      const { response, updatedHistory, reservationCreated } = await sendMessageToAI(
        message,
        aiMessages.map(m => ({ role: m.role, content: m.content }))
      );

      setAiMessages(updatedHistory);

      if (reservationCreated) {
        // Refresh reservations data to show the new reservation
        await refreshData();

        setTimeout(() => {
          const message = user?.role === 'admin'
            ? 'Reserva criada com sucesso! Ela já está disponível para aprovação no painel.'
            : 'Reserva criada com sucesso! Você pode acompanhar o status no painel. O administrador irá revisar sua solicitação.';

          alert(message);
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errorMessage.includes('VITE_ANTHROPIC_API_KEY')) {
        alert('Configure a chave de API da Anthropic no arquivo .env para usar o Assistente IA.');
      } else if (errorMessage.includes('Rate limit')) {
        alert('Você atingiu o limite de mensagens. Aguarde alguns segundos.');
      } else {
        alert('Erro ao comunicar com o assistente IA. Tente novamente.');
      }
    } finally {
      setIsAITyping(false);
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
          <div className="p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">Chat</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'users'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Mensagens</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'ai'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Sparkles className="h-4 w-4" />
                  <span>Assistente IA</span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Users List - Only show when on users tab */}
            {activeTab === 'users' && (
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
            )}

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'ai' ? (
                <>
                  {/* AI Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {aiMessages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm space-y-3">
                        <div className="flex justify-center">
                          <Sparkles className="h-12 w-12 text-blue-400" />
                        </div>
                        <p className="font-medium">Assistente IA</p>
                        <p className="text-xs px-4">
                          Pergunte sobre disponibilidade, faça reservas, ou peça sugestões para suas aulas!
                        </p>
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => setMessageText('Quero reservar o Laboratório de Informática para amanhã às 14h')}
                            className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Quero reservar o Laboratório de Informática para amanhã às 14h
                          </button>
                          <button
                            onClick={() => setMessageText('Quais salas estão disponíveis hoje?')}
                            className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Quais salas estão disponíveis hoje?
                          </button>
                          <button
                            onClick={() => setMessageText('Preciso reservar equipamento para uma aula prática')}
                            className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Preciso reservar equipamento para uma aula prática
                          </button>
                          <button
                            onClick={() => setMessageText('Como organizar uma aula de laboratório?')}
                            className="block w-full text-left px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Como organizar uma aula de laboratório?
                          </button>
                        </div>
                      </div>
                    ) : (
                      aiMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gradient-to-br from-purple-100 to-blue-100 text-gray-900 border border-purple-200'
                          }`}>
                            {message.role === 'assistant' && (
                              <div className="flex items-center space-x-1 mb-1">
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                <span className="text-xs font-medium text-purple-600">Assistente IA</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    {isAITyping && (
                      <div className="flex justify-start">
                        <div className="max-w-xs px-3 py-2 rounded-lg text-sm bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200">
                          <div className="flex items-center space-x-2">
                            <Loader className="h-4 w-4 text-purple-600 animate-spin" />
                            <span className="text-gray-600">Assistente IA está digitando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* AI Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Pergunte ao assistente IA..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isSending || isAITyping}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending || isAITyping}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : selectedChatUser ? (
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