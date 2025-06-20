import { describe, it, expect, beforeAll } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { estimateSkeleton } from "../../src/tools/estimateSkeleton.js";
import { retryWithBackoff } from "../utils";

describe("MCP Tool: estimate_skeleton", () => {
  let client: PixelLabClient;
  let resultsDir: string;
  let testCharacterImage: Base64Image;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile(".env.development.secrets");
    resultsDir = path.join("tests", "results", "mcp-tools");
    await fs.mkdir(resultsDir, { recursive: true });

    // Create a test character image for skeleton estimation
    const characterResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "pixel art human character standing upright",
          imageSize: { width: 128, height: 128 },
          noBackground: true,
        });
      },
      8,
      15000
    );

    testCharacterImage = characterResponse.image;
    const characterImagePath = path.join(
      resultsDir,
      "test_character_skeleton.png"
    );
    await testCharacterImage.saveToFile(characterImagePath);
  });

  it("should estimate skeleton from character image", async () => {
    const imagePath = path.join(resultsDir, "test_character_skeleton.png");

    const args = {
      image_path: imagePath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    const textContent = response.content.find((c) => c.type === "text");
    expect(textContent).toBeDefined();

    // Check for either successful estimation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("Estimated skeleton")) {
      expect(textContent?.text).toContain("keypoints detected");
      expect(textContent?.text).toMatch(/\d+/); // Should contain number of keypoints
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should provide detailed keypoint information", async () => {
    const imagePath = path.join(resultsDir, "test_character_skeleton.png");

    const args = {
      image_path: imagePath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    const textContents = response.content.filter((c) => c.type === "text");

    // Check if successful (should have 3 text contents) or rate limited (1 text content)
    if (textContents.length >= 3) {
      // Successful response
      // First content should be the main description
      expect(textContents[0]?.text).toContain("keypoints detected");

      // Third content should be the JSON metadata with coordinates
      const metadataText = textContents[2]?.text;
      expect(metadataText).toBeDefined();

      // Should contain coordinate information in JSON format
      expect(metadataText).toMatch(/"x":\s*\d+(\.\d+)?/); // x coordinate
      expect(metadataText).toMatch(/"y":\s*\d+(\.\d+)?/); // y coordinate

      // Should contain keypoint labels in the metadata
      const commonLabels = [
        "NOSE",
        "LEFT_EYE",
        "RIGHT_EYE",
        "LEFT_SHOULDER",
        "RIGHT_SHOULDER",
      ];
      const hasCommonLabel = commonLabels.some((label) =>
        metadataText.includes(label)
      );
      expect(hasCommonLabel).toBe(true);
    } else {
      // Rate limited response
      expect(textContents.length).toBeGreaterThanOrEqual(1);
      expect(textContents[0]?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 180000);

  it("should show image with skeleton when show_image is true", async () => {
    const imagePath = path.join(resultsDir, "test_character_skeleton.png");

    const args = {
      image_path: imagePath,
      show_image: true,
    };

    const response = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
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

    // Only expect image content if skeleton estimation was successful (not rate limited)
    if (textContent?.text.includes("keypoints detected")) {
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

  it("should handle different character poses", async () => {
    // Generate a character in a different pose
    const poseResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "pixel art character with arms raised",
          imageSize: { width: 128, height: 128 },
          noBackground: true,
        });
      },
      5,
      3000
    );

    const poseImagePath = path.join(resultsDir, "test_character_pose.png");
    await poseResponse.image.saveToFile(poseImagePath);

    const args = {
      image_path: poseImagePath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      5,
      3000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");

    // Check for either successful estimation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("keypoints detected")) {
      // Success case - all good
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 240000);

  it("should handle smaller character images", async () => {
    // Generate a smaller character image
    const smallResponse = await retryWithBackoff(
      async () => {
        return await client.generateImagePixflux({
          description: "pixel art character standing",
          imageSize: { width: 64, height: 64 },
          noBackground: true,
        });
      },
      8,
      15000
    );

    const smallImagePath = path.join(resultsDir, "test_character_small.png");
    await smallResponse.image.saveToFile(smallImagePath);

    const args = {
      image_path: smallImagePath,
      show_image: false,
    };

    const response = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      8,
      15000
    );

    expect(response).toBeDefined();
    const textContent = response.content.find((c) => c.type === "text");

    // Check for either successful estimation or rate limit (both are valid test outcomes)
    if (textContent?.text.includes("keypoints detected")) {
      // Success case - all good
    } else {
      // If rate limited, that's also a valid test outcome
      expect(textContent?.text).toMatch(
        /Error:.*wait longer between generations/
      );
    }
  }, 240000);

  it("should provide consistent keypoint structure", async () => {
    const imagePath = path.join(resultsDir, "test_character_skeleton.png");

    const args = {
      image_path: imagePath,
      show_image: false,
    };

    // Run estimation multiple times to check consistency
    const response1 = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      8,
      15000
    );

    const response2 = await retryWithBackoff(
      async () => {
        return await estimateSkeleton(args, client);
      },
      8,
      15000
    );

    expect(response1).toBeDefined();
    expect(response2).toBeDefined();

    const textContent1 = response1.content.find((c) => c.type === "text");
    const textContent2 = response2.content.find((c) => c.type === "text");

    // Check if both were successful or handle rate limiting
    if (
      textContent1?.text.includes("keypoints detected") &&
      textContent2?.text.includes("keypoints detected")
    ) {
      // Both successful - check consistency
      // Should have similar number of keypoints (within reasonable range)
      const keypoints1Match = textContent1?.text.match(
        /Estimated skeleton with (\d+) keypoints detected/
      );
      const keypoints2Match = textContent2?.text.match(
        /Estimated skeleton with (\d+) keypoints detected/
      );

      if (keypoints1Match && keypoints2Match) {
        const count1 = parseInt(keypoints1Match[1]);
        const count2 = parseInt(keypoints2Match[1]);

        expect(count1).toBeGreaterThan(0);
        expect(count2).toBeGreaterThan(0);
        // Should be consistent (allowing for small variations)
        expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(2);
      }
    } else {
      // At least one was rate limited - that's also a valid test outcome
      const errorPattern = /Error:.*wait longer between generations/;
      if (!textContent1?.text.includes("keypoints detected")) {
        expect(textContent1?.text).toMatch(errorPattern);
      }
      if (!textContent2?.text.includes("keypoints detected")) {
        expect(textContent2?.text).toMatch(errorPattern);
      }
    }
  }, 360000);
});
