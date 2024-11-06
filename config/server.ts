import "server-only";

import { z } from "zod";

export const configSchema = z.object({
  polygonRpcUrl: z.string().url(),
  redisUrl: z.string().url(),
  isDev: z.coerce.boolean().optional(),
});

export const serverConfig: z.infer<typeof configSchema> = {
  polygonRpcUrl: process.env.POLYGON_RPC || "",
  redisUrl: process.env.REDIS_URL || "",
  isDev: Boolean(process.env.IS_DEV || ""),
};
