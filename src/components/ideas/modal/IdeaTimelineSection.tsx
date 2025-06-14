
import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface IdeaTimelineSectionProps {
  startDate?: string;
  endDate?: string;
}

const IdeaTimelineSection: React.FC<IdeaTimelineSectionProps> = ({
  startDate,
  endDate
}) => {
  if (!startDate && !endDate) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Timeline</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startDate && (
          <div>
            <span className="text-sm text-gray-600">Start Date:</span>
            <p className="font-medium">{format(new Date(startDate), 'MMMM d, yyyy')}</p>
          </div>
        )}
        {endDate && (
          <div>
            <span className="text-sm text-gray-600">End Date:</span>
            <p className="font-medium">{format(new Date(endDate), 'MMMM d, yyyy')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaTimelineSection;
