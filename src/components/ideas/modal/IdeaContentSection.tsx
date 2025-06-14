
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Code, Tag } from 'lucide-react';

interface IdeaContentSectionProps {
  description?: string;
  techStack?: string[];
  tags?: string[];
}

const IdeaContentSection: React.FC<IdeaContentSectionProps> = ({
  description,
  techStack,
  tags
}) => {
  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Tech Stack */}
      {techStack && techStack.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Tech Stack</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, index) => (
              <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaContentSection;
