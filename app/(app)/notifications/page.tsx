'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Search, 
  Filter, 
  Settings as SettingsIcon, 
  Check, 
  CheckCheck,
  Trash2,
  Clock,
  Star,
  Calendar,
  Users,
  Shield,
  AlertTriangle,
  Info,
  X,
  Archive,
  MoreVertical,
  SortDesc,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Heart,
  TrendingUp,
  Activity,
  MessageCircle,
  Home,
  TestTube
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Enhanced particle background
const ParticleBackground = () => {
  // Only render on client side to avoid window undefined error
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Floating notification counter with enhanced visibility
const FloatingCounter = ({ count, label }: { count: number; label: string }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    whileHover={{ scale: 1.1, y: -5 }}
    className="relative"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-600/30 rounded-2xl p-6 text-center min-w-[120px] shadow-xl">
      <motion.div 
        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm"
        key={count}
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{
          WebkitTextStroke: '0.5px rgba(59, 130, 246, 0.3)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}
      >
        {count}
      </motion.div>
      <div 
        className="text-sm font-semibold mt-1"
        style={{
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        }}
      >
        {label}
      </div>
    </div>
  </motion.div>
);

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'read'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  
  const { 
    notifications, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    addNotification
  } = useNotifications();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      const matchesSearch = !searchQuery || 
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
      
      const matchesViewMode = 
        viewMode === 'all' ||
        (viewMode === 'unread' && !notification.read) ||
        (viewMode === 'read' && notification.read);

      return matchesSearch && matchesCategory && matchesViewMode;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  // Notification categories with beautiful icons and colors
  const categories = [
    { key: 'all', label: 'All', icon: Sparkles, color: 'from-gray-400 to-gray-600', bgColor: 'from-gray-50 to-gray-100' },
    { key: 'booking', label: 'Bookings', icon: Calendar, color: 'from-blue-400 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
    { key: 'community', label: 'Community', icon: Users, color: 'from-green-400 to-green-600', bgColor: 'from-green-50 to-green-100' },
    { key: 'system', label: 'System', icon: SettingsIcon, color: 'from-purple-400 to-purple-600', bgColor: 'from-purple-50 to-purple-100' },
    { key: 'maintenance', label: 'Maintenance', icon: Shield, color: 'from-orange-400 to-orange-600', bgColor: 'from-orange-50 to-orange-100' },
    { key: 'payment', label: 'Payment', icon: Star, color: 'from-yellow-400 to-yellow-600', bgColor: 'from-yellow-50 to-yellow-100' },
  ];

  // Get notification styles with beautiful gradients
  const getNotificationStyles = (notification: any, isSelected: boolean) => {
    let baseStyles = "group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl";
    
    if (isSelected) {
      baseStyles += " ring-4 ring-blue-500/50 scale-[1.02]";
    }
    
    if (!notification.read) {
      baseStyles += " bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20 border-l-4 border-l-blue-500 shadow-lg";
    } else {
      baseStyles += " bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-md";
    }
    
    return baseStyles;
  };

  // Get priority badge with beautiful animations
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative"
          >
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">
              <AlertTriangle className="h-3 w-3 mr-1" />
              URGENT
            </Badge>
          </motion.div>
        );
      case 'high':
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
            <TrendingUp className="h-3 w-3 mr-1" />
            HIGH
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md">
            <Activity className="h-3 w-3 mr-1" />
            MEDIUM
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            LOW
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Handle bulk actions with animations
  const handleBulkMarkAsRead = async () => {
    for (const id of selectedNotifications) {
      await markAsRead(id);
    }
    setSelectedNotifications([]);
    toast({
      title: "✅ Marked as Read",
      description: `${selectedNotifications.length} notifications marked as read`,
    });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await removeNotification(id);
    }
    setSelectedNotifications([]);
    toast({
      title: "🗑️ Deleted",
      description: `${selectedNotifications.length} notifications deleted`,
    });
  };

  // Clear all with spectacular animation
  const handleClearAllWithAnimation = async () => {
    const notificationCards = document.querySelectorAll('[data-notification-card]');
    
    // Create a wave effect
    notificationCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-scale-out');
      }, index * 100);
    });

    setTimeout(async () => {
      await clearAll();
      toast({
        title: "✨ All Clear!",
        description: "All notifications have been cleared",
      });
    }, notificationCards.length * 100 + 500);
  };

  // Test notification functions
  const testNotification = () => {
    const examples = [
      { title: '🎉 Welcome!', message: 'Welcome to our amazing notification system!', type: 'success', priority: 'medium' },
      { title: '📅 Booking Confirmed', message: 'Your amenity booking has been confirmed', type: 'success', priority: 'high' },
      { title: '🚨 Urgent Alert', message: 'This is an urgent system notification', type: 'error', priority: 'urgent' },
      { title: '💰 Payment Received', message: 'Your payment has been processed successfully', type: 'success', priority: 'low' },
    ];
    
    const random = examples[Math.floor(Math.random() * examples.length)];
    addNotification({
      title: random.title,
      message: random.message,
      type: random.type as any,
      priority: random.priority as any,
      category: 'system',
      autoHide: true,
      duration: 6000
    });
    
    toast({
      title: "🧪 Test Sent!",
      description: "Check your notification panel",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated background */}
      <ParticleBackground />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 container mx-auto p-4 sm:p-6 max-w-7xl"
      >
        {/* Spectacular Header - Fully Responsive */}
        <motion.div 
          variants={itemVariants}
          className="text-center mb-8 sm:mb-12 relative"
        >
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute -top-6 sm:-top-10 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20"></div>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
            className="relative inline-block mb-4 sm:mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 sm:p-4 rounded-full">
              <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 drop-shadow-sm"
            style={{
              textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
              WebkitTextStroke: '0.5px rgba(59, 130, 246, 0.1)'
            }}
          >
            Notification Center
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-lg md:text-xl font-medium mb-8 max-w-2xl mx-auto"
            style={{
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className="text-white" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              Stay connected with real-time updates, important announcements, and community activities 
              tailored for your residential community management needs.
            </span>
          </motion.p>

          {/* Floating counters - Fully Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex justify-center gap-3 sm:gap-4 lg:gap-6 flex-wrap px-4"
          >
            <FloatingCounter count={notifications.length} label="Total" />
            <FloatingCounter count={unreadCount} label="Unread" />
            <FloatingCounter 
              count={notifications.filter(n => new Date(n.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} 
              label="This Week" 
            />
            <FloatingCounter 
              count={notifications.filter(n => n.priority === 'urgent').length} 
              label="Urgent" 
            />
          </motion.div>
        </motion.div>

        {/* Test Buttons - Responsive */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap px-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={testNotification}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg text-sm sm:text-base"
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Test Notification
            </Button>
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={markAllAsRead}
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base"
              >
                <CheckCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Mark All Read
              </Button>
            </motion.div>
          )}
          
          {notifications.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleClearAllWithAnimation}
                variant="outline"
                className="border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Clear All
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content Grid - Fully Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Beautiful Sidebar - Responsive */}
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-200/20 p-4 lg:p-6">
                <CardTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Filter className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                  <span className="text-white dark:text-white" style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    Categories
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="space-y-2 lg:space-y-3">
                  {categories.map(({ key, label, icon: Icon, color, bgColor }, index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={selectedCategory === key ? "default" : "ghost"}
                        onClick={() => setSelectedCategory(key)}
                        className={cn(
                          "w-full justify-start h-12 lg:h-14 rounded-xl transition-all duration-300",
                          selectedCategory === key 
                            ? `bg-gradient-to-r ${color} text-white shadow-lg` 
                            : `hover:bg-gradient-to-r hover:${bgColor} dark:hover:from-gray-700 dark:hover:to-gray-600`
                        )}
                      >
                        <Icon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 flex-shrink-0" />
                        <span 
                          className="font-semibold text-sm lg:text-base"
                          style={{
                            color: selectedCategory === key ? '#ffffff' : '#ffffff',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                          }}
                        >
                          {label}
                        </span>
                        {key !== 'all' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <Badge variant="secondary" className="bg-white/20 text-inherit border-0 text-xs ml-2">
                              {notifications.filter(n => n.category === key).length}
                            </Badge>
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Notifications Area - Responsive */}
          <motion.div variants={itemVariants} className="xl:col-span-3">
            {/* Search and Controls */}
            <Card className="backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border-0 shadow-2xl rounded-3xl mb-6 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Beautiful Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-2 border-gray-200/50 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    />
                  </div>

                  {/* View Mode Tabs */}
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="shrink-0">
                    <TabsList className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                      <TabsTrigger value="all" className="rounded-lg px-6">All</TabsTrigger>
                      <TabsTrigger value="unread" className="rounded-lg px-6">Unread</TabsTrigger>
                      <TabsTrigger value="read" className="rounded-lg px-6">Read</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Sort Dropdown - Enhanced with Icons and Descriptions */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 h-12 rounded-xl border-2 border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-600/70 transition-all">
                      <div className="flex items-center gap-2 w-full">
                        <SortDesc className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 p-1 min-w-[220px]">
                      <SelectItem value="newest" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">Newest First</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 truncate">Recent first</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="oldest" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                            <Archive className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">Oldest First</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 truncate">Historical first</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="priority" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                            <Star className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">By Priority</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300 truncate">Important first</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Actions */}
                <AnimatePresence>
                  {selectedNotifications.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50"
                    >
                      <span className="text-sm font-medium" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
                        {selectedNotifications.length} notification(s) selected
                      </span>
                      <Button size="sm" onClick={handleBulkMarkAsRead} className="bg-green-500 hover:bg-green-600 text-white">
                        <Check className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedNotifications([])}>
                        Cancel
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <Card className="backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border-0 shadow-2xl rounded-3xl overflow-hidden">
                      <CardContent className="p-12">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Bell className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                        </motion.div>
                        <h3 
                          className="text-xl md:text-2xl font-bold mb-3 drop-shadow-lg"
                          style={{
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            color: '#ffffff'
                          }}
                        >
                          {searchQuery || selectedCategory !== 'all' || viewMode !== 'all' 
                            ? 'No matching notifications' 
                            : 'All caught up!'}
                        </h3>
                        <p 
                          className="text-base md:text-lg font-medium"
                          style={{
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                            color: '#e5e7eb'
                          }}
                        >
                          {searchQuery || selectedCategory !== 'all' || viewMode !== 'all'
                            ? 'Try adjusting your filters or search terms'
                            : 'You\'re all up to date with your notifications'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notification, index) => {
                    const isSelected = selectedNotifications.includes(notification.id);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        data-notification-card
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, scale: 0.8 }}
                        transition={{ 
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }}
                        whileHover={{ y: -5 }}
                        className={getNotificationStyles(notification, isSelected)}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative p-3 sm:p-4 md:p-6">
                          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                            {/* Selection Checkbox */}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleNotificationSelection(notification.id)}
                                className="mt-1 sm:mt-2 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </motion.div>

                            {/* Notification Icon */}
                            <motion.div 
                              className="flex-shrink-0 mt-1"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl shadow-lg">
                                {notification.type === 'booking' ? '📅' : 
                                 notification.type === 'community' ? '🏢' :
                                 notification.type === 'system' ? '⚙️' :
                                 notification.priority === 'urgent' ? '🚨' :
                                 notification.priority === 'high' ? '⚡' : '💬'}
                              </div>
                            </motion.div>

                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="flex-1">
                                  <h3 
                                    className="font-bold text-sm sm:text-base md:text-lg lg:text-xl leading-tight mb-1 sm:mb-2 flex items-center gap-2"
                                    style={{
                                      color: '#ffffff',
                                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                    }}
                                  >
                                    {notification.title}
                                    {!notification.read && (
                                      <motion.span 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full shadow-md"
                                      ></motion.span>
                                    )}
                                  </h3>
                                  <p 
                                    className="text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed font-medium"
                                    style={{
                                      color: '#e5e7eb',
                                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                                      filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))'
                                    }}
                                  >
                                    {notification.message}
                                  </p>
                                </div>

                                {/* Priority and Actions */}
                                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                                  {getPriorityBadge(notification.priority)}
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 sm:p-2">
                                          <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </motion.div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-0 shadow-2xl bg-white/90 backdrop-blur-md">
                                      <DropdownMenuItem onClick={() => markAsRead(notification.id)} className="rounded-lg">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => removeNotification(notification.id)} className="rounded-lg text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm font-medium">
                                  <span 
                                    className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm"
                                    style={{
                                      color: '#ffffff',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                                    }}
                                  >
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-semibold">
                                      {new Date(notification.timestamp).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className="border-gray-300 dark:border-gray-600 rounded-full font-semibold bg-white/80 dark:bg-gray-800/80 text-xs px-2 py-0.5"
                                    style={{
                                      color: '#ffffff',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                                    }}
                                  >
                                    {notification.category}
                                  </Badge>
                                </div>

                                {notification.actionUrl && (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Link href={notification.actionUrl}>
                                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                                        View Details
                                      </Button>
                                    </Link>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes scale-out {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.8) translateX(100%);
          }
        }
        
        .animate-scale-out {
          animation: scale-out 0.6s ease-in-out forwards;
        }

        /* Enhanced text visibility for all themes */
        .text-enhanced-primary {
          color: rgb(17 24 39);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dark .text-enhanced-primary {
          color: rgb(243 244 246);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        
        .text-enhanced-secondary {
          color: rgb(55 65 81 / 0.9);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .dark .text-enhanced-secondary {
          color: rgb(209 213 219 / 0.9);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .text-enhanced-muted {
          color: rgb(75 85 99);
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
        }
        
        .dark .text-enhanced-muted {
          color: rgb(156 163 175);
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}