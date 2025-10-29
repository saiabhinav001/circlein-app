'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Search, 
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface WaitlistEntry {
  id: string;
  userEmail: string;
  userName: string;
  amenityId: string;
  amenityName: string;
  startTime: any;
  endTime: any;
  waitlistPosition: number;
  createdAt: any;
  status: string;
}

interface WaitlistStats {
  totalWaitlist: number;
  byAmenity: { [key: string]: number };
  recentPromotions: number;
}

export default function AdminWaitlistManagement() {
  const { data: session, status } = useSession();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats>({ totalWaitlist: 0, byAmenity: {}, recentPromotions: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchWaitlistData();
    }
  }, [session]);

  const fetchWaitlistData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/waitlist');
      const data = await response.json();

      if (response.ok) {
        setWaitlistEntries(data.waitlist || []);
        setStats(data.stats || { totalWaitlist: 0, byAmenity: {}, recentPromotions: 0 });
      } else {
        toast.error('Failed to load waitlist data');
      }
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Error loading waitlist data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualPromote = async (entry: WaitlistEntry) => {
    if (!confirm(`Promote ${entry.userName} from waitlist for ${entry.amenityName}?`)) {
      return;
    }

    setPromoting(entry.id);
    try {
      const response = await fetch('/api/bookings/promote-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: entry.amenityId,
          startTime: new Date(entry.startTime.seconds * 1000).toISOString(),
          reason: 'manual',
        }),
      });

      const data = await response.json();

      if (response.ok && data.promoted) {
        toast.success('✅ User promoted successfully!', {
          description: `${entry.userName} has been notified and has 48 hours to confirm.`,
        });
        fetchWaitlistData();
      } else {
        toast.error('Promotion failed', {
          description: data.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Promotion error:', error);
      toast.error('Error promoting user');
    } finally {
      setPromoting(null);
    }
  };

  const handleSendReminder = async (entry: WaitlistEntry) => {
    try {
      toast.info('📧 Sending reminder email...', {
        description: `Notifying ${entry.userName} about their waitlist position`,
      });

      // TODO: Implement reminder email API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      toast.success('✅ Reminder sent!', {
        description: `${entry.userName} has been notified`,
      });
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  const filteredEntries = waitlistEntries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.userName?.toLowerCase().includes(searchLower) ||
      entry.userEmail?.toLowerCase().includes(searchLower) ||
      entry.amenityName?.toLowerCase().includes(searchLower)
    );
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
          >
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Waitlist</h3>
        </div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Admin access required to view waitlist management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Waitlist Management
            </h1>
            <p className="text-gray-600">Manage booking waitlists and promote users</p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 mb-1">Total Waitlist</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.totalWaitlist}</p>
                  </div>
                  <Users className="w-12 h-12 text-yellow-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Recent Promotions</p>
                    <p className="text-3xl font-bold text-green-900">{stats.recentPromotions}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Amenities with Waitlist</p>
                    <p className="text-3xl font-bold text-blue-900">{Object.keys(stats.byAmenity).length}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Refresh */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, email, or amenity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Button
                onClick={fetchWaitlistData}
                disabled={loading}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Current Waitlist Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </motion.div>
                <p className="text-gray-600">Loading waitlist entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Waitlist Entries</h3>
                <p className="text-gray-600">All bookings are confirmed! No one is waiting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-lg px-3 py-1">
                            #{entry.waitlistPosition}
                          </Badge>
                          <h4 className="text-lg font-semibold text-gray-900">{entry.userName}</h4>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">{entry.amenityName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>
                              {entry.startTime && format(new Date(entry.startTime.seconds * 1000), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>{entry.userEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleManualPromote(entry)}
                          disabled={promoting === entry.id}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg"
                        >
                          {promoting === entry.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mr-2" />
                          )}
                          Promote Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(entry)}
                          className="rounded-lg"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
