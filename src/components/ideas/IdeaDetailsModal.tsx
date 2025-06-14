import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import IdeaDetailsHeader from './modal/IdeaDetailsHeader';
import IdeaStatusSection from './modal/IdeaStatusSection';
import IdeaContentSection from './modal/IdeaContentSection';
import IdeaTimelineSection from './modal/IdeaTimelineSection';
import IdeaPeopleSection from './modal/IdeaPeopleSection';
import IdeaActionsSection from './modal/IdeaActionsSection';
import IdeaStatusManager from './IdeaStatusManager';
import EditIdeaForm from './EditIdeaForm';
import EmailSubscriptionManager from './EmailSubscriptionManager';
import CommentsModal from './CommentsModal';
import VolunteerManagement from './VolunteerManagement';
import type { Tables } from '@/integrations/supabase/types';

interface IdeaDetailsModalProps {
  idea: Tables<'ideas'> & {
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
  };
  currentUserId?: string;
  isAdmin?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLikeChange: () => void;
  onCommentClick: () => void;
  onIdeaUpdated: () => void;
}

const IdeaDetailsModal: React.FC<IdeaDetailsModalProps> = ({
  idea,
  currentUserId,
  isAdmin = false,
  open,
  onOpenChange,
  onLikeChange,
  onCommentClick,
  onIdeaUpdated
}) => {
  const [creatorName, setCreatorName] = useState<string>('');
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [liking, setLiking] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEmailSubscriptions, setShowEmailSubscriptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(idea.likesCount);
  const [localIsLiked, setLocalIsLiked] = useState(idea.isLiked);
  const [localCommentsCount, setLocalCommentsCount] = useState(idea.commentsCount);
  const { toast } = useToast();

  // Update local state when idea props change
  useEffect(() => {
    setLocalLikesCount(idea.likesCount);
    setLocalIsLiked(idea.isLiked);
    setLocalCommentsCount(idea.commentsCount);
  }, [idea.likesCount, idea.isLiked, idea.commentsCount]);

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (idea.created_by) {
        console.log('Fetching creator name for user ID:', idea.created_by);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', idea.created_by)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching creator profile:', error);
            setCreatorName('Unknown User');
            return;
          }
          
          if (data) {
            console.log('Creator profile data:', data);
            const name = data.full_name || data.email || 'Unknown User';
            setCreatorName(name);
          } else {
            console.log('No profile found for user ID:', idea.created_by);
            setCreatorName('Unknown User');
          }
        } catch (error) {
          console.error('Error in fetchCreatorName:', error);
          setCreatorName('Unknown User');
        }
      } else {
        console.log('No created_by field found');
        setCreatorName('Unknown User');
      }
    };

    const fetchAssignedUsers = async () => {
      if (idea.assigned_to && idea.assigned_to.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email')
          .in('id', idea.assigned_to);
        
        if (data) {
          setAssignedUsers(data.map(user => user.full_name || user.email || 'Unknown'));
        }
      }
    };

    if (open) {
      fetchCreatorName();
      fetchAssignedUsers();
    }
  }, [idea.created_by, idea.assigned_to, open]);

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
      if (localIsLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('idea_id', idea.id)
          .eq('user_id', currentUserId);

        if (error) throw error;
        setLocalLikesCount(prev => prev - 1);
        setLocalIsLiked(false);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ 
            idea_id: idea.id, 
            user_id: currentUserId 
          });

        if (error) throw error;
        setLocalLikesCount(prev => prev + 1);
        setLocalIsLiked(true);
      }
      
      onLikeChange();
      
      toast({
        title: localIsLiked ? "Like removed" : "Idea liked",
        description: localIsLiked ? "You have unliked this idea." : "You have liked this idea.",
      });
    } catch (error: any) {
      console.error('Error updating like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
      
      setLocalLikesCount(idea.likesCount);
      setLocalIsLiked(idea.isLiked);
    }

    setLiking(false);
  };

  const handleCommentsClick = () => {
    setShowComments(true);
  };

  const handleCommentAdded = () => {
    setLocalCommentsCount(prev => prev + 1);
    onIdeaUpdated();
  };

  const canManageStatus = currentUserId && (idea.created_by === currentUserId || isAdmin);
  const canEdit = currentUserId && (idea.created_by === currentUserId || isAdmin);
  const canSubscribe = currentUserId && currentUserId !== idea.created_by;
  const isCreator = currentUserId === idea.created_by;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <IdeaDetailsHeader
              title={idea.title}
              canSubscribe={canSubscribe}
              canEdit={canEdit}
              canManageStatus={canManageStatus}
              onSubscribeClick={() => setShowEmailSubscriptions(true)}
              onEditClick={() => setShowEditForm(true)}
              onManageStatusClick={() => setShowStatusManager(true)}
            />
          </DialogHeader>

          <div className="space-y-6">
            <IdeaStatusSection
              status={idea.status || 'draft'}
              priority={idea.priority_level || 'medium'}
              businessUnit={idea.business_unit}
              progress={idea.progress_percentage}
            />

            <IdeaContentSection
              description={idea.description}
              techStack={idea.techstack}
              tags={idea.tags}
            />

            <IdeaTimelineSection
              startDate={idea.expected_start_date}
              endDate={idea.expected_end_date}
            />

            <IdeaPeopleSection
              creatorName={creatorName}
              createdAt={idea.created_at}
              assignedUsers={assignedUsers}
              forwardedTo={idea.forwarded_to}
            />

            {currentUserId && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Volunteers</h3>
                </div>
                <VolunteerManagement 
                  ideaId={idea.id}
                  userId={currentUserId}
                  isCreator={isCreator}
                />
              </div>
            )}

            <IdeaActionsSection
              likesCount={localLikesCount}
              commentsCount={localCommentsCount}
              isLiked={localIsLiked}
              liking={liking}
              createdAt={idea.created_at}
              currentUserId={currentUserId}
              onLike={handleLike}
              onCommentsClick={handleCommentsClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <EditIdeaForm
        idea={idea}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onIdeaUpdated={onIdeaUpdated}
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
        onUpdate={onIdeaUpdated}
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

      {currentUserId && (
        <CommentsModal
          ideaId={idea.id}
          userId={currentUserId}
          open={showComments}
          onOpenChange={setShowComments}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </>
  );
};

export default IdeaDetailsModal;
