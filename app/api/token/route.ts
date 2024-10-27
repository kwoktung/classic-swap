import Fuse, { type Expression } from "fuse.js";
import { isAddress } from "viem";
import { z } from "zod";

import { assets } from "@/lib/assets";
import { handleApiRequest } from "@/lib/validate";

import { createClient, createTokenService } from "../shared";

const tokenFuse = new Fuse(assets, {
  location: 0,
  isCaseSensitive: false,
  includeMatches: true,
  shouldSort: true,
  findAllMatches: false,
  minMatchCharLength: 1,
  threshold: 0.8,
  distance: 1000,
  useExtendedSearch: true,
  ignoreLocation: false,
  ignoreFieldNorm: true,
  includeScore: true,
  keys: ["name", "symbol"],
});

const schema = z.object({
  keyword: z.string().optional(),
});

export async function GET(request: Request) {
  return handleApiRequest(schema, request, async (data) => {
    const { keyword } = data;
    if (!keyword) {
      return { assets };
    } else if (isAddress(keyword)) {
      const item = assets.find(
        (o) => o.address.toLowerCase() === keyword.toLowerCase(),
      );
      if (item) {
        return { assets: [item] };
      }
      const client = createClient();
      const tokenService = createTokenService({ client });
      const [token] = await tokenService.getTokens({ addresses: [keyword] });
      if (token) {
        return {
          assets: [
            {
              ...token,
              logoURI: `https://placehold.co/100x100?text=${token.symbol}`,
            },
          ],
        };
      }
    } else {
      const pattern: Expression = {
        $or: [
          { name: `^${keyword}` },
          { name: `'${keyword}` },
          { symbol: `^${keyword}` },
          { symbol: `'${keyword}` },
        ],
      };
      const result = tokenFuse.search(pattern);
      return { assets: result.map((o) => o.item) };
    }
  });
}
