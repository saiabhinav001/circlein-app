'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  Mail, 
  Send, 
  User,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  HelpCircle,
  Calendar,
  CreditCard,
  Settings,
  MessageCircle
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { useNotifications } from '@/components/notifications/notification-system'

// ============================================================================
// TYPES
// ============================================================================

type SupportMode = 'ai' | 'email'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface SuggestedQuestion {
  icon: React.ElementType
  label: string
  question: string
}

interface SupportTicket {
  id: string
  reference?: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string
  category?: string
  createdAt?: string | null
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    icon: Calendar,
    label: 'Bookings',
    question: 'How do I book an amenity?'
  },
  {
    icon: CreditCard,
    label: 'Payments',
    question: 'How do I view my payment history?'
  },
  {
    icon: Settings,
    label: 'Account',
    question: 'How do I update my profile settings?'
  },
  {
    icon: HelpCircle,
    label: 'General',
    question: 'What features are available to residents?'
  }
]

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
}

const SUPPORT_STATUS_BADGE_STYLES: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContactPage() {
  const { data: session } = useSession()
  const { addNotification } = useNotifications()
  
  // Support mode state
  const [mode, setMode] = useState<SupportMode>('ai')
  
  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  })
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [submittedTicketReference, setSubmittedTicketReference] = useState<string | null>(null)
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const loadRecentTickets = useCallback(async () => {
    if (!session?.user?.email) {
      return
    }

    try {
      setIsLoadingTickets(true)
      const response = await fetch('/api/contact/tickets', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load support tickets')
      }

      setRecentTickets(Array.isArray(payload?.tickets) ? payload.tickets : [])
    } catch (error) {
      console.error('Failed to load support tickets:', error)
      setRecentTickets([])
    } finally {
      setIsLoadingTickets(false)
    }
  }, [session?.user?.email])

  useEffect(() => {
    if (mode === 'email') {
      void loadRecentTickets()
    }
  }, [mode, loadRecentTickets])

  // ============================================================================
  // AI CHAT HANDLERS
  // ============================================================================

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue. Please try again.',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again or use email support.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  // ============================================================================
  // EMAIL HANDLERS
  // ============================================================================

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return

    setIsSubmittingEmail(true)

    try {
      const response = await fetch('/api/contact/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailForm.subject,
          message: emailForm.message
        })
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create support ticket')
      }

      const ticketReference = payload?.ticket?.reference || payload?.ticket?.id?.slice?.(0, 8)?.toUpperCase?.() || null
      setSubmittedTicketReference(ticketReference)

      await loadRecentTickets()

      // Add persistent notification
      addNotification({
        type: 'system',
        priority: 'normal',
        title: 'Support request submitted',
        message: ticketReference
          ? `Ticket ${ticketReference} has been created. We'll respond within 24-48 hours.`
          : `Your support ticket "${emailForm.subject}" has been submitted. We'll respond within 24-48 hours.`
      })

      // Optional toast for immediate feedback
      toast.success(ticketReference ? `Ticket ${ticketReference} submitted` : 'Support ticket submitted')

      setEmailSubmitted(true)
      setEmailForm({ subject: '', message: '' })
    } catch (error) {
      console.error('Email error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  const handleNewEmailRequest = () => {
    setSubmittedTicketReference(null)
    setEmailSubmitted(false)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* ================================================================
            HEADER - Subtle, not hero-style
        ================================================================ */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Support
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                We&apos;re here to help
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================
            SEGMENTED CONTROL - Pixel-perfect transitions
        ================================================================ */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex w-full sm:w-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setMode('ai')}
              className="relative flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors duration-200
                flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-0 sm:min-w-[170px]"
            >
              <motion.div
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                initial={false}
                animate={{
                  opacity: mode === 'ai' ? 1 : 0,
                  scale: mode === 'ai' ? 1 : 0.95
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
              />
              <span className={`relative z-10 flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 ${
                mode === 'ai' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
                <Bot className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">AI Assistant</span>
                <span className="hidden xs:inline text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Instant</span>
              </span>
            </button>
            
            <button
              onClick={() => setMode('email')}
              className="relative flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-colors duration-200
                flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-0 sm:min-w-[170px]"
            >
              <motion.div
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                initial={false}
                animate={{
                  opacity: mode === 'email' ? 1 : 0,
                  scale: mode === 'email' ? 1 : 0.95
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
              />
              <span className={`relative z-10 flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 ${
                mode === 'email' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Email Support</span>
                <span className="hidden xs:inline text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Human</span>
              </span>
            </button>
          </div>
        </div>

        {/* ================================================================
            SUPPORT PANELS
        ================================================================ */}
        <AnimatePresence mode="wait">
          {mode === 'ai' ? (
            <motion.div
              key="ai-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AIChatPanel
                messages={messages}
                inputValue={inputValue}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
                chatInputRef={chatInputRef}
                onInputChange={setInputValue}
                onSendMessage={handleSendMessage}
                onKeyDown={handleKeyDown}
                onSuggestedQuestion={handleSuggestedQuestion}
              />
            </motion.div>
          ) : (
            <motion.div
              key="email-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EmailPanel
                form={emailForm}
                isSubmitting={isSubmittingEmail}
                isSubmitted={emailSubmitted}
                submittedTicketReference={submittedTicketReference}
                userEmail={session?.user?.email}
                tickets={recentTickets}
                isLoadingTickets={isLoadingTickets}
                onFormChange={setEmailForm}
                onSubmit={handleEmailSubmit}
                onNewRequest={handleNewEmailRequest}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

// ============================================================================
// AI CHAT PANEL COMPONENT
// ============================================================================

interface AIChatPanelProps {
  messages: ChatMessage[]
  inputValue: string
  isTyping: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  onInputChange: (value: string) => void
  onSendMessage: (content: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSuggestedQuestion: (question: string) => void
}

function AIChatPanel({
  messages,
  inputValue,
  isTyping,
  messagesEndRef,
  chatInputRef,
  onInputChange,
  onSendMessage,
  onKeyDown,
  onSuggestedQuestion
}: AIChatPanelProps) {
  const hasMessages = messages.length > 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* Chat Messages Area */}
      <div className="h-[320px] sm:h-[400px] lg:h-[480px] overflow-y-auto">
        {!hasMessages ? (
          // Welcome State
          <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 sm:mb-4">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1">
              Hi, I&apos;m CircleIn Assistant
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mb-4 sm:mb-6 max-w-sm px-4">
              I can help you with bookings, account questions, and navigating the platform.
            </p>
            
            {/* Suggested Questions */}
            <div className="w-full max-w-md space-y-2 px-2">
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 sm:mb-3 text-center">
                Suggested questions
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {SUGGESTED_QUESTIONS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onSuggestedQuestion(item.question)}
                    className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800 
                             hover:bg-gray-100 dark:hover:bg-gray-750 
                             border border-gray-100 dark:border-gray-700
                             text-left transition-colors group"
                  >
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages List
          <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Pixel-perfect alignment */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 sm:p-4">
        <div className="flex gap-3">
          <textarea
            ref={chatInputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 min-w-0 h-12 px-4 py-3
                     bg-gray-50 dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 
                     rounded-xl resize-none
                     text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
                     transition-shadow leading-[1.5]"
          />
          <button
            onClick={() => onSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="flex-shrink-0 w-12 h-12 rounded-xl 
                     bg-gray-900 dark:bg-white 
                     text-white dark:text-gray-900
                     inline-flex items-center justify-center
                     hover:bg-gray-800 dark:hover:bg-gray-100
                     active:scale-[0.97]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                     transition-all duration-150"
          >
            {isTyping ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Send className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CHAT MESSAGE BUBBLE COMPONENT
// ============================================================================

interface ChatMessageBubbleProps {
  message: ChatMessage
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`
        w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser 
          ? 'bg-gray-900 dark:bg-white' 
          : 'bg-gray-100 dark:bg-gray-800'
        }
      `}>
        {isUser ? (
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-gray-900" />
        ) : (
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`
        max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3
        ${isUser 
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-md' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-md'
        }
      `}>
        {isUser ? (
          <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-1 prose-ul:my-1 prose-li:my-0
                        prose-headings:text-gray-900 dark:prose-headings:text-white">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// EMAIL PANEL COMPONENT
// ============================================================================

interface EmailPanelProps {
  form: { subject: string; message: string }
  isSubmitting: boolean
  isSubmitted: boolean
  submittedTicketReference?: string | null
  userEmail?: string | null
  tickets: SupportTicket[]
  isLoadingTickets: boolean
  onFormChange: (form: { subject: string; message: string }) => void
  onSubmit: (e: React.FormEvent) => void
  onNewRequest: () => void
}

function EmailPanel({
  form,
  isSubmitting,
  isSubmitted,
  submittedTicketReference,
  userEmail,
  tickets,
  isLoadingTickets,
  onFormChange,
  onSubmit,
  onNewRequest
}: EmailPanelProps) {
  if (isSubmitted) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-12">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Message sent
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
            We&apos;ll respond to your request within 24-48 hours. You can check your notifications for updates.
          </p>
          {submittedTicketReference && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
              Ticket reference: <span className="font-medium text-gray-800 dark:text-gray-200">{submittedTicketReference}</span>
            </p>
          )}
          <button
            onClick={onNewRequest}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 
                     bg-gray-100 dark:bg-gray-800 
                     hover:bg-gray-200 dark:hover:bg-gray-700
                     text-gray-900 dark:text-white
                     rounded-xl font-medium text-sm transition-colors"
          >
            Send another message
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* Header Info */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Email Support
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Response within 24-48 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* From (readonly) */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            From
          </label>
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
            {userEmail || 'Your email address'}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={form.subject}
            onChange={(e) => onFormChange({ ...form, subject: e.target.value })}
            placeholder="Brief description of your issue"
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 
                     rounded-lg sm:rounded-xl text-sm text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
                     transition-shadow"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Message
          </label>
          <textarea
            id="message"
            value={form.message}
            onChange={(e) => onFormChange({ ...form, message: e.target.value })}
            placeholder="Describe your question or issue in detail..."
            required
            rows={5}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 
                     rounded-lg sm:rounded-xl text-sm text-gray-900 dark:text-white resize-none
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
                     transition-shadow"
          />
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
            Include relevant details like booking dates, amenity names, or error messages.
          </p>
        </div>

        <div className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">Recent tickets</h4>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Last 4</span>
          </div>

          {isLoadingTickets ? (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading support history...</p>
          ) : tickets.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No support tickets yet.</p>
          ) : (
            <div className="space-y-2">
              {tickets.slice(0, 4).map((ticket) => {
                const statusKey = String(ticket.status || 'open')
                const statusLabel = SUPPORT_STATUS_LABELS[statusKey] || statusKey
                const statusClass = SUPPORT_STATUS_BADGE_STYLES[statusKey] || SUPPORT_STATUS_BADGE_STYLES.open

                return (
                  <div key={ticket.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{ticket.subject}</p>
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {ticket.reference || ticket.id.slice(0, 8).toUpperCase()}
                      {ticket.createdAt ? ` • ${new Date(ticket.createdAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !form.subject.trim() || !form.message.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5
                   bg-gray-900 dark:bg-white 
                   hover:bg-gray-800 dark:hover:bg-gray-100
                   text-white dark:text-gray-900
                   rounded-lg sm:rounded-xl font-medium text-sm
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  )
}
