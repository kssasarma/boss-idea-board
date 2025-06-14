import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import filterOptions from '@/config/filterOptions.json';

interface CreateIdeaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdeaCreated: () => void;
  userId: string;
}

const CreateIdeaForm: React.FC<CreateIdeaFormProps> = ({
  open,
  onOpenChange,
  onIdeaCreated,
  userId
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [techstack, setTechstack] = useState<string[]>([]);
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(true);
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTechStackChange = (selectedTech: string) => {
    if (selectedTech && !techstack.includes(selectedTech)) {
      setTechstack([...techstack, selectedTech]);
    }
  };

  const removeTech = (tech: string) => {
    setTechstack(techstack.filter(t => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: ideaData, error: ideaError } = await supabase.from('ideas').insert({
        title: title.trim(),
        description: description.trim() || null,
        business_unit: businessUnit || null,
        expected_start_date: expectedStartDate || null,
        expected_end_date: expectedEndDate || null,
        techstack: techstack.length > 0 ? techstack : null,
        created_by: userId
      }).select().single();

      if (ideaError) {
        throw ideaError;
      }

      // Auto-subscribe the creator to their own idea if they want updates
      if (subscribeToUpdates && ideaData) {
        await supabase.from('idea_subscriptions').insert({
          user_id: userId,
          idea_id: ideaData.id,
          subscription_type: 'all'
        });

        // Create email preferences if enabled
        if (enableEmailNotifications) {
          await supabase.from('email_preferences').insert({
            user_id: userId,
            idea_id: ideaData.id,
            notification_types: ['status_change', 'comments', 'updates'],
            is_active: true
          });
        }
      }

      toast({
        title: "Idea created!",
        description: "Your idea has been successfully submitted to the board."
      });

      // Reset form
      setTitle('');
      setDescription('');
      setBusinessUnit('');
      setExpectedStartDate('');
      setExpectedEndDate('');
      setTechstack([]);
      setSubscribeToUpdates(true);
      setEnableEmailNotifications(true);
      onOpenChange(false);
      onIdeaCreated();
    } catch (error) {
      console.error('Error creating idea:', error);
      toast({
        title: "Error",
        description: "Failed to create idea. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Idea</DialogTitle>
          <DialogDescription>
            Share your innovative idea with the team. Fill out the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your idea title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea in detail..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessUnit">Business Unit</Label>
            <Select value={businessUnit} onValueChange={setBusinessUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business unit" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions.businessUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Expected Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={expectedStartDate}
                onChange={(e) => setExpectedStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Expected End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tech Stack</Label>
            <Select value="" onValueChange={handleTechStackChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select technology" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions.techStacks
                  .filter(tech => !techstack.includes(tech))
                  .map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {techstack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {techstack.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tech}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTech(tech)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-medium">Notification Preferences</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="subscribe"
                  checked={subscribeToUpdates}
                  onCheckedChange={(checked) => setSubscribeToUpdates(!!checked)}
                />
                <Label htmlFor="subscribe" className="text-sm">
                  Subscribe to updates for this idea
                </Label>
              </div>
              
              {subscribeToUpdates && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="emailNotifications"
                    checked={enableEmailNotifications}
                    onCheckedChange={(checked) => setEnableEmailNotifications(!!checked)}
                  />
                  <Label htmlFor="emailNotifications" className="text-sm text-gray-600">
                    Enable email notifications for status changes, comments, and updates
                  </Label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIdeaForm;
