'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth_context';
import { Clock, CheckCircle, AlertCircle, XCircle, FileText, Calendar, TrendingUp, RefreshCw } from 'lucide-react';

interface Application {
  id: string;
  scheme_name: string;
  application_status: string;
  submitted_at: string;
  updated_at: string;
  progressPercentage: number;
  estimatedCompletion: {
    days: number;
    date: string;
    displayDate: string;
  } | null;
  nextSteps: string[];
  statusHistory: any[];
}

interface ApplicationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

function ApplicationTracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const fetchApplications = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch('/api/applications/status');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch applications: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setSummary(data.summary);
      setIsDemo(data.isDemo || false);
    } catch (err) {
      console.error('Applications fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, []);

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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">Error loading applications: {error}</p>
        <button 
          onClick={fetchApplications}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
        <button
          onClick={fetchApplications}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Demo Notice */}
      {isDemo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-blue-800">
              <strong>Demo Mode:</strong> You're viewing sample application data.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <FileText className="text-blue-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
              </div>
              <Clock className="text-yellow-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{summary.approved}</p>
              </div>
              <CheckCircle className="text-green-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{summary.rejected}</p>
              </div>
              <XCircle className="text-red-500 w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Applications</h2>
          <p className="text-gray-600">Track the progress of your scheme applications</p>
        </div>

        <div className="divide-y divide-gray-200">
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No applications found. Start applying to schemes to track your progress!</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.scheme_name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Updated: {new Date(app.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border text-blue-600 bg-blue-50 border-blue-200">
                      <FileText className="w-5 h-5 text-blue-500 mr-2" />
                      <span>{app.application_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Progress</span>
                    <span className="text-sm text-gray-600">{app.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${app.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(app.nextSteps || []).slice(0, 2).map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationTrackerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ApplicationTracker />
    </div>
  );
}
