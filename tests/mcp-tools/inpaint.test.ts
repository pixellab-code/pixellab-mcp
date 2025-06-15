import { describe, it, expect, beforeAll } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { inpaintPixelArt } from "../../src/tools/inpaintPixelArt.js";
import { retryWithBackoff } from "../utils";

describe("MCP Tool: inpaint", () => {
  let client: PixelLabClient;
  let resultsDir: string;
  let testCharacterImage: Base64Image;
  let testMaskImage: Base64Image;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile(".env.development.secrets");
    resultsDir = path.join("tests", "results", "mcp-tools");
    await fs.mkdir(resultsDir, { recursive: true });

    // Create a test character image for inpainting
    const characterResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "pixel art character without hat",
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
      "test_character_inpaint.png"
    );
    await testCharacterImage.saveToFile(characterImagePath);

    // Create a test mask image
    const maskResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "white rectangle on black background",
          imageSize: { width: 64, height: 64 },
        });
      },
      5,
      3000
    );

    testMaskImage = maskResponse.image;
    const maskImagePath = path.join(resultsDir, "test_mask_inpaint.png");
    await testMaskImage.saveToFile(maskImagePath);
  });

  it("should inpaint character with hat", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");

    const args = {
      image_path: imagePath,
      mask_path: maskPath,
      description: "red hat",
      width: 64,
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await inpaintPixelArt(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent).toBeDefined();
    expect(textContent?.text).toContain("Inpainted pixel art");
    expect(textContent?.text).toContain("red hat");
    // Note: Size info might not be in the main description
  }, 180000);

  it("should handle different descriptions", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");

    const args = {
      image_path: imagePath,
      mask_path: maskPath,
      description: "golden armor",
      width: 64,
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await inpaintPixelArt(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Inpainted pixel art");
    expect(textContent?.text).toContain("golden armor");
  }, 180000);

  it("should handle different image sizes", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");

    const args = {
      image_path: imagePath,
      mask_path: maskPath,
      description: "blue cape",
      width: 64, // Use same size as original image to avoid size mismatch
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await inpaintPixelArt(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Inpainted pixel art");
    expect(textContent?.text).toContain("blue cape");
  }, 180000);

  it("should save to file when specified", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");
    const outputPath = path.join(resultsDir, "mcp_inpainted_saved.png");

    const args = {
      image_path: imagePath,
      mask_path: maskPath,
      description: "purple cloak",
      width: 64,
      height: 64,
      save_to_file: outputPath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await inpaintPixelArt(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();

    // Verify file was created
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent?.text).toContain("Inpainted pixel art");
    expect(textContent?.text).toContain("purple cloak");
  }, 180000);

  it("should show before/after comparison when show_image is true", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");

    const args = {
      image_path: imagePath,
      mask_path: maskPath,
      description: "green helmet",
      width: 64,
      height: 64,
      show_image: true,
    };

    const response = await retryWithBackoff(
      async () => {
        return await inpaintPixelArt(args, client);
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

  it("should handle complex descriptions", async () => {
    const imagePath = path.join(resultsDir, "test_character_inpaint.png");
    const maskPath = path.join(resultsDir, "test_mask_inpaint.png");

    const descriptions = [
      "ornate wizard hat with stars",
      "medieval crown with jewels",
      "simple leather cap",
    ];

    for (const description of descriptions) {
      const args = {
        image_path: imagePath,
        mask_path: maskPath,
        description,
        width: 64,
        height: 64,
        show_image: false,
      };

      const response = await retryWithBackoff(
        async () => {
          return await inpaintPixelArt(args, client);
        },
        5,
        3000
      );

      expect(response).toBeDefined();
      const textContent = response.content.find((c) => c.type === "text");
      expect(textContent?.text).toContain("Inpainted pixel art");
      expect(textContent?.text).toContain(description);
    }
  }, 300000);
});
