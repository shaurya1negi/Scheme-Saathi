'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth_context';
import { Bell, Clock, AlertTriangle, CheckCircle, Target, X, Eye, EyeOff } from 'lucide-react';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  priority: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

export default function NotificationsCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (newPage = 1, currentFilter = filter) => {
    try {
      setLoading(newPage === 1);
      const response = await fetch(`/api/notifications?page=${newPage}&type=${currentFilter}`);
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      
      if (newPage === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      setPage(newPage);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      generateSmartNotifications();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications(1, filter);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, filter]);

  const generateSmartNotifications = async () => {
    try {
      // Generate different types of smart notifications
      const notificationTypes = [
        'deadline_alerts',
        'personalized_recommendations',
        'application_updates',
        'scheme_matches'
      ];

      for (const type of notificationTypes) {
        await fetch('/api/notifications/smart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, userId: user?.id })
        });
      }
    } catch (error) {
      console.error('Error generating smart notifications:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });

      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      });

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      case 'recommendation':
        return <Target className="w-4 h-4" />;
      case 'update':
        return <CheckCircle className="w-4 h-4" />;
      case 'scheme_match':
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread' },
    { value: 'deadline', label: 'Deadlines' },
    { value: 'recommendation', label: 'Recommendations' },
    { value: 'update', label: 'Updates' },
    { value: 'scheme_match', label: 'Matches' }
  ];

  if (!user) {
    return (
      <div className="p-8 text-center">
        <Bell className="mx-auto w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Please sign in to view your notifications.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>
            )}
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => {
              setFilter(option.value);
              fetchNotifications(1, option.value);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
            {option.value === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-lg shadow-md">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : "We'll notify you when there are updates about schemes and applications."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`relative p-4 rounded-lg shadow-md border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                notification.read ? 'bg-white' : getPriorityColor(notification.priority)
              } ${notification.action_url ? 'hover:bg-gray-50' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getPriorityIcon(notification.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getTypeIcon(notification.notification_type)}
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {notification.notification_type.replace('_', ' ')}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <h3 className={`text-sm font-semibold ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      
                      <p className={`text-sm mt-1 ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                        {notification.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.read) {
                          // Could implement mark as unread functionality
                        } else {
                          markAsRead([notification.id]);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real-time indicator */}
      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          Smart notifications active • Auto-refresh enabled
        </div>
      </div>
    </div>
  );
}
