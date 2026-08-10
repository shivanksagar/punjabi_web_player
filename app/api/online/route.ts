import { activeCount, heartbeat } from "@/lib/online/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) await heartbeat(id);
  return Response.json({ online: await activeCount() });
}
