import { describe, it, expect, beforeAll } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { retryWithBackoff } from "./utils";

describe("MCP Tools Integration Tests", () => {
  let client: PixelLabClient;
  let resultsDir: string;

  beforeAll(async () => {
    // Initialize client from environment file
    client = PixelLabClient.fromEnvFile(".env.development.secrets");

    // Create results directory for test outputs
    resultsDir = path.join("tests", "results");
    await fs.mkdir(resultsDir, { recursive: true });
  });

  describe("generate_image_pixflux", () => {
    it("should generate basic pixel art", async () => {
      const response = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "cute dragon with sword",
            imageSize: { width: 64, height: 64 },
            textGuidanceScale: 8.0,
            noBackground: false,
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(response.image).toBeInstanceOf(Base64Image);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save test result
      const outputPath = path.join(
        resultsDir,
        "generate_image_pixflux_basic.png"
      );
      await response.image.saveToFile(outputPath);

      console.log(`✓ Generated basic pixel art: ${outputPath}`);
      console.log(`  Usage: $${response.usage.usd.toFixed(4)} USD`);
    }, 300000);

    it("should generate styled pixel art", async () => {
      const response = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "medieval knight with shield",
            imageSize: { width: 128, height: 128 },
            textGuidanceScale: 10.0,
            noBackground: true,
            outline: "single color black outline",
            shading: "detailed shading",
            detail: "highly detailed",
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(response.image).toBeInstanceOf(Base64Image);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save test result
      const outputPath = path.join(
        resultsDir,
        "generate_image_pixflux_styled.png"
      );
      await response.image.saveToFile(outputPath);

      console.log(`✓ Generated styled pixel art: ${outputPath}`);
    }, 300000);
  });

  describe("generate_image_bitforge", () => {
    it("should generate pixel art using style reference", async () => {
      // First generate a style reference image
      const styleResponse = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "simple pixel art character",
            imageSize: { width: 64, height: 64 },
          });
        },
        8,
        10000
      );

      const styleImagePath = path.join(resultsDir, "style_reference.png");
      await styleResponse.image.saveToFile(styleImagePath);

      // Now use it as style reference
      const response = await retryWithBackoff(
        async () => {
          return await client.generateImageBitforge({
            description: "warrior with axe",
            styleImage: styleResponse.image,
            imageSize: { width: 64, height: 64 },
            styleStrength: 75.0,
            noBackground: false,
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(response.image).toBeInstanceOf(Base64Image);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save test result
      const outputPath = path.join(resultsDir, "generate_image_bitforge.png");
      await response.image.saveToFile(outputPath);

      console.log(`✓ Generated style-transfer pixel art: ${outputPath}`);
    }, 600000);
  });

  describe("get_balance", () => {
    it("should retrieve account balance", async () => {
      const response = await retryWithBackoff(
        async () => {
          return await client.getBalance();
        },
        3,
        1000
      );

      expect(response).toBeDefined();
      expect(response.type).toBe("usd");
      expect(typeof response.usd).toBe("number");
      expect(response.usd).toBeGreaterThanOrEqual(0);

      console.log(`✓ Account balance: $${response.usd.toFixed(2)} USD`);
    }, 60000);
  });

  describe("rotate", () => {
    it("should rotate character to different direction", async () => {
      // First generate a character to rotate
      const characterResponse = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "pixel art character facing south",
            imageSize: { width: 64, height: 64 },
            noBackground: true,
          });
        },
        8,
        10000
      );

      const originalPath = path.join(resultsDir, "character_original.png");
      await characterResponse.image.saveToFile(originalPath);

      // Rotate the character
      const response = await retryWithBackoff(
        async () => {
          return await client.rotate({
            fromImage: characterResponse.image,
            fromDirection: "south",
            toDirection: "east",
            imageSize: { width: 64, height: 64 },
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(response.image).toBeInstanceOf(Base64Image);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save test result
      const outputPath = path.join(resultsDir, "rotate_character.png");
      await response.image.saveToFile(outputPath);

      console.log(`✓ Rotated character: ${outputPath}`);
    }, 600000);
  });

  describe("estimate_skeleton", () => {
    it("should extract skeleton from character image", async () => {
      // First generate a character for skeleton estimation
      const characterResponse = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "pixel art human character standing",
            imageSize: { width: 128, height: 128 },
            noBackground: true,
          });
        },
        8,
        10000
      );

      const characterPath = path.join(resultsDir, "character_for_skeleton.png");
      await characterResponse.image.saveToFile(characterPath);

      // Estimate skeleton
      const response = await retryWithBackoff(
        async () => {
          return await client.estimateSkeleton({
            image: characterResponse.image,
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(Array.isArray(response.keypoints)).toBe(true);
      expect(response.keypoints.length).toBeGreaterThan(0);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Check keypoint structure
      const firstKeypoint = response.keypoints[0];
      expect(firstKeypoint).toHaveProperty("x");
      expect(firstKeypoint).toHaveProperty("y");
      expect(firstKeypoint).toHaveProperty("zIndex");
      expect(firstKeypoint).toHaveProperty("label");

      console.log(`✓ Detected ${response.keypoints.length} skeleton keypoints`);
      console.log(
        `  First keypoint: ${firstKeypoint.label} at (${firstKeypoint.x}, ${firstKeypoint.y})`
      );
    }, 600000);
  });

  describe("inpaint", () => {
    it("should edit pixel art using mask", async () => {
      // First generate a character to edit
      const characterResponse = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "pixel art character without hat",
            imageSize: { width: 64, height: 64 },
            noBackground: true,
          });
        },
        8,
        10000
      );

      const originalPath = path.join(
        resultsDir,
        "character_before_inpaint.png"
      );
      await characterResponse.image.saveToFile(originalPath);

      // Create a simple mask for the head area (white pixels = edit area)
      // This is a simplified mask - in practice you'd create a proper mask image
      const maskResponse = await retryWithBackoff(
        async () => {
          return await client.generateImagePixflux({
            description: "white rectangle on black background",
            imageSize: { width: 64, height: 64 },
          });
        },
        8,
        10000
      );

      const maskPath = path.join(resultsDir, "inpaint_mask.png");
      await maskResponse.image.saveToFile(maskPath);

      // Perform inpainting
      const response = await retryWithBackoff(
        async () => {
          return await client.inpaint({
            inpaintingImage: characterResponse.image,
            maskImage: maskResponse.image,
            description: "red hat",
            imageSize: { width: 64, height: 64 },
          });
        },
        8,
        10000
      );

      expect(response).toBeDefined();
      expect(response.image).toBeInstanceOf(Base64Image);
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save test result
      const outputPath = path.join(resultsDir, "inpaint_result.png");
      await response.image.saveToFile(outputPath);

      console.log(`✓ Inpainted character: ${outputPath}`);
    }, 900000);
  });
});
