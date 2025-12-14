'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mail, Send, Bot, Loader2, CheckCircle2, AlertCircle, Sparkles, Zap, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ContactMode = 'chatbot' | 'email';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ContactPage() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<ContactMode>('chatbot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });
  const [emailSending, setEmailSending] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle chatbot message - optimized for speed and reliability
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          userRole: session?.user?.role || 'resident',
          conversationHistory: messages.slice(-6)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      
      let errorMessage = '';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Response timeout. Please try a shorter question or use email support.';
      } else if (error.message?.includes('API key') || error.message?.includes('configuration')) {
        errorMessage = 'AI service is being configured. Please use email support for immediate assistance.';
      } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('High traffic')) {
        errorMessage = 'High traffic detected. Please wait a moment and try again.';
      } else if (error.message?.includes('503') || error.message?.includes('not available')) {
        errorMessage = 'AI assistant is temporarily unavailable. Please use email support.';
      } else {
        errorMessage = 'Unable to get response right now. Please try again or use email support.';
      }
      
      toast.error('Error', {
        description: errorMessage
      });
      
      const errorResponseMessage: Message = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      toast.error('Please fill in all fields', {
        description: 'Both subject and message are required.'
      });
      return;
    }

    if (!session?.user?.email) {
      toast.error('Authentication required', {
        description: 'Please sign in to send messages.'
      });
      return;
    }

    setEmailSending(true);

    try {
      // Get recipient email based on role
      // Admin emails go to main support, Resident emails go to their community admin
      let recipientEmail = 'circleinapp1@gmail.com'; // Default to main support
      
      if (isAdmin) {
        // Admin sending to main support
        recipientEmail = 'circleinapp1@gmail.com';
      } else {
        // Resident sending to their admin
        // TODO: Get admin email from community/user data
        recipientEmail = 'abhinav.sadineni@gmail.com';
      }
      
      console.log('📧 Sending email to:', recipientEmail);
      console.log('📧 From:', session.user.email, '| Role:', isAdmin ? 'admin' : 'resident');
      
      // Send email via API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailForm.subject,
          message: emailForm.message,
          senderName: session.user.name,
          senderEmail: session.user.email,
          senderRole: isAdmin ? 'admin' : 'resident',
          communityName: session.user.communityId || 'Unknown Community',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to send email');
      }

      console.log('✅ Email sent successfully:', result.messageId);

      toast.success('Message sent successfully! ✅', {
        description: 'We\'ll get back to you within 24 hours.',
        duration: 5000
      });

      setEmailForm({ subject: '', message: '' });

    } catch (error: any) {
      console.error('❌ Email send error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to send message ❌', {
        description: error.message || 'Please check your internet connection and try again.',
        duration: 6000
      });
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 60% 40%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 mb-5 px-5 py-2.5 bg-slate-800/40 backdrop-blur-xl rounded-full border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-wide">
              24/7 SUPPORT AVAILABLE
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent mb-4 tracking-tight"
            style={{ fontFamily: 'Inter, system-ui, -apple-system' }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 font-medium tracking-wide"
          >
            Get instant help with our AI-powered assistant or reach out via email
          </motion.p>
        </div>

        {/* Mode Selection - Futuristic Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
          className="flex gap-4 mb-8 sm:mb-10 justify-center flex-wrap"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={() => setMode('chatbot')}
              variant="ghost"
              size="lg"
              className={`relative flex items-center gap-3 px-8 md:px-10 py-6 md:py-7 text-base md:text-lg font-bold transition-all duration-300 overflow-hidden group ${
                mode === 'chatbot'
                  ? 'bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 text-white border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/30 backdrop-blur-xl'
                  : 'bg-slate-800/30 backdrop-blur-xl border-2 border-slate-700/50 text-slate-300 hover:border-cyan-500/30 hover:bg-slate-800/50'
              }`}
            >
              {/* Animated border glow */}
              {mode === 'chatbot' && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.3)',
                      '0 0 40px rgba(139, 92, 246, 0.3)',
                      '0 0 20px rgba(6, 182, 212, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <Bot className="w-6 h-6 relative z-10" />
              <span className="relative z-10 tracking-wide">AI Chatbot</span>
              {mode === 'chatbot' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Zap className="w-5 h-5 text-cyan-400 relative z-10" />
                </motion.div>
              )}
              {/* Hover shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={() => setMode('email')}
              variant="ghost"
              size="lg"
              className={`relative flex items-center gap-3 px-8 md:px-10 py-6 md:py-7 text-base md:text-lg font-bold transition-all duration-300 overflow-hidden group ${
                mode === 'email'
                  ? 'bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 text-white border-2 border-violet-400/50 shadow-2xl shadow-violet-500/30 backdrop-blur-xl'
                  : 'bg-slate-800/30 backdrop-blur-xl border-2 border-slate-700/50 text-slate-300 hover:border-violet-500/30 hover:bg-slate-800/50'
              }`}
            >
              {/* Animated border glow */}
              {mode === 'email' && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(139, 92, 246, 0.3)',
                      '0 0 40px rgba(6, 182, 212, 0.3)',
                      '0 0 20px rgba(139, 92, 246, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <Mail className="w-6 h-6 relative z-10" />
              <span className="relative z-10 tracking-wide">Email Support</span>
              {mode === 'email' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-violet-400 relative z-10" />
                </motion.div>
              )}
              {/* Hover shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </Button>
          </motion.div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {mode === 'chatbot' ? (
            <motion.div
              key="chatbot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="relative">
                {/* Outer glow container */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <Card className="relative shadow-2xl border-2 border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl overflow-hidden">
                  {/* Animated gradient border top */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    animate={{
                      background: [
                        'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
                        'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)',
                        'linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.8), transparent)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl pb-5">
                    <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-black text-white tracking-tight">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      >
                        <Bot className="w-7 h-7 md:w-8 md:h-8 text-cyan-400" />
                      </motion.div>
                      AI Assistant
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-slate-400 font-medium mt-2">
                      Ask me anything about CircleIn, bookings, amenities, or community features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Chat Messages */}
                    <div className="h-[450px] sm:h-[500px] md:h-[550px] overflow-y-auto p-5 md:p-7 space-y-4 scroll-smooth bg-slate-900/20">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <Bot className="relative w-20 h-20 md:w-24 md:h-24 text-cyan-400 mb-6" />
                          </motion.div>
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-white mb-2 font-bold text-xl md:text-2xl"
                          >
                            👋 Hi! I'm your CircleIn AI assistant.
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-base md:text-lg text-slate-400 font-medium"
                          >
                            Ask me about bookings, amenities, or any other questions!
                          </motion.p>
                        </div>
                      ) : (
                        <>
                          {messages.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-xl relative overflow-hidden ${
                                  msg.role === 'user'
                                    ? 'bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 text-white'
                                    : 'bg-slate-800/60 backdrop-blur-xl text-slate-100 border-2 border-slate-700/50'
                                }`}
                              >
                                {/* Message glow effect */}
                                {msg.role === 'user' && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-violet-400/20 to-fuchsia-400/20 blur-xl" />
                                )}
                                
                                <div className="flex items-start gap-3 mb-1.5 relative z-10">
                                  {msg.role === 'assistant' ? (
                                    <Bot className="w-5 h-5 mt-1 shrink-0 text-cyan-400" />
                                  ) : (
                                    <User className="w-5 h-5 mt-1 shrink-0" />
                                  )}
                                  {msg.role === 'assistant' ? (
                                    <div className="text-sm md:text-base flex-1 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:my-3 prose-strong:text-white prose-strong:font-bold prose-code:text-cyan-300 prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:font-mono">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <p className="text-sm md:text-base whitespace-pre-wrap break-words flex-1 font-medium">{msg.content}</p>
                                  )}
                                </div>
                                <span className={`text-xs opacity-80 block relative z-10 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </motion.div>
                            </motion.div>
                          ))}
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex justify-start"
                            >
                              <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl border-2 border-slate-700/50">
                                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                                <span className="text-base font-medium text-white">Thinking...</span>
                              </div>
                            </motion.div>
                          )}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Futuristic Input Bar */}
                    <div className="relative border-t border-slate-700/50 bg-slate-800/40 backdrop-blur-2xl p-6">
                      {/* Animated gradient border on top */}
                      <motion.div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        animate={{
                          background: [
                            'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent)',
                            'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                      />

                      <div className="flex gap-4 relative">
                        {/* Enhanced Input Container */}
                        <div className="flex-1 relative">
                          {/* Main Input */}
                          <div className="relative">
                            <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder="Type your message..."
                              disabled={isLoading}
                              className="relative text-sm md:text-base pl-12 pr-6 py-6 md:py-7 rounded-2xl bg-slate-900/60 backdrop-blur-xl border-2 border-slate-700/50 focus:border-cyan-400 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed font-medium placeholder:text-slate-400 text-white ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                            />
                            
                            {/* Icon inside input */}
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isLoading ? (
                                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                              ) : (
                                <MessageCircle className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Send Button */}
                        <motion.div
                          whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
                          whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                            ) : (
                              <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            )}
                          </button>
                        </motion.div>
                      </div>

                      {/* Quick suggestion buttons */}
                      {messages.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          className="mt-5 flex flex-wrap gap-2 justify-center"
                        >
                          {['Book amenity', 'Check availability', 'Community events'].map((hint, idx) => (
                            <motion.button
                              key={hint}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + idx * 0.05 }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setInput(hint)}
                              disabled={isLoading}
                              className="px-4 py-2 text-sm font-semibold rounded-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-200 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {hint}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="relative">
                {/* Outer glow container */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-3xl blur-2xl"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <Card className="relative shadow-2xl border-2 border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl">
                  {/* Animated gradient border top */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    animate={{
                      background: [
                        'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)',
                        'linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.8), transparent)',
                        'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl pb-5">
                    <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-black text-white tracking-tight">
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Mail className="w-7 h-7 md:w-8 md:h-8 text-violet-400" />
                      </motion.div>
                      Email Support
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-slate-400 font-medium mt-2">
                      Send us a detailed message and we'll respond within 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 md:p-10 bg-slate-900/20">
                    <form onSubmit={handleEmailSubmit} className="space-y-7">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label htmlFor="subject" className="text-base md:text-lg font-bold mb-3 block text-slate-900 dark:text-white">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          value={emailForm.subject}
                          onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                          placeholder="Brief description of your inquiry"
                          required
                          className="text-sm md:text-base py-6 border-2 border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 backdrop-blur-xl focus:border-violet-500 transition-all duration-200 text-slate-900 dark:text-white font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="message" className="text-base md:text-lg font-bold mb-3 block text-slate-900 dark:text-white">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          value={emailForm.message}
                          onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                          placeholder="Describe your issue or question in detail..."
                          required
                          rows={8}
                          className="text-sm md:text-base py-4 border-2 border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 backdrop-blur-xl focus:border-fuchsia-500 transition-all duration-200 resize-none text-slate-900 dark:text-white font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border-2 border-cyan-500/30 rounded-xl p-5 backdrop-blur-xl overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <p className="relative text-sm md:text-base text-cyan-200 flex items-start gap-3 font-medium">
                          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-cyan-400" />
                          <span>
                            Your message will be sent securely to our support team. We typically respond within 24 hours.
                          </span>
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: emailSending ? 1 : 1.02 }}
                        whileTap={{ scale: emailSending ? 1 : 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={emailSending}
                          className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-cyan-600 text-lg md:text-xl font-black py-7 md:py-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                          <span className="flex items-center justify-center gap-3">
                            {emailSending ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-6 h-6" />
                                Send Message
                              </>
                            )}
                          </span>
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
