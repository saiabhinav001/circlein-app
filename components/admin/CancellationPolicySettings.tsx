'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Settings, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CancellationPolicy {
  enabled: boolean;
  hoursBeforeStart: number;
  refundPercentage: number;
  adminConfigured: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
}

export default function CancellationPolicySettings() {
  const { data: session } = useSession();
  const [policy, setPolicy] = useState<CancellationPolicy>({
    enabled: true,
    hoursBeforeStart: 24,
    refundPercentage: 100,
    adminConfigured: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const communityId = session?.user?.communityId || 'default-community';

  useEffect(() => {
    loadCancellationPolicy();
  }, [communityId]);

  const loadCancellationPolicy = async () => {
    try {
      setLoading(true);
      const policyRef = doc(db, 'communities', communityId, 'settings', 'cancellation-policy');
      const policySnap = await getDoc(policyRef);
      
      if (policySnap.exists()) {
        const data = policySnap.data();
        setPolicy({
          enabled: data.enabled ?? true,
          hoursBeforeStart: data.hoursBeforeStart ?? 24,
          refundPercentage: data.refundPercentage ?? 100,
          adminConfigured: data.adminConfigured ?? false,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.lastUpdatedAt?.toDate()
        });
      }
    } catch (error) {
      console.error('Error loading cancellation policy:', error);
      toast.error('Failed to load cancellation policy');
    } finally {
      setLoading(false);
    }
  };

  const saveCancellationPolicy = async () => {
    try {
      setSaving(true);
      const policyRef = doc(db, 'communities', communityId, 'settings', 'cancellation-policy');
      
      await setDoc(policyRef, {
        ...policy,
        adminConfigured: true,
        lastUpdatedBy: session?.user?.email,
        lastUpdatedAt: Timestamp.now()
      });
      
      toast.success('Cancellation policy updated successfully');
    } catch (error) {
      console.error('Error saving cancellation policy:', error);
      toast.error('Failed to save cancellation policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <p className="text-gray-600 dark:text-gray-400">Loading cancellation policy...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="shadow-xl border-0 bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Cancellation Policy Settings</CardTitle>
              <p className="text-orange-100 mt-1">Configure booking cancellation rules for your community</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Enable/Disable Policy */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div>
              <Label className="text-base font-semibold">Enable Cancellation Policy</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Allow residents to cancel their bookings with restrictions
              </p>
            </div>
            <Switch
              checked={policy.enabled}
              onCheckedChange={(checked) => setPolicy(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <Separator />

          {/* Hours Before Start */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <Label className="text-base font-semibold">Cancellation Deadline</Label>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                max="168"
                value={policy.hoursBeforeStart}
                onChange={(e) => setPolicy(prev => ({ 
                  ...prev, 
                  hoursBeforeStart: parseInt(e.target.value) || 24 
                }))}
                className="w-24"
                disabled={!policy.enabled}
              />
              <span className="text-gray-600 dark:text-gray-400">hours before booking start time</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Residents cannot cancel bookings within this time frame
            </p>
          </div>

          <Separator />

          {/* Refund Percentage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <Label className="text-base font-semibold">Refund Percentage</Label>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0"
                max="100"
                value={policy.refundPercentage}
                onChange={(e) => setPolicy(prev => ({ 
                  ...prev, 
                  refundPercentage: parseInt(e.target.value) || 100 
                }))}
                className="w-24"
                disabled={!policy.enabled}
              />
              <span className="text-gray-600 dark:text-gray-400">% refund for cancelled bookings</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Percentage of payment to refund when bookings are cancelled in time
            </p>
          </div>

          <Separator />

          {/* Policy Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Current Policy</h4>
              <Badge className="bg-blue-500 text-white">
                {policy.adminConfigured ? 'Custom' : 'Default'}
              </Badge>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>• Cancellation: {policy.enabled ? 'Enabled' : 'Disabled'}</p>
              <p>• Deadline: {policy.hoursBeforeStart} hours before start</p>
              <p>• Refund: {policy.refundPercentage}% of payment</p>
              {policy.lastUpdatedBy && (
                <p>• Last updated by: {policy.lastUpdatedBy}</p>
              )}
              {policy.lastUpdatedAt && (
                <p>• Updated on: {policy.lastUpdatedAt.toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={saveCancellationPolicy}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl h-12"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Policy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={loadCancellationPolicy}
              disabled={loading}
              className="px-6 rounded-xl h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}