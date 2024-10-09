import { parse } from "qs";
import { z } from "zod";

import { chainList } from "@/config/chain";
import type { ChainExplorerConfig } from "@/types/base";

const schema = z.object({
  format: z
    .string()
    .refine((o): o is keyof ChainExplorerConfig =>
      ["name", "address", "transaction", "block"].includes(o),
    ),
  value: z.string(),
  chainId: z.string(),
});

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const validate = schema.safeParse(parse(search.slice(1)));
  if (validate.error) {
    const issue = validate.error.issues[0];
    const message = issue
      ? `[${issue.path.join(",")}] ${issue.message}`
      : "Invalid params";
    return Response.json({ error: message }, { status: 400 });
  }
  const { format, chainId, value } = validate.data;
  const chain = chainList.find((o) => o.chainId === chainId);
  if (!chain) {
    return Response.json({ error: "" }, { status: 400 });
  }
  const urlTemplate = chain.explorer[format] ?? chain.explorer.name;
  const link = urlTemplate.replace(`{${format}}`, value);
  return Response.redirect(link);
}
