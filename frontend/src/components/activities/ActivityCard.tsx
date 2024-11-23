import React from 'react';
import { Clock, Star, Tag } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  category: string;
  tags: string[];
  aiGenerated: boolean;
}

interface ActivityCardProps {
  activity: Activity;
  onSchedule: (id: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onSchedule,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {activity.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{activity.description}</p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Clock className="w-4 h-4 mr-2" />
          <span>{activity.durationMinutes} minutes</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Tag className="w-4 h-4 mr-2" />
          <span>{activity.category}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {activity.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        {activity.aiGenerated && (
          <div className="flex items-center text-sm text-purple-600 mb-4">
            <Star className="w-4 h-4 mr-2" />
            <span>AI Generated</span>
          </div>
        )}
        <button
          onClick={() => onSchedule(activity.id)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          aria-label={`Schedule ${activity.name}`}
        >
          Schedule Activity
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;
