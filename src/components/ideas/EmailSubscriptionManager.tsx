
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailSubscriptionManagerProps {
  ideaId: string;
  ideaTitle: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailSubscriptionManager: React.FC<EmailSubscriptionManagerProps> = ({
  ideaId,
  ideaTitle,
  userId,
  open,
  onOpenChange
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { toast } = useToast();

  const notificationTypes = [
    { id: 'status_change', label: 'Status Changes', description: 'When the idea status changes' },
    { id: 'comments', label: 'New Comments', description: 'When someone comments on the idea' },
    { id: 'updates', label: 'General Updates', description: 'When the idea is modified' }
  ];

  useEffect(() => {
    if (open) {
      loadSubscriptionData();
    }
  }, [open, ideaId, userId]);

  const loadSubscriptionData = async () => {
    setInitializing(true);
    try {
      // Check if user is subscribed to the idea
      const { data: subscription } = await supabase
        .from('idea_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('idea_id', ideaId)
        .single();

      setIsSubscribed(!!subscription);

      // Load email preferences
      const { data: preferences } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('idea_id', ideaId)
        .single();

      if (preferences) {
        setEmailPreferences(preferences.notification_types || []);
        setIsActive(preferences.is_active);
      } else {
        // Default preferences
        setEmailPreferences(['status_change', 'comments', 'updates']);
        setIsActive(true);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
    setInitializing(false);
  };

  const handleSubscriptionToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        await supabase
          .from('idea_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('idea_id', ideaId);

        // Also remove email preferences
        await supabase
          .from('email_preferences')
          .delete()
          .eq('user_id', userId)
          .eq('idea_id', ideaId);

        setIsSubscribed(false);
        toast({
          title: "Unsubscribed",
          description: "You will no longer receive notifications for this idea."
        });
      } else {
        // Subscribe
        await supabase
          .from('idea_subscriptions')
          .insert({
            user_id: userId,
            idea_id: ideaId,
            subscription_type: 'all'
          });

        // Create email preferences
        await supabase
          .from('email_preferences')
          .insert({
            user_id: userId,
            idea_id: ideaId,
            notification_types: emailPreferences,
            is_active: isActive
          });

        setIsSubscribed(true);
        toast({
          title: "Subscribed",
          description: "You will now receive notifications for this idea."
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handlePreferenceChange = (type: string, checked: boolean) => {
    setEmailPreferences(prev => 
      checked 
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleSavePreferences = async () => {
    if (!isSubscribed) return;

    setLoading(true);
    try {
      await supabase
        .from('email_preferences')
        .upsert({
          user_id: userId,
          idea_id: ideaId,
          notification_types: emailPreferences,
          is_active: isActive
        }, {
          onConflict: 'user_id,idea_id'
        });

      toast({
        title: "Preferences updated",
        description: "Your email notification preferences have been saved."
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  if (initializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </DialogTitle>
          <DialogDescription>
            Manage your email notifications for "{ideaTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-blue-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <Label className="text-base font-medium">
                  {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                </Label>
                <p className="text-sm text-gray-600">
                  {isSubscribed 
                    ? 'You will receive notifications for this idea'
                    : 'Subscribe to receive notifications for this idea'
                  }
                </p>
              </div>
            </div>
            <Button
              variant={isSubscribed ? "outline" : "default"}
              onClick={handleSubscriptionToggle}
              disabled={loading}
            >
              {loading ? "..." : (isSubscribed ? "Unsubscribe" : "Subscribe")}
            </Button>
          </div>

          {/* Email Preferences */}
          {isSubscribed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Email Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="email-active" className="text-sm">
                    {isActive ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="email-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              {isActive && (
                <div className="space-y-3">
                  <Label className="text-sm text-gray-600">
                    Choose which notifications you want to receive:
                  </Label>
                  {notificationTypes.map((type) => (
                    <div key={type.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={type.id}
                        checked={emailPreferences.includes(type.id)}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(type.id, !!checked)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={type.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type.label}
                        </Label>
                        <p className="text-xs text-gray-600">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isSubscribed && (
            <Button onClick={handleSavePreferences} disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailSubscriptionManager;
