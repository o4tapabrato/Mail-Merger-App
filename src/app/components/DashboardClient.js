"use client";
import React, { useState, useEffect } from 'react';

export default function DashboardClient() {
  // Initialize with null so we know when it's loading
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(err => console.error("Failed to load stats", err));
  }, []);

  // Map the API response to the labels your UI expects
  const getStats = () => {
    if (!statsData) return [];
    return [
      { label: 'Active Campaigns', value: statsData.campaigns.running.toString() },
      { label: 'Emails Sent Today', value: statsData.agents.totalSentToday.toLocaleString() },
      { label: 'Available Agents', value: statsData.agents.active.toString() },
      { label: 'Pending Queue', value: statsData.campaigns.queued.toString() },
    ];
  };

  const stats = getStats();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      <main className="flex-1 p-10 bg-gray-950 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your current mail automation activity.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {!statsData ? (
            // Loading skeleton or simple text
            <div className="col-span-4 text-gray-500">Loading live data...</div>
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Placeholder for future activity logs */}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>

          <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">

            <p className="text-gray-600">No recent activity to display yet.</p>

            <a href="/" className="text-blue-400 hover:text-blue-300 underline mt-2 block text-sm">Create your first campaign</a>

          </div>

        </div>
      </main>
    </div>
  );
}