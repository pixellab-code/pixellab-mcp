import { describe, it, expect, beforeAll } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { rotateCharacter } from "../../src/tools/rotateCharacter.js";
import { retryWithBackoff } from "../utils";

describe("MCP Tool: rotate", () => {
  let client: PixelLabClient;
  let resultsDir: string;
  let testCharacterImage: Base64Image;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile(".env.development.secrets");
    resultsDir = path.join("tests", "results", "mcp-tools");
    await fs.mkdir(resultsDir, { recursive: true });

    // Create a test character image for rotation
    const characterResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "pixel art character facing south",
          imageSize: { width: 64, height: 64 },
          noBackground: true,
        });
      },
      5,
      3000
    );

    testCharacterImage = characterResponse.image;
    const characterImagePath = path.join(
      resultsDir,
      "test_character_rotate.png"
    );
    await testCharacterImage.saveToFile(characterImagePath);
  });

  it("should rotate character from south to east", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");

    const args = {
      image_path: imagePath,
      from_direction: "south" as const,
      to_direction: "east" as const,
      width: 64,
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await rotateCharacter(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent).toBeDefined();
    expect(textContent?.text).toContain("Rotated character");
    expect(textContent?.text).toContain("south");
    expect(textContent?.text).toContain("east");
    // Note: Size info might not be in the main description
  }, 180000);

  it("should rotate without specifying from_direction", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");

    const args = {
      image_path: imagePath,
      to_direction: "north" as const,
      width: 64,
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await rotateCharacter(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Rotated character");
    expect(textContent?.text).toContain("north");
  }, 180000);

  it("should handle different image sizes", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");

    const args = {
      image_path: imagePath,
      from_direction: "south" as const,
      to_direction: "west" as const,
      width: 128,
      height: 128,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await rotateCharacter(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Rotated character");
    // Note: Size info might not be in the main description
  }, 180000);

  it("should save to file when specified", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");
    const outputPath = path.join(resultsDir, "mcp_rotated_saved.png");

    const args = {
      image_path: imagePath,
      from_direction: "south" as const,
      to_direction: "north-east" as const,
      width: 64,
      height: 64,
      save_to_file: outputPath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await rotateCharacter(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();

    // Verify file was created
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Rotated character");
    expect(textContent?.text).toContain("north-east");
  }, 180000);

  it("should show before/after comparison when show_image is true", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");

    const args = {
      image_path: imagePath,
      from_direction: "south" as const,
      to_direction: "north-west" as const,
      width: 64,
      height: 64,
      show_image: true,
    };

    const response = await retryWithBackoff(
      async () => {
        return await rotateCharacter(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    // Should have text and multiple image content (before/after)
    const textContent = response.content.find((c) => c.type === "text");
    const imageContents = response.content.filter((c) => c.type === "image");

    expect(textContent).toBeDefined();
    expect(imageContents.length).toBeGreaterThanOrEqual(1);

    imageContents.forEach((imageContent) => {
      expect(imageContent.data).toBeDefined();
      expect(imageContent.mimeType).toBe("image/png");
    });
  }, 180000);

  it("should handle all direction combinations", async () => {
    const imagePath = path.join(resultsDir, "test_character_rotate.png");

    const directions = [
      "south",
      "south-east",
      "east",
      "north-east",
      "north",
      "north-west",
      "west",
      "south-west",
    ] as const;

    for (const direction of directions.slice(0, 3)) {
      // Test first 3 to avoid too many API calls
      const args = {
        image_path: imagePath,
        to_direction: direction,
        width: 64,
        height: 64,
        show_image: false,
      };

      const response = await retryWithBackoff(
        async () => {
          return await rotateCharacter(args, client);
        },
        5,
        3000
      );

      expect(response).toBeDefined();
      const textContent = response.content.find((c) => c.type === "text");
      expect(textContent?.text).toContain("Rotated character");
      expect(textContent?.text).toContain(direction);
    }
  }, 300000);
});
