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
      // Optimized fetch with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          userRole: session?.user?.role || 'resident',
          conversationHistory: messages.slice(-6) // Last 6 for context
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
        content: data.response || 'I apologize, I received an empty response. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      
      let userFriendlyMessage = '';
      
      if (error.name === 'AbortError') {
        userFriendlyMessage = 'The response is taking too long. Please try a simpler question or use email support for complex queries.';
      } else if (error.message?.includes('API key') || error.message?.includes('configuration')) {
        userFriendlyMessage = 'Our AI service is currently being configured. Please try the email support option for immediate assistance.';
      } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('High traffic')) {
        userFriendlyMessage = 'We\'re experiencing high traffic. Please wait a moment and try again, or use email support.';
      } else if (error.message?.includes('not available') || error.message?.includes('503')) {
        userFriendlyMessage = 'AI assistant is temporarily unavailable. Please use email support for assistance.';
      } else {
        userFriendlyMessage = 'I\'m having trouble responding right now. Please try again or use email support for immediate help.';
      }
      
      toast.error('Unable to get AI response', {
        description: userFriendlyMessage
      });
      
      const errorResponseMessage: Message = {
        role: 'assistant',
        content: userFriendlyMessage,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-blue-200 dark:border-blue-800 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              24/7 Support Available
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4"
          >
            Get instant help with our AI-powered chatbot or send us a detailed message
          </motion.p>
        </div>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mb-6 sm:mb-8 justify-center flex-wrap"
        >
          <Button
            onClick={() => setMode('chatbot')}
            variant={mode === 'chatbot' ? 'default' : 'outline'}
            size="lg"
            className={`flex items-center gap-2 px-6 md:px-8 py-5 md:py-6 text-sm md:text-base font-medium transition-all duration-300 transform ${
              mode === 'chatbot'
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105 hover:shadow-xl'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 border-2'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Chatbot</span>
            {mode === 'chatbot' && <Zap className="w-4 h-4 animate-pulse" />}
          </Button>
          <Button
            onClick={() => setMode('email')}
            variant={mode === 'email' ? 'default' : 'outline'}
            size="lg"
            className={`flex items-center gap-2 px-6 md:px-8 py-5 md:py-6 text-sm md:text-base font-medium transition-all duration-300 transform ${
              mode === 'email'
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105 hover:shadow-xl'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 border-2'
            }`}
          >
            <Mail className="w-5 h-5" />
            <span>Email Support</span>
            {mode === 'email' && <CheckCircle2 className="w-4 h-4" />}
          </Button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {mode === 'chatbot' ? (
            <motion.div
              key="chatbot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Bot className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Ask me anything about CircleIn, bookings, amenities, or community features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Chat Messages */}
                  <div className="h-[450px] sm:h-[500px] md:h-[550px] overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        >
                          <Bot className="w-16 h-16 md:w-20 md:h-20 text-blue-500 mb-4 opacity-50" />
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-slate-700 dark:text-slate-300 mb-2 font-medium text-base md:text-lg"
                        >
                          👋 Hi! I'm your CircleIn AI assistant.
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-sm md:text-base text-slate-500 dark:text-slate-400"
                        >
                          Ask me about bookings, amenities, or any other questions!
                        </motion.p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-2 mb-1">
                                {msg.role === 'assistant' ? (
                                  <Bot className="w-4 h-4 mt-1 shrink-0" />
                                ) : (
                                  <User className="w-4 h-4 mt-1 shrink-0" />
                                )}
                                {msg.role === 'assistant' ? (
                                  <div className="text-sm md:text-base flex-1 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-slate-200 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm md:text-base whitespace-pre-wrap break-words flex-1">{msg.content}</p>
                                )}
                              </div>
                              <span className={`text-xs opacity-70 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-md border border-slate-200 dark:border-slate-700">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Advanced Modern Input Bar */}
                  <div className="relative border-t bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 p-5 backdrop-blur-xl">
                    {/* Decorative gradient border on top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                    
                    {/* Floating particles effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div
                        animate={{
                          x: [0, 100, 0],
                          y: [0, -50, 0],
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute top-2 left-10 w-2 h-2 rounded-full bg-blue-400 blur-sm"
                      />
                      <motion.div
                        animate={{
                          x: [0, -80, 0],
                          y: [0, -30, 0],
                          opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1
                        }}
                        className="absolute top-4 right-20 w-1.5 h-1.5 rounded-full bg-purple-400 blur-sm"
                      />
                    </div>

                    <div className="flex gap-3 relative">
                      {/* Enhanced Input Container */}
                      <div className="flex-1 relative group">
                        {/* Animated glow effect */}
                        <motion.div
                          animate={{
                            opacity: input.length > 0 ? [0.5, 0.8, 0.5] : 0,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-70 transition-opacity duration-500"
                        />
                        
                        {/* Main Input */}
                        <div className="relative">
                          <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="relative text-sm md:text-base pl-12 pr-4 py-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 focus:border-transparent focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                          
                          {/* Icon inside input */}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <motion.div
                              animate={{
                                rotate: isLoading ? 360 : 0,
                              }}
                              transition={{
                                duration: 2,
                                repeat: isLoading ? Infinity : 0,
                                ease: "linear"
                              }}
                            >
                              {isLoading ? (
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                              ) : (
                                <MessageCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                              )}
                            </motion.div>
                          </div>

                          {/* Character count indicator */}
                          {input.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            >
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                {input.length}
                              </span>
                            </motion.div>
                          )}
                        </div>

                        {/* Typing indicator line */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: input.length > 0 ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left rounded-full"
                        />
                      </div>

                      {/* Enhanced Send Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        {/* Button glow effect */}
                        <motion.div
                          animate={{
                            opacity: !input.trim() || isLoading ? 0 : [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-md opacity-0"
                        />
                        
                        <Button
                          onClick={handleSendMessage}
                          disabled={!input.trim() || isLoading}
                          className="relative h-[52px] w-[52px] md:h-[56px] md:w-[56px] rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg border-2 border-white/20 backdrop-blur-xl group overflow-hidden"
                          size="lg"
                        >
                          {/* Shimmer effect on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          />
                          
                          {/* Button icon */}
                          <motion.div
                            animate={{
                              rotate: isLoading ? 360 : 0,
                            }}
                            transition={{
                              duration: 1,
                              repeat: isLoading ? Infinity : 0,
                              ease: "linear"
                            }}
                            className="relative z-10"
                          >
                            {isLoading ? (
                              <Loader2 className="w-6 h-6 text-white" />
                            ) : (
                              <motion.div
                                whileHover={{ x: 2, y: -2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Send className="w-6 h-6 text-white drop-shadow-lg" />
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Sparkle effect */}
                          {!isLoading && input.trim() && (
                            <motion.div
                              className="absolute top-1 right-1"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                              }}
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </Button>
                      </motion.div>
                    </div>

                    {/* Helpful hints */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: messages.length === 0 ? 1 : 0, y: messages.length === 0 ? 0 : 10 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 flex flex-wrap gap-2 justify-center"
                    >
                      {['Book amenity', 'Check availability', 'Community events'].map((hint, idx) => (
                        <motion.button
                          key={hint}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setInput(hint)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300"
                        >
                          {hint}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Mail className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
                    Email Support
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Send us a detailed message and we'll respond within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="subject" className="text-base font-medium mb-2 block">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="Brief description of your inquiry"
                        required
                        className="text-sm md:text-base border-2 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-base font-medium mb-2 block">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        placeholder="Describe your issue or question in detail..."
                        required
                        rows={8}
                        className="text-sm md:text-base border-2 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                          Your message will be sent securely to our support team. We typically respond within 24 hours.
                        </span>
                      </p>
                    </motion.div>

                    <Button
                      type="submit"
                      disabled={emailSending}
                      className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-base md:text-lg py-6 md:py-7 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {emailSending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
