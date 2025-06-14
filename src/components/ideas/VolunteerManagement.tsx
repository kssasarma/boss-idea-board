import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, Check, X, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useVolunteers, type Volunteer } from '@/hooks/useVolunteers';

// Improved function: a user is considered "applied" if there is any application
// for this ideaId + userId whose status is not "rejected"
function hasActiveVolunteerApplication(volunteers: Volunteer[], userId: string) {
  // Find all applications for this user in this idea
  const found = volunteers.find(
    v => v.user_id === userId && (v.status === 'pending' || v.status === 'approved')
  );
  return !!found;
}

interface VolunteerManagementProps {
  ideaId: string;
  userId: string;
  isCreator: boolean;
}

const VolunteerManagement: React.FC<VolunteerManagementProps> = ({
  ideaId,
  userId,
  isCreator
}) => {
  // Debug: Log all incoming props on every render
  useEffect(() => {
    console.log('[VolunteerManagement] ideaId:', ideaId, 'userId:', userId, 'isCreator:', isCreator);
  }, [ideaId, userId, isCreator]);

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [message, setMessage] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const {
    volunteers,
    loading,
    submitting,
    fetchVolunteers,
    submitVolunteerApplication,
    updateVolunteerStatus,
    removeVolunteer,
  } = useVolunteers(ideaId);

  useEffect(() => {
    // Fetch volunteers whenever ideaId changes (initial and updates)
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Debug: Print loaded volunteers
  useEffect(() => {
    console.log('[VolunteerManagement] volunteers:', volunteers);
  }, [volunteers]);

  // If userId is missing, show a warning
  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-yellow-600">
            <p>User ID not available. Please sign in to apply as a volunteer.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Correct application state logic: the button should render if...
  // - User is not creator
  // - User has not already applied (approved/pending). If their application was rejected, allow re-application.
  const userHasActiveVolunteerApp = hasActiveVolunteerApplication(volunteers, userId);

  // Debug for the computed logic
  useEffect(() => {
    console.log('[VolunteerManagement] userHasActiveVolunteerApp:', userHasActiveVolunteerApp, 'userId:', userId);
  }, [userHasActiveVolunteerApp, userId]);

  const handleSubmitApplication = async () => {
    await submitVolunteerApplication(message, skills);
    setMessage('');
    setSkills([]);
    setSkillInput('');
    setShowApplicationForm(false);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
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
          Volunteers ({volunteers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Only show the Apply to Volunteer button if:
            - User is logged in
            - User is NOT the idea's creator
            - User does not have an approved/pending volunteer app for this idea
            (If rejected, show the button to allow reapplication). */}
        {!userHasActiveVolunteerApp && !isCreator && (
          <div className="space-y-4">
            {!showApplicationForm ? (
              <Button onClick={() => setShowApplicationForm(true)} className="w-full" data-testid="apply-volunteer-btn">
                <Plus className="h-4 w-4 mr-2" />
                Apply to Volunteer
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Volunteer Application</h4>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us why you want to volunteer for this idea..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      placeholder="Add a skill"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill} variant="outline" size="sm">
                      Add
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitApplication} 
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {volunteers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No volunteers yet</p>
        ) : (
          <div className="space-y-4">
            {volunteers.map((volunteer) => (
              <div key={volunteer.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={volunteer.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(volunteer.profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {volunteer.profile?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied {format(new Date(volunteer.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(volunteer.status)}>
                      {volunteer.status}
                    </Badge>
                    {/* Show remove button for admin/creator */}
                    {isCreator && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        title="Remove Volunteer"
                        onClick={() => removeVolunteer(volunteer.id)}
                        data-testid={`remove-volunteer-${volunteer.id}`}
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {volunteer.message && (
                  <div>
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm text-gray-700">{volunteer.message}</p>
                  </div>
                )}

                {volunteer.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isCreator && volunteer.status === 'pending' && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateVolunteerStatus(volunteer.id, 'approved')}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateVolunteerStatus(volunteer.id, 'rejected')}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolunteerManagement;
