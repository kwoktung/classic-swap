import { assets } from "@/lib/assets";

export async function GET() {
  return Response.json(assets);
}
