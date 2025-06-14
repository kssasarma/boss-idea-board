import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import filterOptions from '@/config/filterOptions.json';
import type { Tables } from '@/integrations/supabase/types';

interface EditIdeaFormProps {
  idea: Tables<'ideas'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdeaUpdated: () => void;
  userId: string;
  isAdmin: boolean;
}

const EditIdeaForm: React.FC<EditIdeaFormProps> = ({
  idea,
  open,
  onOpenChange,
  onIdeaUpdated,
  userId,
  isAdmin
}) => {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description || '');
  const [businessUnit, setBusinessUnit] = useState(idea.business_unit || '');
  const [expectedStartDate, setExpectedStartDate] = useState(idea.expected_start_date || '');
  const [expectedEndDate, setExpectedEndDate] = useState(idea.expected_end_date || '');
  const [techstack, setTechstack] = useState<string[]>(idea.techstack || []);
  const [status, setStatus] = useState(idea.status || 'draft');
  const [priority, setPriority] = useState(idea.priority_level || 'medium');
  const [progress, setProgress] = useState([idea.progress_percentage || 0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    'draft', 'submitted', 'in_review', 'approved', 
    'in_progress', 'completed', 'cancelled', 'on_hold'
  ];

  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  // Reset form when idea changes
  useEffect(() => {
    setTitle(idea.title);
    setDescription(idea.description || '');
    setBusinessUnit(idea.business_unit || '');
    setExpectedStartDate(idea.expected_start_date || '');
    setExpectedEndDate(idea.expected_end_date || '');
    setTechstack(idea.techstack || []);
    setStatus(idea.status || 'draft');
    setPriority(idea.priority_level || 'medium');
    setProgress([idea.progress_percentage || 0]);
  }, [idea]);

  const handleTechStackChange = (selectedTech: string) => {
    if (selectedTech && !techstack.includes(selectedTech)) {
      setTechstack([...techstack, selectedTech]);
    }
  };

  const removeTech = (tech: string) => {
    setTechstack(techstack.filter(t => t !== tech));
  };

  const canEdit = isAdmin || idea.created_by === userId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to edit this idea",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          business_unit: businessUnit === 'none' ? null : businessUnit || null,
          expected_start_date: expectedStartDate || null,
          expected_end_date: expectedEndDate || null,
          techstack: techstack.length > 0 ? techstack : null,
          status,
          priority_level: priority,
          progress_percentage: progress[0]
        })
        .eq('id', idea.id);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_idea_activity', {
        p_idea_id: idea.id,
        p_user_id: userId,
        p_action_type: 'idea_updated',
        p_description: `Idea updated: ${title}`
      });

      toast({
        title: "Idea updated",
        description: "The idea has been successfully updated"
      });

      onIdeaUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({
        title: "Error",
        description: "Failed to update idea. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  if (!canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>View Idea Details</DialogTitle>
            <DialogDescription>
              You can view the idea details but don't have permission to edit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="font-medium">Title</Label>
              <p className="mt-1 text-sm">{idea.title}</p>
            </div>
            
            {idea.description && (
              <div>
                <Label className="font-medium">Description</Label>
                <p className="mt-1 text-sm text-gray-600">{idea.description}</p>
              </div>
            )}
            
            {idea.business_unit && (
              <div>
                <Label className="font-medium">Business Unit</Label>
                <p className="mt-1 text-sm">{idea.business_unit}</p>
              </div>
            )}
            
            {idea.techstack && idea.techstack.length > 0 && (
              <div>
                <Label className="font-medium">Tech Stack</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {idea.techstack.map((tech, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Idea</DialogTitle>
          <DialogDescription>
            Update all aspects of your idea including details, status, and progress.
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
                <SelectItem value="none">No business unit</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
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
                <SelectContent className="bg-white">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Updating..." : "Update Idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditIdeaForm;
