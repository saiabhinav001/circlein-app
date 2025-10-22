'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mail, Send, Bot, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });
  const [emailSending, setEmailSending] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  // Handle chatbot message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userRole: session?.user?.role || 'resident',
          conversationHistory: messages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or contact us via email.',
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
      // Add to Firestore 'mail' collection for Firebase Extension
      // Admin issues go to circleinapp1@gmail.com, Resident issues go to admin
      const recipientEmail = isAdmin ? 'circleinapp1@gmail.com' : 'abhinav.sadineni@gmail.com';
      
      await addDoc(collection(db, 'mail'), {
        to: recipientEmail,
        message: {
          subject: `[CircleIn Contact] ${emailForm.subject}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
                  .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                  .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📧 New Contact Form Submission</h1>
                  </div>
                  <div class="content">
                    <div class="info-box">
                      <p><strong>From:</strong> ${session?.user?.name || 'Unknown'}</p>
                      <p><strong>Email:</strong> ${session?.user?.email || 'Not provided'}</p>
                      <p><strong>Role:</strong> ${isAdmin ? 'Admin' : 'Resident'}</p>
                      <p><strong>Subject:</strong> ${emailForm.subject}</p>
                    </div>
                    
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap;">${emailForm.message}</p>
                    
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <em>This email was sent from the CircleIn Contact Us form.</em>
                    </p>
                  </div>
                  <div class="footer">
                    <p>© 2025 CircleIn Community Management</p>
                  </div>
                </div>
              </body>
            </html>
          `
        },
        createdAt: new Date()
      });

      toast.success('Message sent successfully!', {
        description: 'We\'ll get back to you as soon as possible.'
      });

      // Reset form
      setEmailForm({ subject: '', message: '' });
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 dark:text-slate-400 text-sm md:text-base"
          >
            Get instant help with our AI chatbot or send us a message
          </motion.p>
        </div>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 mb-6 justify-center"
        >
          <Button
            onClick={() => setMode('chatbot')}
            variant={mode === 'chatbot' ? 'default' : 'outline'}
            className={`flex items-center gap-2 px-6 py-6 text-base transition-all ${
              mode === 'chatbot'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-5 h-5" />
            AI Chatbot
          </Button>
          <Button
            onClick={() => setMode('email')}
            variant={mode === 'email' ? 'default' : 'outline'}
            className={`flex items-center gap-2 px-6 py-6 text-base transition-all ${
              mode === 'email'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email Support
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
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-500" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask me anything about CircleIn, bookings, amenities, or community features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Chat Messages */}
                  <div className="h-[400px] md:h-[500px] overflow-y-auto p-4 md:p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="w-16 h-16 text-blue-500 mb-4 opacity-50" />
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                          Hi! I'm your CircleIn AI assistant.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          Ask me about bookings, amenities, or any other questions!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    )}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 text-sm md:text-base"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
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
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-6 h-6 text-blue-500" />
                    Email Support
                  </CardTitle>
                  <CardDescription>
                    Send us a detailed message and we'll respond as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="subject" className="text-base font-medium">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="Brief description of your inquiry"
                        required
                        className="mt-2 text-sm md:text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-base font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        placeholder="Describe your issue or question in detail..."
                        required
                        rows={8}
                        className="mt-2 text-sm md:text-base"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                          Your message will be sent securely. We typically respond within 24 hours.
                        </span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={emailSending}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-base py-6"
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
