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
import { cn } from '@/lib/utils';

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

  // Handle chatbot message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userRole: session?.user?.role || 'resident',
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support via email.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setEmailSending(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'circleinapp1@gmail.com',
          subject: emailForm.subject,
          message: emailForm.message,
          senderName: session?.user?.name || 'Anonymous',
          senderEmail: session?.user?.email || 'no-email@provided.com',
          senderRole: session?.user?.role || 'resident',
          communityName: (session?.user as any)?.communityName || 'Unknown Community'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setEmailForm({ subject: '', message: '' });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            24/7 SUPPORT AVAILABLE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3 sm:mb-4"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Get instant help with our AI-powered assistant or reach out via email
          </motion.p>
        </div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4"
        >
          <Button
            onClick={() => setMode('chatbot')}
            variant={mode === 'chatbot' ? 'default' : 'outline'}
            className={cn(
              "flex items-center justify-center gap-2 px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-semibold transition-all w-full sm:w-auto",
              mode === 'chatbot'
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-2"
            )}
          >
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>AI Chatbot</span>
            {mode === 'chatbot' && <Zap className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
          <Button
            onClick={() => setMode('email')}
            variant={mode === 'email' ? 'default' : 'outline'}
            className={cn(
              "flex items-center justify-center gap-2 px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-semibold transition-all w-full sm:w-auto",
              mode === 'email'
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-2"
            )}
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Email Support</span>
          </Button>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {mode === 'chatbot' ? (
            <motion.div
              key="chatbot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">AI Support Assistant</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Ask me anything about CircleIn - bookings, facilities, community, or account
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages Container */}
                  <div className="h-[400px] sm:h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
                        <motion.div
                          className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 cursor-pointer"
                          whileHover={{
                            scale: 1.05,
                            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <MessageCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Welcome to CircleIn Support!
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mb-6 px-2">
                          I'm your AI assistant, here to help with bookings, facilities, community questions, and more.
                        </p>
                        <div className="grid gap-2 w-full max-w-md px-2">
                          {[
                            'How do I book a facility?',
                            'What amenities are available?',
                            'How can I contact my neighbors?',
                            'Tell me about community events'
                          ].map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setInput(suggestion)}
                              className="px-4 py-3 text-left text-sm bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "flex gap-3",
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "px-4 py-3 rounded-2xl max-w-[80%]",
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                              )}
                            >
                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-900">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 transition-colors text-sm sm:text-base"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 max-w-3xl mx-auto">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Email Support</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Send us a message and we'll respond within 24 hours
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-900 dark:text-white font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="What can we help you with?"
                        required
                        className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-900 dark:text-white font-medium">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        placeholder="Please describe your issue or question in detail..."
                        required
                        rows={8}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 transition-colors resize-none"
                      />
                    </div>

                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span>
                          Your message will be sent securely to our support team. We typically respond within 24 hours.
                        </span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={emailSending}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg"
                    >
                      {emailSending ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
      </div>
    </div>
  );
}
