"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CampaignDashboard() {
    const [campaigns, setCampaigns] = useState([]);
    const [agents, setAgents] = useState([]);

    const fetchData = async () => {
        try {
            // 1. Fetch campaigns
            const campRes = await fetch('/api/campaigns/list');
            const campData = await campRes.json();
            setCampaigns(Array.isArray(campData) ? campData : []);

            // 2. Fetch agents (ADJUSTED FOR OBJECT STRUCTURE)
            const agentRes = await fetch('/api/agents/list');
            const data = await agentRes.json();

            // Since the API returns the array directly, check if 'data' is an array
            if (Array.isArray(data)) {
                setAgents(data);
            } else {
                console.error("Expected array, received:", data);
                setAgents([]);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setCampaigns([]);
            setAgents([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (id, status) => {
        await fetch(`/api/campaigns/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchData(); // Refresh UI after update
    };

    const runOrchestrator = async () => {
        const res = await fetch('/api/orchestrator/run', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            alert("Orchestrator started!");
            fetchData(); // Refresh to show RUNNING status
        } else {
            alert(data.message || "Failed to start.");
        }
    };

    return (
        <div className="p-10 bg-gray-950 min-h-screen text-gray-100 font-sans">
            <div className="flex gap-8">
                {/* Campaigns Table */}
                <div className="flex-1">
                    <header className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Campaign Queue</h1>
                        <Link href="/compose" className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500">
                            New Campaign
                        </Link>
                    </header>

                    <button
                        onClick={runOrchestrator}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        Start Queue
                    </button>

                    <table className="w-full">
                        <thead className="text-gray-400 text-xs uppercase border-b border-gray-800">
                            <tr>
                                <th className="p-4 text-left">Name</th>
                                <th className="p-4 text-left">Priority</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(campaigns) && campaigns.map(c => (
                                <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                                    <td className="p-4">{c.name}</td>
                                    <td className="p-4">{c.priority || 0}</td>
                                    <td className="p-4 font-mono text-xs uppercase">{c.status}</td>
                                    <td className="p-4 flex gap-3">
                                        {c.status === 'PENDING' && (
                                            <button onClick={() => updateStatus(c.id, 'QUEUED')} className="text-green-400 hover:text-green-300">Queue</button>
                                        )}
                                        {c.status === 'QUEUED' && (
                                            <button onClick={() => updateStatus(c.id, 'PAUSED')} className="text-yellow-400 hover:text-yellow-300">Hold</button>
                                        )}
                                        {c.status === 'PAUSED' && (
                                            <button onClick={() => updateStatus(c.id, 'QUEUED')} className="text-blue-400 hover:text-blue-300">Resume</button>
                                        )}
                                        <Link href={`/compose/${c.id}`} className="text-gray-400 hover:text-white">Edit</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Agent Monitor Sidebar */}
                <aside className="w-64 bg-gray-900 p-6 rounded-xl border border-gray-800 h-fit">
                    <h2 className="text-sm font-semibold mb-4 uppercase text-gray-300">Agents Capacity</h2>
                    {Array.isArray(agents) && agents.length > 0 ? (
                        agents.map(a => (
                            <div key={a.id} className="mb-4">
                                <div className="text-xs text-gray-400 truncate">{a.email}</div>
                                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-500"
                                        // Use a.sentCount (the dynamic value) instead of a.sentToday
                                        style={{ width: `${Math.min(((a.sentCount || 0) / (a.dailyLimit || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] mt-1 text-gray-500">
                                    {a.sentCount || 0} / {a.dailyLimit} sent
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500">No agents configured.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}