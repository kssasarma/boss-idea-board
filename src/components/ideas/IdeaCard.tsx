
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Calendar, Building2, Code, Trash2, Settings, TrendingUp, Edit, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import IdeaStatusManager from './IdeaStatusManager';
import EditIdeaForm from './EditIdeaForm';
import EmailSubscriptionManager from './EmailSubscriptionManager';
import type { Tables } from '@/integrations/supabase/types';

interface IdeaCardProps {
  idea: Tables<'ideas'>;
  currentUserId?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isAdmin?: boolean;
  onLikeChange: () => void;
  onCommentClick: () => void;
  onIdeaDeleted?: () => void;
  onIdeaClick?: () => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  currentUserId,
  likesCount,
  commentsCount,
  isLiked,
  isAdmin = false,
  onLikeChange,
  onCommentClick,
  onIdeaDeleted,
  onIdeaClick
}) => {
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEmailSubscriptions, setShowEmailSubscriptions] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like ideas",
        variant: "destructive"
      });
      return;
    }

    setLiking(true);

    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('idea_id', idea.id)
          .eq('user_id', currentUserId);

        if (error) {
          console.error('Error removing like:', error);
          throw error;
        }
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ 
            idea_id: idea.id, 
            user_id: currentUserId 
          });

        if (error) {
          console.error('Error adding like:', error);
          throw error;
        }
      }
      
      onLikeChange();
    } catch (error: any) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
    }

    setLiking(false);
  };

  const handleDelete = async () => {
    if (!currentUserId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this idea? This action cannot be undone.");
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', idea.id);

      if (error) throw error;

      toast({
        title: "Idea deleted",
        description: "The idea has been successfully deleted."
      });

      if (onIdeaDeleted) {
        onIdeaDeleted();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete idea",
        variant: "destructive"
      });
    }

    setDeleting(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onIdeaClick?.();
  };

  const canDelete = currentUserId && (idea.created_by === currentUserId || isAdmin);
  const canManageStatus = currentUserId && (idea.created_by === currentUserId || isAdmin);
  const canEdit = currentUserId && (idea.created_by === currentUserId || isAdmin);
  const canSubscribe = currentUserId && currentUserId !== idea.created_by;

  return (
    <>
      <Card 
        className="h-full flex flex-col border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg line-clamp-2 text-blue-900">{idea.title}</CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {idea.business_unit && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                  <Building2 className="h-3 w-3" />
                  {idea.business_unit}
                </Badge>
              )}
              {canSubscribe && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmailSubscriptions(true);
                  }}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
                  title="Manage notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditForm(true);
                  }}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
                  title="Edit idea"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canManageStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusManager(true);
                  }}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
                  title="Manage status"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={deleting}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  title="Delete idea"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {idea.description && (
            <CardDescription className="line-clamp-3 text-gray-600">
              {idea.description}
            </CardDescription>
          )}

          {/* Status and Priority Row */}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={idea.status || 'draft'} />
            <PriorityBadge priority={idea.priority_level || 'medium'} />
          </div>

          {/* Progress Bar */}
          {(idea.progress_percentage !== null && idea.progress_percentage > 0) && (
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Progress</span>
              </div>
              <ProgressBar value={idea.progress_percentage} size="sm" />
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          {idea.techstack && idea.techstack.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <Code className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Tech Stack</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {idea.techstack.map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-700">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(idea.expected_start_date || idea.expected_end_date) && (
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {idea.expected_start_date && idea.expected_end_date ? (
                `${format(new Date(idea.expected_start_date), 'MMM yyyy')} - ${format(new Date(idea.expected_end_date), 'MMM yyyy')}`
              ) : idea.expected_start_date ? (
                `Starts ${format(new Date(idea.expected_start_date), 'MMM yyyy')}`
              ) : (
                `Ends ${format(new Date(idea.expected_end_date!), 'MMM yyyy')}`
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-3 border-t border-blue-100">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={liking || !currentUserId}
              className={`flex items-center gap-1 hover:bg-blue-50 ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick();
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <MessageCircle className="h-4 w-4" />
              {commentsCount}
            </Button>
          </div>
          
          {idea.created_at && (
            <span className="text-xs text-gray-500">
              {format(new Date(idea.created_at), 'MMM d')}
            </span>
          )}
        </CardFooter>
      </Card>

      <EditIdeaForm
        idea={idea}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onIdeaUpdated={onLikeChange}
        userId={currentUserId || ''}
        isAdmin={isAdmin}
      />

      <IdeaStatusManager
        ideaId={idea.id}
        currentStatus={idea.status || 'draft'}
        currentPriority={idea.priority_level || 'medium'}
        currentProgress={idea.progress_percentage || 0}
        isOpen={showStatusManager}
        onOpenChange={setShowStatusManager}
        onUpdate={onLikeChange}
        isAdmin={isAdmin}
        isOwner={idea.created_by === currentUserId}
      />

      {canSubscribe && (
        <EmailSubscriptionManager
          ideaId={idea.id}
          ideaTitle={idea.title}
          userId={currentUserId}
          open={showEmailSubscriptions}
          onOpenChange={setShowEmailSubscriptions}
        />
      )}
    </>
  );
};

export default IdeaCard;
