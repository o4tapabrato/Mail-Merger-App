export default function AgentSelector({ campaignId, currentAgentId, agents }) {
  const assignAgent = async (agentId) => {
    await fetch(`/api/campaigns/${campaignId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId: agentId === "any" ? null : agentId })
    });
  };

  return (
    <select onChange={(e) => assignAgent(e.target.value)} defaultValue={currentAgentId || "any"}>
      <option value="any">Any Available Agent</option>
      {agents.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
    </select>
  );
}