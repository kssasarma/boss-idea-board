
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, Crown, UserPlus, UserMinus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useTeams, type Team } from '@/hooks/useTeams';

interface TeamManagementProps {
  ideaId: string;
  userId: string;
  isCreator: boolean;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  ideaId,
  userId,
  isCreator
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  const {
    teams,
    loading,
    submitting,
    fetchTeams,
    createTeam,
    joinTeam,
    leaveTeam
  } = useTeams(ideaId);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    
    await createTeam(teamName, teamDescription);
    setTeamName('');
    setTeamDescription('');
    setShowCreateForm(false);
  };

  const isUserInTeam = (team: Team) => {
    return team.members?.some(member => member.user_id === userId);
  };

  const getUserRoleInTeam = (team: Team) => {
    const member = team.members?.find(member => member.user_id === userId);
    return member?.role;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams ({teams.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(isCreator || teams.length === 0) && (
          <div className="space-y-4">
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Create New Team</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamDescription">Description (Optional)</Label>
                  <Textarea
                    id="teamDescription"
                    placeholder="Describe the team's role and responsibilities..."
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateTeam} 
                    disabled={submitting || !teamName.trim()}
                    className="flex-1"
                  >
                    {submitting ? 'Creating...' : 'Create Team'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {teams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No teams created yet</p>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-lg">{team.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created {format(new Date(team.created_at), 'MMM d, yyyy')}
                    </p>
                    {team.description && (
                      <p className="text-sm text-gray-700 mt-2">{team.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {team.members?.length || 0} members
                  </Badge>
                </div>

                {team.members && team.members.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Members:</p>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {member.profile?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {member.role === 'leader' && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  {!isUserInTeam(team) ? (
                    <Button
                      size="sm"
                      onClick={() => joinTeam(team.id)}
                      className="flex-1"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Team
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => leaveTeam(team.id)}
                      className="flex-1"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Leave Team
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
