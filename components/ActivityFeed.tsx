import React, { useEffect, useState } from 'react';
import { Activity, Clock, User, Package, ShoppingCart } from 'lucide-react';
import ApiClient from '../services/ApiClient';
import { Card } from './Shared';

interface ActivityItem {
  id: string;
  action?: string;
  type: string;
  description?: string;
  productName?: string;
  userName: string;
  userId: string;
  timestamp?: string;
  createdAt?: string;
  quantity?: number;
  status?: string;
}

interface ActivityFeedProps {
  maxItems?: number;
  refreshInterval?: number; // in ms, 0 = no auto-refresh
}

export const ActivityFeed = ({ maxItems = 15, refreshInterval = 5000 }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivityFeed = async () => {
    try {
      const data = await ApiClient.get('/api/activity-feed');
      setActivities(data.slice(0, maxItems));
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityFeed();
    
    // Auto-refresh if interval specified
    if (refreshInterval > 0) {
      const interval = setInterval(fetchActivityFeed, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, maxItems]);

  const getActivityIcon = (type: string, action?: string) => {
    if (type === 'Inventory' || action?.includes('STOCK')) return <Package className="w-5 h-5 text-blue-500" />;
    if (action?.includes('SALE')) return <ShoppingCart className="w-5 h-5 text-green-500" />;
    return <Activity className="w-5 h-5 text-purple-500" />;
  };

  const formatTime = (timestamp?: string, createdAt?: string) => {
    const date = new Date(timestamp || createdAt || new Date());
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityDescription = (activity: ActivityItem) => {
    if (activity.action) return activity.description || activity.action;
    if (activity.type === 'Inventory') {
      return `${activity.productName} (Qty: ${activity.quantity}) - ${activity.status || 'Updated'}`;
    }
    return activity.description || `${activity.type} activity`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Activity Feed</h3>
          <span className="ml-auto text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
            Real-time
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No activities yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getActivityDescription(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{activity.userName || 'System'}</span>
                    <Clock className="w-3 h-3 ml-2" />
                    <span>{formatTime(activity.timestamp, activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
