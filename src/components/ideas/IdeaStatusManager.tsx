
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';

interface IdeaStatusManagerProps {
  ideaId: string;
  currentStatus: string;
  currentPriority: string;
  currentProgress: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  isAdmin: boolean;
  isOwner: boolean;
}

const IdeaStatusManager: React.FC<IdeaStatusManagerProps> = ({
  ideaId,
  currentStatus,
  currentPriority,
  currentProgress,
  isOpen,
  onOpenChange,
  onUpdate,
  isAdmin,
  isOwner
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [progress, setProgress] = useState([currentProgress]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    'draft', 'submitted', 'in_review', 'approved', 
    'in_progress', 'completed', 'cancelled', 'on_hold'
  ];

  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  const handleUpdate = async () => {
    if (!isAdmin && !isOwner) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update this idea's status",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          status,
          priority_level: priority,
          progress_percentage: progress[0]
        })
        .eq('id', ideaId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_idea_activity', {
        p_idea_id: ideaId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action_type: 'status_changed',
        p_description: `Status updated to ${status}, priority to ${priority}, progress to ${progress[0]}%`
      });

      toast({
        title: "Status updated",
        description: "The idea status has been successfully updated"
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update idea status",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const canEdit = isAdmin || isOwner;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Idea Status</DialogTitle>
          <DialogDescription>
            Update the status, priority, and progress of this idea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <StatusBadge status={currentStatus} />
          </div>

          <div className="space-y-2">
            <Label>Current Priority</Label>
            <PriorityBadge priority={currentPriority} />
          </div>

          <div className="space-y-2">
            <Label>Current Progress</Label>
            <ProgressBar value={currentProgress} />
          </div>

          {canEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={option} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={option} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Progress ({progress[0]}%)</Label>
                <Slider
                  value={progress}
                  onValueChange={setProgress}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {canEdit && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IdeaStatusManager;
