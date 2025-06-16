import { describe, it, expect, beforeAll } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { generatePixelArtWithStyle } from "../../src/tools/generatePixelArtWithStyle.js";
import { retryWithBackoff } from "../utils";

describe("MCP Tool: generate_image_bitforge", () => {
  let client: PixelLabClient;
  let resultsDir: string;
  let styleImage: Base64Image;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile(".env.development.secrets");
    resultsDir = path.join("tests", "results", "mcp-tools");
    await fs.mkdir(resultsDir, { recursive: true });

    // Create a style reference image for testing
    const styleResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "simple pixel art character",
          imageSize: { width: 64, height: 64 },
        });
      },
      8,
      15000
    );

    styleImage = styleResponse.image;
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );
    await styleImage.saveToFile(styleImagePath);
  });

  it("should generate pixel art with style reference", async () => {
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );

    const args = {
      description: "warrior with axe",
      style_image_path: styleImagePath,
      width: 64,
      height: 64,
      style_strength: 75.0,
      no_background: false,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await generatePixelArtWithStyle(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent).toBeDefined();

    // Check for either successful generation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("Generated pixel art")) {
      expect(textContent?.text).toContain("64×64");
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should handle different style strengths", async () => {
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );

    const args = {
      description: "mage casting spell",
      style_image_path: styleImagePath,
      width: 64,
      height: 64,
      style_strength: 25.0, // Low style strength
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await generatePixelArtWithStyle(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");

    // Check for either successful generation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("Generated pixel art")) {
      expect(textContent?.text).toContain("style strength: 25");
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should generate with no background", async () => {
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );

    const args = {
      description: "archer with bow",
      style_image_path: styleImagePath,
      width: 64,
      height: 64,
      style_strength: 50.0,
      no_background: true,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await generatePixelArtWithStyle(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");

    // Check for either successful generation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("Generated pixel art")) {
      expect(textContent?.text).toContain("archer with bow");
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should save to file when specified", async () => {
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );
    const outputPath = path.join(resultsDir, "mcp_bitforge_saved.png");

    const args = {
      description: "rogue with daggers",
      style_image_path: styleImagePath,
      width: 64,
      height: 64,
      style_strength: 60.0,
      save_to_file: outputPath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await generatePixelArtWithStyle(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();

    const textContent = response.content.find((c) => c.type === "text");

    // Only check file creation if generation was successful (not rate limited)
    if (textContent?.text.includes("Generated pixel art")) {
      // Verify file was created
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);

      expect(textContent?.text).toContain("64×64");
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should show image when show_image is true", async () => {
    const styleImagePath = path.join(
      resultsDir,
      "style_reference_bitforge.png"
    );

    const args = {
      description: "paladin with shield",
      style_image_path: styleImagePath,
      width: 64,
      height: 64,
      style_strength: 80.0,
      show_image: true,
    };

    const response = await retryWithBackoff(
      async () => {
        return await generatePixelArtWithStyle(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    // Should have both text and image content
    const textContent = response.content.find((c) => c.type === "text");
    const imageContent = response.content.find((c) => c.type === "image");

    expect(textContent).toBeDefined();

    // Only expect image content if generation was successful (not rate limited)
    if (textContent?.text.includes("Generated pixel art")) {
      expect(imageContent).toBeDefined();
      expect(imageContent?.data).toBeDefined();
      expect(imageContent?.mimeType).toBe("image/png");
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);
});
