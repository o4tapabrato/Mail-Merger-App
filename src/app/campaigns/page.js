"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);

    useEffect(() => {
        async function loadCampaigns() {
            try {
                const res = await fetch('/api/campaigns/list');

                if (res.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                const data = await res.json();

                // Only set campaigns if it's a valid array, otherwise default to []
                if (Array.isArray(data)) {
                    setCampaigns(data);
                } else {
                    setCampaigns([]);
                }
            } catch (error) {
                console.error("Failed to fetch campaigns:", error);
                setCampaigns([]);
            }
        }

        loadCampaigns();
    }, []);

    const handleAction = async (id, method, url) => {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        window.location.reload();
    };

    return (
        <div className="p-10 bg-gray-950 min-h-screen text-gray-100">
            <h1 className="text-3xl font-bold mb-8">Campaign Analytics</h1>

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Sent/Fail</th>
                            <th className="p-4">Created</th>
                            <th className="p-4">Actions</th>
                            <th className="p-4">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {campaigns.map(c => (
                            <tr key={c.id} className="hover:bg-gray-800 transition">
                                <td className="p-4 font-semibold">{c.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                                        c.status === 'RUNNING' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-sm">
                                    {/* Calculate total from the stored JSON fileData */}
                                    {c.logs.filter(l => l.status === 'SENT').length} / {c.fileData?.length || 0} Sent

                                    {/* Optional: Add a small progress percentage */}
                                    <div className="w-24 h-1 bg-gray-700 rounded-full mt-1">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${((c.logs.filter(l => l.status === 'SENT').length / (c.fileData?.length || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    {c.logs.filter(l => l.status === 'SENT').length} / {c.logs.filter(l => l.status === 'FAILED').length}
                                </td>
                                <td className="p-4 flex gap-3">
                                    {c.status === 'RUNNING' && (
                                        <button onClick={() => handleAction(c.id, 'POST', '/api/campaigns/halt')} className="text-yellow-500">Halt</button>
                                    )}
                                    {c.status === 'HALTED' && (
                                        <button onClick={() => handleAction(c.id, 'POST', '/api/campaigns/continue')} className="text-blue-500">Continue</button>
                                    )}
                                    <button onClick={() => handleAction(c.id, 'DELETE', '/api/campaigns/delete')} className="text-red-500">Delete</button>
                                </td>
                                <td className="p-4">
                                    <Link
                                        href={`/compose/${c.id}`}
                                        className="text-blue-400 hover:text-blue-300 font-semibold text-sm mr-4"
                                    >
                                        Edit
                                    </Link>
                                    {/* If you have a 'Continue' button, it would be here */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}