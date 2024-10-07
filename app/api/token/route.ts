import { assets } from "@/lib/assets";
import { APITokensResponse } from "@/types/apis";

export async function GET() {
  const resp: APITokensResponse = { assets };
  return Response.json(resp);
}
