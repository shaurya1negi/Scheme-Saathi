'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, Target, X, Eye, EyeOff, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/language_context';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total: number;
  error?: string;
}

export default function NotificationsCenter() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'scheme_updates' | 'applications' | 'system'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const params = new URLSearchParams({
        type: filter,
        limit: '20',
      });

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Show fallback notifications
      setNotifications(getFallbackNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackNotifications = (): Notification[] => {
    return language === 'hi' ? [
      {
        id: '1',
        notification_type: 'scheme_update',
        title: 'नई योजना उपलब्ध',
        message: 'आपके लिए एक नई किसान योजना उपलब्ध है। अभी देखें और आवेदन करें।',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        notification_type: 'application_status',
        title: 'आवेदन की स्थिति',
        message: 'आपका PM किसान योजना का आवेदन स्वीकृत हो गया है।',
        priority: 'medium',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ] : [
      {
        id: '1',
        notification_type: 'scheme_update',
        title: 'New Scheme Available',
        message: 'A new farmer scheme is available for you. Check now and apply.',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        notification_type: 'application_status',
        title: 'Application Status',
        message: 'Your PM Kisan scheme application has been approved.',
        priority: 'medium',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  };

  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        // Adjust unread count if deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'scheme_update': return <Target className="w-5 h-5" />;
      case 'application_status': return <CheckCircle className="w-5 h-5" />;
      case 'system': return <AlertTriangle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      scheme_update: language === 'hi' ? 'योजना अपडेट' : 'Scheme Update',
      application_status: language === 'hi' ? 'आवेदन स्थिति' : 'Application Status',
      system: language === 'hi' ? 'सिस्टम' : 'System',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return language === 'hi' ? `${diffMinutes} मिनट पहले` : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return language === 'hi' ? `${diffHours} घंटे पहले` : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return language === 'hi' ? `${diffDays} दिन पहले` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.notification_type === filter;
  });

  const filterOptions = [
    { value: 'all', label: language === 'hi' ? 'सभी' : 'All' },
    { value: 'unread', label: language === 'hi' ? 'अपठित' : 'Unread' },
    { value: 'scheme_updates', label: language === 'hi' ? 'योजना अपडेट' : 'Scheme Updates' },
    { value: 'applications', label: language === 'hi' ? 'आवेदन' : 'Applications' },
    { value: 'system', label: language === 'hi' ? 'सिस्टम' : 'System' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell size={20} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {language === 'hi' ? 'सूचनाएं' : 'Notifications'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0 
                      ? (language === 'hi' ? `${unreadCount} नई सूचनाएं` : `${unreadCount} unread`)
                      : (language === 'hi' ? 'सभी पढ़ लिया गया' : 'All caught up')
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {language === 'hi' ? 'सभी पढ़ें' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={refreshNotifications}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw 
                  size={18} 
                  className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Filter Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    filter === option.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {option.label}
                  {option.value === 'unread' && unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
                <span className="text-gray-600">
                  {language === 'hi' ? 'सूचनाएं लोड हो रही हैं...' : 'Loading notifications...'}
                </span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'hi' ? 'कोई सूचना नहीं' : 'No notifications'}
                </h3>
                <p className="text-gray-500">
                  {language === 'hi' 
                    ? 'यहां आपकी सूचनाएं दिखाई जाएंगी।'
                    : 'Your notifications will appear here.'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.priority === 'high' || notification.priority === 'urgent'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(notification.created_at)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {getTypeLabel(notification.notification_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title={language === 'hi' ? 'पढ़ा हुआ मार्क करें' : 'Mark as read'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title={language === 'hi' ? 'डिलीट करें' : 'Delete'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
