import { configSchema, serverConfig } from "@/config/server";

export async function register() {
  const result = await configSchema.safeParseAsync(serverConfig);

  if (result.error) {
    console.error("failed to parse server config, process exit");
    process.exit(1);
  }
}
