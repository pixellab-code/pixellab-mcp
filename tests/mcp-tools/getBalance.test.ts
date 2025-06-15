import { describe, it, expect, beforeAll } from "@jest/globals";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { getBalance } from "../../src/tools/getBalance.js";
import { retryWithBackoff } from "../utils";

describe("MCP Tool: get_balance", () => {
  let client: PixelLabClient;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile(".env.development.secrets");
  });

  it("should retrieve account balance", async () => {
    const args = {};

    const response = await retryWithBackoff(
      async () => {
        return await getBalance(args, client);
      },
      3,
      1000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent).toBeDefined();
    expect(textContent?.text).toContain("PixelLab Balance");
    expect(textContent?.text).toContain("USD");
    expect(textContent?.text).toMatch(/\$\d+\.\d+/); // Should contain dollar amount
  }, 30000);

  it("should handle multiple balance checks", async () => {
    const args = {};

    // Make multiple calls to ensure consistency
    const response1 = await getBalance(args, client);
    const response2 = await getBalance(args, client);

    expect(response1).toBeDefined();
    expect(response2).toBeDefined();

    const textContent1 = response1.content.find((c) => c.type === "text");
    const textContent2 = response2.content.find((c) => c.type === "text");

    expect(textContent1?.text).toContain("PixelLab Balance");
    expect(textContent2?.text).toContain("PixelLab Balance");

    // Balance should be consistent (or slightly lower due to usage)
    const balance1Match = textContent1?.text.match(/\$(\d+\.\d+)/);
    const balance2Match = textContent2?.text.match(/\$(\d+\.\d+)/);

    expect(balance1Match).toBeTruthy();
    expect(balance2Match).toBeTruthy();

    if (balance1Match && balance2Match) {
      const balance1 = parseFloat(balance1Match[1]);
      const balance2 = parseFloat(balance2Match[1]);

      expect(balance1).toBeGreaterThanOrEqual(0);
      expect(balance2).toBeGreaterThanOrEqual(0);
      expect(balance2).toBeLessThanOrEqual(balance1); // Should not increase
    }
  }, 60000);
});
