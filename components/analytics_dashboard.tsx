'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth_context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, Clock, Target, Award, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface AnalyticsData {
  totalInteractions: number;
  totalApplications: number;
  totalBookmarks: number;
  interactionsByType: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    interactions: number;
    types: Record<string, number>;
  }>;
  applicationStats: {
    total: number;
    byStatus: Record<string, number>;
    recentApplications: any[];
  };
  popularCategories: Record<string, number>;
  engagement: {
    avgInteractionsPerDay: number;
    mostActiveHour: number;
    streakDays: number;
    completionRate: number;
  };
  insights: Array<{
    type: string;
    title: string;
    message: string;
  }>;
  timeframe: string;
  isDemo?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedTimeframe: string = timeframe) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics?timeframe=${selectedTimeframe}&userId=${user?.id || 'demo'}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch analytics, even without user (will show demo data)
    fetchAnalytics();
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    fetchAnalytics(newTimeframe);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 w-12 h-12 mb-4" />
        <p className="text-red-600">Error loading analytics: {error}</p>
        <button 
          onClick={() => fetchAnalytics()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) return null;

  // Prepare data for charts with null checks
  const interactionTypeData = Object.entries(analyticsData.interactionsByType || {}).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const applicationStatusData = Object.entries(analyticsData.applicationStats?.byStatus || {}).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const categoryData = Object.entries(analyticsData.popularCategories || {}).map(([category, count]) => ({
    name: category,
    value: count
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {['1d', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-4 py-2 rounded ${
                timeframe === tf 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tf === '1d' ? 'Today' : tf === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Mode Indicator */}
      {analyticsData.isDemo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
          <Info className="text-yellow-600 w-5 h-5" />
          <div>
            <h3 className="text-yellow-800 font-medium">Demo Mode</h3>
            <p className="text-yellow-700 text-sm">
              {user ? 
                "No interaction data available yet. Start using features to see your analytics!" :
                "Sign in to see your real analytics data and track your progress."
              }
            </p>
          </div>
        </div>
      )}

      {/* Production Mode Indicator */}
      {!analyticsData.isDemo && user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="text-green-600 w-5 h-5" />
          <div>
            <h3 className="text-green-800 font-medium">Live Analytics</h3>
            <p className="text-green-700 text-sm">
              Showing your real usage data and insights.
            </p>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      {analyticsData.isDemo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-blue-800">
              <strong>Demo Mode:</strong> You're viewing sample analytics data. Sign in to see your actual usage statistics.
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalInteractions || 0}</p>
            </div>
            <TrendingUp className="text-blue-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalApplications || 0}</p>
            </div>
            <Target className="text-green-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement?.streakDays || 0}</p>
            </div>
            <Award className="text-yellow-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Most Active Hour</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement?.mostActiveHour || 0}:00</p>
            </div>
            <Clock className="text-purple-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {analyticsData.insights && analyticsData.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Info className="mr-2 text-blue-500" />
            Insights & Recommendations
          </h2>
          <div className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                insight.type === 'suggestion' ? 'bg-blue-50 border-blue-500' :
                'bg-yellow-50 border-yellow-500'
              }`}>
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                <p className="text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daily Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.dailyActivity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="interactions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Interaction Types Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Interaction Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={interactionTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {interactionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status */}
        {analyticsData.applicationStats.total > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Application Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Popular Categories */}
        {Object.keys(analyticsData.popularCategories).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Applications Table */}
      {analyticsData.applicationStats.recentApplications.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Scheme Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Submitted</th>
                  <th className="px-4 py-2 text-left">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.applicationStats.recentApplications.map((app, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{app.scheme_name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        app.application_status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.application_status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {app.application_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(app.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{new Date(app.updated_at || app.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
