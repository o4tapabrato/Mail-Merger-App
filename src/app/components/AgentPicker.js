import { useState, useEffect } from "react";


export default function AgentPicker({ value, onChange }) {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch('/api/agents/list').then(res => res.json()).then(setAgents);
  }, []);

  return (
    <div className="mt-8 border-t border-gray-800 pt-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase">3. Agent Binding</h3>
      <select 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white text-sm"
      >
        <option value="">Any Available Agent (Default)</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.email}</option>
        ))}
      </select>
    </div>
  );
}