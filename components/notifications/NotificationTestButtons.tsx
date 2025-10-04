'use client';

import { Button } from "@/components/ui/button";
import { useRealNotificationTriggers } from "@/components/notifications/EnhancedNotificationListener";

export function NotificationTestButtons() {
  const { 
    triggerBookingConfirmation, 
    triggerPaymentReminder, 
    triggerMaintenanceAlert, 
    triggerCommunityEvent 
  } = useRealNotificationTriggers();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Button
        onClick={() => triggerBookingConfirmation(
          'Swimming Pool', 
          new Date(Date.now() + 24 * 60 * 60 * 1000), 
          'booking-123'
        )}
        className="w-full"
      >
        🎉 Test Booking Confirmation
      </Button>
      
      <Button
        onClick={() => triggerPaymentReminder(
          250, 
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        )}
        variant="destructive"
        className="w-full"
      >
        💰 Test Payment Reminder
      </Button>
      
      <Button
        onClick={() => triggerMaintenanceAlert(
          'Elevator A', 
          '2 hours'
        )}
        variant="outline"
        className="w-full"
      >
        🔧 Test Maintenance Alert
      </Button>
      
      <Button
        onClick={() => triggerCommunityEvent(
          'Movie Night', 
          '8:00 PM', 
          'Community Hall'
        )}
        variant="secondary"
        className="w-full"
      >
        🎬 Test Community Event
      </Button>
    </div>
  );
}