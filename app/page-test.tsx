'use client';

import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-blue-500">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Scheme Sathi
        </h1>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Government Schemes Assistant
          </h2>
          <p className="text-gray-600 mb-6">
            Your AI-powered companion to find and apply for government schemes in India.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Upload Information</h3>
              <p className="text-blue-600 text-sm">Add your details for personalized recommendations</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Chat Assistant</h3>
              <p className="text-green-600 text-sm">Chat with our AI about government schemes</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Voice Assistant</h3>
              <p className="text-purple-600 text-sm">Speak with our voice assistant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
