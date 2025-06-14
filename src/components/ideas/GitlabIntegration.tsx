
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// CHANGED: Replace Sync with RefreshCw
import { GitBranch, RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useGitlab } from '@/hooks/useGitlab';

interface GitlabIntegrationProps {
  ideaId: string;
  isCreator: boolean;
}

const GitlabIntegration: React.FC<GitlabIntegrationProps> = ({
  ideaId,
  isCreator
}) => {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const {
    integration,
    loading,
    syncing,
    fetchIntegration,
    createIntegration,
    syncIssues,
    removeIntegration
  } = useGitlab(ideaId);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  const handleSetupIntegration = async () => {
    if (!projectId.trim() || !projectUrl.trim()) return;
    
    await createIntegration(projectId.trim(), projectUrl.trim(), accessToken.trim() || undefined);
    setProjectId('');
    setProjectUrl('');
    setAccessToken('');
    setShowSetupForm(false);
  };

  const getProgressPercentage = () => {
    if (!integration || integration.total_issues === 0) return 0;
    return Math.round((integration.closed_issues / integration.total_issues) * 100);
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
          <GitBranch className="h-5 w-5" />
          GitLab Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!integration ? (
          <>
            {isCreator && (
              <div className="space-y-4">
                {!showSetupForm ? (
                  <Button onClick={() => setShowSetupForm(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect GitLab Project
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Connect GitLab Project</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="projectId">Project ID</Label>
                      <Input
                        id="projectId"
                        placeholder="e.g., 12345"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Found in your GitLab project's General settings
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectUrl">Project URL</Label>
                      <Input
                        id="projectUrl"
                        placeholder="https://gitlab.com/username/project"
                        value={projectUrl}
                        onChange={(e) => setProjectUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accessToken">Access Token (Optional)</Label>
                      <Input
                        id="accessToken"
                        type="password"
                        placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Required for private repositories or issue tracking
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSetupIntegration} 
                        disabled={!projectId.trim() || !projectUrl.trim()}
                        className="flex-1"
                      >
                        Connect Project
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowSetupForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isCreator && (
              <p className="text-gray-500 text-center py-4">
                No GitLab integration configured
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Connected Project</h4>
                  <Badge variant="outline">ID: {integration.gitlab_project_id}</Badge>
                </div>
                <a 
                  href={integration.gitlab_project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  {integration.gitlab_project_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h5 className="font-medium">Issue Tracking</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{integration.total_issues}</p>
                  <p className="text-sm text-gray-500">Total Issues</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{integration.closed_issues}</p>
                  <p className="text-sm text-gray-500">Closed Issues</p>
                </div>
              </div>
              
              {integration.total_issues > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>
              )}

              {integration.last_sync_at && (
                <p className="text-xs text-gray-500">
                  Last synced: {format(new Date(integration.last_sync_at), 'MMM d, yyyy at h:mm a')}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={syncIssues}
                disabled={syncing}
                className="flex-1"
              >
                {/* CHANGED: Use RefreshCw instead of Sync */}
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Issues'}
              </Button>
              
              {isCreator && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeIntegration}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GitlabIntegration;

// IMPORTANT: This file is over 200 lines long and could benefit from refactoring. Consider splitting into smaller components!
