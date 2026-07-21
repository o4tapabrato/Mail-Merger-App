"use client";
import { useState, useEffect } from 'react';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', dailyLimit: 500 });
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      
      // Use 'data' instead of 'agentData'
      if (data.success) {
        setAgents(data.agents);
      } else {
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    
    const data = await res.json();
    if (res.ok) {
      setForm({ email: '', password: '', dailyLimit: 500 });
      fetchAgents();
    } else {
      alert(data.error || "Failed to add agent.");
    }
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    fetchAgents();
  };

  const deleteAgent = async (id) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    fetchAgents();
  };

  return (
    <div className="p-10 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Mailer Agents</h1>
      
      {/* Add Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl mb-10 border border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input className="col-span-1 bg-gray-800 p-3 rounded border border-gray-700" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} value={form.email} required />
        <input type="password" className="col-span-1 bg-gray-800 p-3 rounded border border-gray-700" placeholder="App Password" onChange={e => setForm({...form, password: e.target.value})} value={form.password} required />
        <input type="number" className="col-span-1 bg-gray-800 p-3 rounded border border-gray-700" placeholder="Limit" onChange={e => setForm({...form, dailyLimit: e.target.value})} value={form.dailyLimit} />
        <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition">
          {loading ? "Adding..." : "Add Agent"}
        </button>
      </form>

      {/* List Display */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Agents ({Array.isArray(agents) ? agents.length : 0})</h2>
        {Array.isArray(agents) && agents.map(agent => (
          <div key={agent.id} className="bg-gray-800 p-4 rounded flex justify-between items-center border border-gray-700">
            <div>
              <p className="font-bold">{agent.email}</p>
              <div className="text-sm text-gray-400">
                Limit: {agent.dailyLimit} | Status: 
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase ${agent.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleStatus(agent.id, agent.isActive)}
                className={`px-3 py-1 rounded text-xs transition ${agent.isActive ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}
              >
                {agent.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                onClick={() => deleteAgent(agent.id)}
                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}