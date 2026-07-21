import { db } from '@/lib/prisma';

export async function POST(req, { params }) {
  const { agentId } = await req.json();
  const { id } = await params;

  await db.emailCampaign.update({
    where: { id },
    data: { assignedAgentId: agentId }
  });

  return Response.json({ success: true });
}