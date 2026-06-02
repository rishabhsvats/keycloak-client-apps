import { useEffect, useState } from 'react';
import { adminApi, ApiError } from '../services/api';
import type { Activity } from '../types';
import toast from 'react-hot-toast';

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await adminApi.getActivity();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activity:', error);
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have permission to view activity log');
      } else {
        toast.error('Failed to load activity log');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'project_created':
        return '📁';
      case 'task_created':
        return '✓';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-2">Recent system events and actions</p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No recent activity</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <ul className="divide-y divide-gray-200">
            {activities.map((activity, index) => (
              <li key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-1">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-500">
                        User: <span className="font-medium">{activity.userId}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    #{activity.entityId}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Activity Log Implementation
        </h3>
        <p className="text-green-800">
          This activity log is generated from existing project and task entities,
          sorted by creation/update timestamps. It demonstrates a simple approach
          to tracking system events without a separate activity log table.
        </p>
      </div>
    </div>
  );
}
