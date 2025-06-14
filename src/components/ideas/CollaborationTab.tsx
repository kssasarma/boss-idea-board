
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VolunteerManagement from './VolunteerManagement';
import TeamManagement from './TeamManagement';
import GitlabIntegration from './GitlabIntegration';

interface CollaborationTabProps {
  ideaId: string;
  userId: string;
  isCreator: boolean;
}

const CollaborationTab: React.FC<CollaborationTabProps> = ({
  ideaId,
  userId,
  isCreator
}) => {
  return (
    <Tabs defaultValue="volunteers" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="gitlab">GitLab</TabsTrigger>
      </TabsList>
      
      <TabsContent value="volunteers" className="mt-4">
        <VolunteerManagement 
          ideaId={ideaId} 
          userId={userId} 
          isCreator={isCreator} 
        />
      </TabsContent>
      
      <TabsContent value="teams" className="mt-4">
        <TeamManagement 
          ideaId={ideaId} 
          userId={userId} 
          isCreator={isCreator} 
        />
      </TabsContent>
      
      <TabsContent value="gitlab" className="mt-4">
        <GitlabIntegration 
          ideaId={ideaId} 
          isCreator={isCreator} 
        />
      </TabsContent>
    </Tabs>
  );
};

export default CollaborationTab;
