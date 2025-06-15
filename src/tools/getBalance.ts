import { z } from "zod";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { toMcpError, McpToolResponse } from "../utils.js";

export const getBalanceSchema = z.object({});

export async function getBalance(
  args: {},
  client: PixelLabClient
): Promise<McpToolResponse> {
  try {
    const balance = await client.getBalance();

    return {
      content: [
        {
          type: "text",
          text: `PixelLab Balance: $${balance.usd} USD\nAccount status: Active`,
        },
      ],
    };
  } catch (error) {
    return toMcpError(error);
  }
}
