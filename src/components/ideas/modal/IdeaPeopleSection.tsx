
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { format } from 'date-fns';

interface IdeaPeopleSectionProps {
  creatorName: string;
  createdAt?: string;
  assignedUsers: string[];
  forwardedTo?: string[];
}

const IdeaPeopleSection: React.FC<IdeaPeopleSectionProps> = ({
  creatorName,
  createdAt,
  assignedUsers,
  forwardedTo
}) => {
  return (
    <div className="space-y-6">
      {/* People */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Created By</h3>
          </div>
          <p className="text-gray-700">{creatorName}</p>
          {createdAt && (
            <p className="text-sm text-gray-500">
              {format(new Date(createdAt), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Assigned Users */}
        {assignedUsers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Assigned To</h3>
            <div className="space-y-1">
              {assignedUsers.map((user, index) => (
                <p key={index} className="text-gray-700">{user}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Forwarded To */}
      {forwardedTo && forwardedTo.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Forwarded To</h3>
          <div className="flex flex-wrap gap-2">
            {forwardedTo.map((entity, index) => (
              <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                {entity}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaPeopleSection;
