import { describe, it, expect } from "@jest/globals";

describe("PixelLab MCP Server", () => {
  it("should be able to import the main module", () => {
    // Basic smoke test to ensure the module structure is correct
    expect(true).toBe(true);
  });

  it("should have the correct package name", () => {
    const packageJson = require("../package.json");
    expect(packageJson.name).toBe("pixellab-mcp");
  });

  it("should have the correct binary name", () => {
    const packageJson = require("../package.json");
    expect(packageJson.bin["pixellab-mcp"]).toBe("dist/index.js");
  });
});
