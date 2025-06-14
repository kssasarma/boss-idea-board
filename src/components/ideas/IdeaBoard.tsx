import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Shield, Grid2x2, List, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import IdeaCard from './IdeaCard';
import IdeaDetailsModal from './IdeaDetailsModal';
import CreateIdeaForm from './CreateIdeaForm';
import CommentsModal from './CommentsModal';
import UserAvatarDropdown from '../user/UserAvatarDropdown';
import NotificationCenter from './NotificationCenter';
import filterOptions from '../../config/filterOptions.json';
import type { Tables } from '@/integrations/supabase/types';
import type { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface IdeaBoardProps {
  userId: string;
  onSignOut: () => void;
}

interface IdeaWithCounts extends Tables<'ideas'> {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface GroupedIdeas {
  [key: string]: IdeaWithCounts[] | GroupedIdeas;
}

type GroupingOption = 'business_unit' | 'tech_stack' | 'status' | 'priority' | 'created_by';

const IdeaBoard: React.FC<IdeaBoardProps> = ({ userId, onSignOut }) => {
  const [ideas, setIdeas] = useState<IdeaWithCounts[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-liked' | 'progress' | 'priority'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'my-ideas'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [techStackFilter, setTechStackFilter] = useState<string>('all');
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groupBy, setGroupBy] = useState<'none' | GroupingOption>('none');
  const [multiGroupBy, setMultiGroupBy] = useState<GroupingOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [selectedIdeaForDetails, setSelectedIdeaForDetails] = useState<IdeaWithCounts | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideasError) throw ideasError;

      const ideasWithCounts = await Promise.all(
        (ideasData || []).map(async (idea) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase.from('likes').select('idea_id', { count: 'exact' }).eq('idea_id', idea.id),
            // Only count top-level comments (where parent_comment_id is null)
            supabase.from('comments').select('id', { count: 'exact' }).eq('idea_id', idea.id).is('parent_comment_id', null),
            supabase.from('likes').select('idea_id').eq('idea_id', idea.id).eq('user_id', userId).maybeSingle()
          ]);

          return {
            ...idea,
            likesCount: likesResult.count || 0,
            commentsCount: commentsResult.count || 0,
            isLiked: !!userLikeResult.data
          };
        })
      );

      setIdeas(ideasWithCounts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch ideas",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIdeas();
  }, [userId]);

  // Set up real-time subscription for likes and comments
  useEffect(() => {
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    const ideasChannel = supabase
      .channel('ideas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ideas'
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(ideasChannel);
    };
  }, []);

  useEffect(() => {
    let filtered = [...ideas];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.business_unit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(idea => idea.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(idea => idea.priority_level === priorityFilter);
    }

    // Filter by tech stack
    if (techStackFilter !== 'all') {
      filtered = filtered.filter(idea =>
        idea.techstack?.includes(techStackFilter)
      );
    }

    // Filter by business unit
    if (businessUnitFilter !== 'all') {
      filtered = filtered.filter(idea =>
        idea.business_unit === businessUnitFilter
      );
    }

    // Filter by ownership
    if (filterBy === 'my-ideas') {
      filtered = filtered.filter(idea => idea.created_by === userId);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
        case 'most-liked':
          return b.likesCount - a.likesCount;
        case 'progress':
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        case 'priority':
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return (priorityOrder[b.priority_level as keyof typeof priorityOrder] || 2) - 
                 (priorityOrder[a.priority_level as keyof typeof priorityOrder] || 2);
        case 'newest':
        default:
          return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
      }
    });

    setFilteredIdeas(filtered);
  }, [ideas, searchTerm, sortBy, filterBy, statusFilter, priorityFilter, techStackFilter, businessUnitFilter, userId]);

  const handleLikeChange = () => {
    fetchIdeas();
  };

  const handleIdeaDeleted = () => {
    fetchIdeas();
  };

  const getValueForGrouping = (idea: IdeaWithCounts, groupingType: GroupingOption): string => {
    switch (groupingType) {
      case 'business_unit':
        return idea.business_unit || 'No Business Unit';
      case 'status':
        return idea.status || 'draft';
      case 'priority':
        return idea.priority_level || 'medium';
      case 'created_by':
        return idea.created_by || 'Unknown';
      case 'tech_stack':
        return idea.techstack?.[0] || 'No Tech Stack';
      default:
        return 'Other';
    }
  };

  const createMultiLevelGroups = (ideas: IdeaWithCounts[], groupings: GroupingOption[]): GroupedIdeas => {
    if (groupings.length === 0) {
      return { 'All Ideas': ideas };
    }

    const [firstGrouping, ...remainingGroupings] = groupings;
    const groups: GroupedIdeas = {};

    ideas.forEach(idea => {
      const groupValues = getGroupValues(idea, firstGrouping);
      
      groupValues.forEach(groupValue => {
        if (!groups[groupValue]) {
          groups[groupValue] = [];
        }
        (groups[groupValue] as IdeaWithCounts[]).push(idea);
      });
    });

    // If there are more groupings to apply, recursively group each subgroup
    if (remainingGroupings.length > 0) {
      Object.keys(groups).forEach(key => {
        const subIdeas = groups[key] as IdeaWithCounts[];
        groups[key] = createMultiLevelGroups(subIdeas, remainingGroupings);
      });
    }

    return groups;
  };

  const getGroupValues = (idea: IdeaWithCounts, groupingType: GroupingOption): string[] => {
    switch (groupingType) {
      case 'business_unit':
        return [idea.business_unit || 'No Business Unit'];
      case 'status':
        return [idea.status || 'draft'];
      case 'priority':
        return [idea.priority_level || 'medium'];
      case 'created_by':
        return [idea.created_by || 'Unknown'];
      case 'tech_stack':
        return idea.techstack && idea.techstack.length > 0 ? idea.techstack : ['No Tech Stack'];
      default:
        return ['Other'];
    }
  };

  const groupedIdeas: GroupedIdeas = (() => {
    if (multiGroupBy.length > 0) {
      return createMultiLevelGroups(filteredIdeas, multiGroupBy);
    }

    switch (groupBy) {
      case 'business_unit':
        return filteredIdeas.reduce((acc, idea) => {
          const unit = idea.business_unit || 'No Business Unit';
          if (!acc[unit]) acc[unit] = [];
          (acc[unit] as IdeaWithCounts[]).push(idea);
          return acc;
        }, {} as GroupedIdeas);
      
      case 'tech_stack':
        const techGroups: GroupedIdeas = {};
        
        filteredIdeas.forEach(idea => {
          if (idea.techstack && idea.techstack.length > 0) {
            idea.techstack.forEach(tech => {
              if (!techGroups[tech]) techGroups[tech] = [];
              (techGroups[tech] as IdeaWithCounts[]).push(idea);
            });
          } else {
            if (!techGroups['No Tech Stack']) techGroups['No Tech Stack'] = [];
            (techGroups['No Tech Stack'] as IdeaWithCounts[]).push(idea);
          }
        });
        
        return techGroups;
      
      case 'status':
        return filteredIdeas.reduce((acc, idea) => {
          const status = idea.status || 'draft';
          if (!acc[status]) acc[status] = [];
          (acc[status] as IdeaWithCounts[]).push(idea);
          return acc;
        }, {} as GroupedIdeas);
      
      case 'priority':
        return filteredIdeas.reduce((acc, idea) => {
          const priority = idea.priority_level || 'medium';
          if (!acc[priority]) acc[priority] = [];
          (acc[priority] as IdeaWithCounts[]).push(idea);
          return acc;
        }, {} as GroupedIdeas);
      
      case 'created_by':
        const creatorGroups: GroupedIdeas = {};
        
        filteredIdeas.forEach(idea => {
          const creatorId = idea.created_by || 'Unknown';
          if (!creatorGroups[creatorId]) creatorGroups[creatorId] = [];
          (creatorGroups[creatorId] as IdeaWithCounts[]).push(idea);
        });
        
        return creatorGroups;
      
      default:
        return { 'All Ideas': filteredIdeas };
    }
  })();

  const addMultiGrouping = (groupingType: GroupingOption) => {
    if (!multiGroupBy.includes(groupingType)) {
      setMultiGroupBy([...multiGroupBy, groupingType]);
      setGroupBy('none'); // Disable single grouping when multi-grouping is active
    }
  };

  const removeMultiGrouping = (groupingType: GroupingOption) => {
    setMultiGroupBy(multiGroupBy.filter(g => g !== groupingType));
  };

  const clearAllGrouping = () => {
    setMultiGroupBy([]);
    setGroupBy('none');
  };

  const renderMultiLevelGroups = (groups: GroupedIdeas, level: number = 0): React.ReactNode => {
    return Object.entries(groups).map(([groupName, groupContent]) => {
      const isIdeaArray = Array.isArray(groupContent);
      const ideaCount = isIdeaArray ? groupContent.length : 
        Object.values(groupContent as GroupedIdeas).reduce((acc, val) => 
          acc + (Array.isArray(val) ? val.length : Object.keys(val).length), 0);

      return (
        <div key={groupName} className={level > 0 ? 'ml-6 border-l-2 border-blue-200 pl-4' : ''}>
          <h2 className={`font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2 ${
            level === 0 ? 'text-xl' : level === 1 ? 'text-lg' : 'text-base'
          }`}>
            {groupName} ({ideaCount})
          </h2>
          {isIdeaArray ? (
            renderIdeaGrid(groupContent as IdeaWithCounts[])
          ) : (
            <div className="space-y-6">
              {renderMultiLevelGroups(groupContent as GroupedIdeas, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderIdeaGrid = (ideasToRender: IdeaWithCounts[]) => {
    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {ideasToRender.map((idea) => (
            <div key={idea.id} className="w-full">
              <IdeaCard
                idea={idea}
                currentUserId={userId}
                likesCount={idea.likesCount}
                commentsCount={idea.commentsCount}
                isLiked={idea.isLiked}
                isAdmin={isAdmin}
                onLikeChange={handleLikeChange}
                onCommentClick={() => setSelectedIdeaId(idea.id)}
                onIdeaDeleted={handleIdeaDeleted}
                onIdeaClick={() => setSelectedIdeaForDetails(idea)}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideasToRender.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            currentUserId={userId}
            likesCount={idea.likesCount}
            commentsCount={idea.commentsCount}
            isLiked={idea.isLiked}
            isAdmin={isAdmin}
            onLikeChange={handleLikeChange}
            onCommentClick={() => setSelectedIdeaId(idea.id)}
            onIdeaDeleted={handleIdeaDeleted}
            onIdeaClick={() => setSelectedIdeaForDetails(idea)}
          />
        ))}
      </div>
    );
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Loading ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Idea BOARD</h1>
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                  <Shield className="h-4 w-4" />
                  Admin
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowCreateForm(true)} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Idea
              </Button>
              <NotificationCenter userId={userId} />
              <ThemeToggle />
              {user && (
                <UserAvatarDropdown user={user} onSignOut={onSignOut} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={techStackFilter} onValueChange={setTechStackFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tech Stack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tech Stacks</SelectItem>
                  {filterOptions.techStacks.map((tech) => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Units</SelectItem>
                  {filterOptions.businessUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-liked">Most Liked</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ideas</SelectItem>
                  <SelectItem value="my-ideas">My Ideas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200'}
                >
                  <Grid2x2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="priority">Group by Priority</SelectItem>
                  <SelectItem value="business_unit">Group by Business Unit</SelectItem>
                  <SelectItem value="tech_stack">Group by Tech Stack</SelectItem>
                  <SelectItem value="created_by">Group by Creator</SelectItem>
                </SelectContent>
              </Select>

              <Select value="" onValueChange={addMultiGrouping}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Add Multi-Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">+ Status</SelectItem>
                  <SelectItem value="priority">+ Priority</SelectItem>
                  <SelectItem value="business_unit">+ Business Unit</SelectItem>
                  <SelectItem value="tech_stack">+ Tech Stack</SelectItem>
                  <SelectItem value="created_by">+ Creator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multi-grouping badges */}
            {(multiGroupBy.length > 0 || groupBy !== 'none') && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  {multiGroupBy.length > 0 ? 'Multi-Group by:' : 'Grouped by:'}
                </span>
                
                {/* Show single grouping badge if no multi-grouping */}
                {multiGroupBy.length === 0 && groupBy !== 'none' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {groupBy.replace('_', ' ')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setGroupBy('none')}
                    />
                  </Badge>
                )}
                
                {/* Show multi-grouping badges */}
                {multiGroupBy.map((groupType) => (
                  <Badge key={groupType} variant="secondary" className="flex items-center gap-1">
                    {groupType.replace('_', ' ')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeMultiGrouping(groupType)}
                    />
                  </Badge>
                ))}
                
                {/* Clear All button */}
                {(multiGroupBy.length > 0 || groupBy !== 'none') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllGrouping}
                    className="h-6 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ideas Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || filterBy === 'my-ideas' || techStackFilter !== 'all' || businessUnitFilter !== 'all' 
                ? 'No ideas found matching your criteria.' 
                : 'No ideas yet. Be the first to share one!'}
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Idea
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {multiGroupBy.length > 0 ? (
              renderMultiLevelGroups(groupedIdeas)
            ) : (
              Object.entries(groupedIdeas).map(([groupName, groupIdeas]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
                      {groupName} ({(groupIdeas as IdeaWithCounts[]).length})
                    </h2>
                  )}
                  {renderIdeaGrid(groupIdeas as IdeaWithCounts[])}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateIdeaForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onIdeaCreated={fetchIdeas}
        userId={userId}
      />

      {selectedIdeaId && (
        <CommentsModal
          ideaId={selectedIdeaId}
          userId={userId}
          open={!!selectedIdeaId}
          onOpenChange={() => setSelectedIdeaId(null)}
        />
      )}

      {selectedIdeaForDetails && (
        <IdeaDetailsModal
          idea={selectedIdeaForDetails}
          currentUserId={userId}
          isAdmin={isAdmin}
          open={!!selectedIdeaForDetails}
          onOpenChange={(open) => !open && setSelectedIdeaForDetails(null)}
          onLikeChange={handleLikeChange}
          onCommentClick={() => {
            setSelectedIdeaId(selectedIdeaForDetails.id);
            setSelectedIdeaForDetails(null);
          }}
          onIdeaUpdated={fetchIdeas}
        />
      )}
    </div>
  );
};

export default IdeaBoard;
