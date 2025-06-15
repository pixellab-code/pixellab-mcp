#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";

// Reuse everything from pixellab-js
import {
  PixelLabClient,
  Base64Image,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  HttpError,
} from "@pixellab-code/pixellab";

import { toMcpResponse, toMcpError, toMcpComparison } from "./utils.js";

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let pixellabSecret: string | undefined;
let baseUrl: string | undefined;

// Parse arguments in format: --secret=value --base-url=value
for (const arg of args) {
  if (arg.startsWith("--secret=")) {
    pixellabSecret = arg.split("=", 2)[1];
  } else if (arg.startsWith("--base-url=")) {
    baseUrl = arg.split("=", 2)[1];
  }
}

// Initialize PixelLab client with priority: CLI args > env vars
let client: PixelLabClient;
try {
  const secret = pixellabSecret || process.env.PIXELLAB_SECRET;
  const apiBaseUrl =
    baseUrl || process.env.PIXELLAB_BASE_URL || "https://api.pixellab.ai/v1";

  if (!secret) {
    throw new Error(
      "PixelLab secret is required. Provide via --secret=your-key or PIXELLAB_SECRET environment variable"
    );
  }

  client = new PixelLabClient(secret, apiBaseUrl);
} catch (error) {
  console.error("Failed to initialize PixelLab client:", error);
  console.error("\nUsage:");
  console.error("  mcp-pixellab --secret=your-pixellab-secret");
  console.error("\nDevelopment (with custom API endpoint):");
  console.error(
    "  mcp-pixellab --secret=your-key --base-url=http://localhost:8000"
  );
  console.error("\nOr set environment variables:");
  console.error("  PIXELLAB_SECRET=your-key mcp-pixellab");
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: "mcp-pixellab",
  description:
    "MCP server for PixelLab pixel art generation and manipulation. Generate characters, items, animations, and edit pixel art using AI-powered tools.",
  version: "1.0.0",
});

// Tool 1: Generate Pixel Art (Pixflux) - High Priority
server.tool(
  "generate_pixel_art",
  "Generate pixel art characters, items, and environments from text descriptions",
  {
    description: z.string().describe("Text description of what to generate"),
    width: z.number().default(64).describe("Image width in pixels"),
    height: z.number().default(64).describe("Image height in pixels"),
    negative_description: z
      .string()
      .optional()
      .describe("What to avoid in the generation"),
    text_guidance_scale: z
      .number()
      .default(8.0)
      .describe("How closely to follow the text (higher = more faithful)"),
    no_background: z
      .boolean()
      .default(false)
      .describe("Generate without background"),
    outline: z
      .enum([
        "single color black outline",
        "single color outline",
        "selective outline",
        "lineless",
      ])
      .optional()
      .describe("Outline style"),
    shading: z
      .enum([
        "flat shading",
        "basic shading",
        "medium shading",
        "detailed shading",
        "highly detailed shading",
      ])
      .optional()
      .describe("Shading style"),
    detail: z
      .enum(["low detail", "medium detail", "highly detailed"])
      .optional()
      .describe("Detail level"),
    save_to_file: z
      .string()
      .optional()
      .describe("Path to save the generated image"),
  },
  async (args) => {
    try {
      // Direct passthrough to pixellab-js - no duplication
      const response = await client.generateImagePixflux({
        description: args.description,
        imageSize: { width: args.width, height: args.height },
        negativeDescription: args.negative_description,
        textGuidanceScale: args.text_guidance_scale,
        noBackground: args.no_background,
        outline: args.outline,
        shading: args.shading,
        detail: args.detail,
      });

      // Optional file save using existing Base64Image.saveToFile()
      if (args.save_to_file) {
        await response.image.saveToFile(args.save_to_file);
      }

      // Simple format conversion only
      return toMcpResponse(
        `Generated pixel art: ${args.description} (${args.width}×${args.height} pixels)`,
        response.image,
        {
          parameters: args,
          dimensions: { width: args.width, height: args.height },
          filePath: args.save_to_file,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      // Reuse existing error handling
      return toMcpError(error);
    }
  }
);

// Tool 2: Get PixelLab Balance - High Priority
server.tool(
  "get_pixellab_balance",
  "Check available PixelLab API credits",
  {},
  async () => {
    try {
      const balance = await client.getBalance();

      return {
        content: [
          {
            type: "text",
            text: `PixelLab Balance: ${balance.usd} USD\nAccount status: Active`,
          },
        ],
      };
    } catch (error) {
      return toMcpError(error);
    }
  }
);

// Tool 3: Generate Pixel Art with Style (Bitforge) - High Priority
server.tool(
  "generate_pixel_art_with_style",
  "Generate pixel art using a reference image to match a specific art style",
  {
    description: z.string().describe("Text description of what to generate"),
    style_image_path: z.string().describe("Path to reference style image"),
    width: z.number().default(64).describe("Image width in pixels"),
    height: z.number().default(64).describe("Image height in pixels"),
    style_strength: z
      .number()
      .default(50.0)
      .describe("How strongly to match the style (0-100)"),
    no_background: z
      .boolean()
      .default(false)
      .describe("Generate without background"),
    save_to_file: z
      .string()
      .optional()
      .describe("Path to save the generated image"),
  },
  async (args) => {
    try {
      // Load style image using Base64Image
      const styleImage = await Base64Image.fromFile(args.style_image_path);

      // Direct passthrough to pixellab-js
      const response = await client.generateImageBitforge({
        description: args.description,
        imageSize: { width: args.width, height: args.height },
        styleImage,
        styleStrength: args.style_strength,
        noBackground: args.no_background,
      });

      // Optional file save
      if (args.save_to_file) {
        await response.image.saveToFile(args.save_to_file);
      }

      return toMcpResponse(
        `Generated pixel art with style: ${args.description} (${args.width}×${args.height} pixels, style strength: ${args.style_strength}%)`,
        response.image,
        {
          parameters: args,
          styleReference: args.style_image_path,
          dimensions: { width: args.width, height: args.height },
          filePath: args.save_to_file,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      return toMcpError(error);
    }
  }
);

// Tool 4: Rotate Character - Medium Priority
server.tool(
  "rotate_character",
  "Generate rotated views of characters and objects",
  {
    image_path: z.string().describe("Path to character/object image"),
    from_direction: z
      .enum([
        "south",
        "south-east",
        "east",
        "north-east",
        "north",
        "north-west",
        "west",
        "south-west",
      ])
      .optional()
      .describe("Current direction of the character"),
    to_direction: z
      .enum([
        "south",
        "south-east",
        "east",
        "north-east",
        "north",
        "north-west",
        "west",
        "south-west",
      ])
      .describe("Direction to rotate to"),
    width: z.number().default(64).describe("Image width in pixels"),
    height: z.number().default(64).describe("Image height in pixels"),
    save_to_file: z
      .string()
      .optional()
      .describe("Path to save the rotated image"),
  },
  async (args) => {
    try {
      // Load original image
      const originalImage = await Base64Image.fromFile(args.image_path);

      // Direct passthrough to pixellab-js
      const response = await client.rotate({
        imageSize: { width: args.width, height: args.height },
        fromImage: originalImage,
        fromDirection: args.from_direction,
        toDirection: args.to_direction,
      });

      // Optional file save
      if (args.save_to_file) {
        await response.image.saveToFile(args.save_to_file);
      }

      return toMcpComparison(
        `Rotated character from ${args.from_direction || "current view"} to ${
          args.to_direction
        }`,
        originalImage,
        response.image,
        {
          parameters: args,
          dimensions: { width: args.width, height: args.height },
          filePath: args.save_to_file,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      return toMcpError(error);
    }
  }
);

// Tool 5: Inpaint Pixel Art - Medium Priority
server.tool(
  "inpaint_pixel_art",
  "Edit existing pixel art by inpainting specific regions",
  {
    image_path: z.string().describe("Path to image to edit"),
    mask_path: z
      .string()
      .describe("Path to mask image (white = edit, black = keep)"),
    description: z
      .string()
      .describe("Description of what to paint in the masked area"),
    width: z.number().default(64).describe("Image width in pixels"),
    height: z.number().default(64).describe("Image height in pixels"),
    save_to_file: z
      .string()
      .optional()
      .describe("Path to save the edited image"),
  },
  async (args) => {
    try {
      // Load original and mask images
      const originalImage = await Base64Image.fromFile(args.image_path);
      const maskImage = await Base64Image.fromFile(args.mask_path);

      // Direct passthrough to pixellab-js
      const response = await client.inpaint({
        description: args.description,
        imageSize: { width: args.width, height: args.height },
        inpaintingImage: originalImage,
        maskImage: maskImage,
      });

      // Optional file save
      if (args.save_to_file) {
        await response.image.saveToFile(args.save_to_file);
      }

      return toMcpComparison(
        `Inpainted pixel art: ${args.description}`,
        originalImage,
        response.image,
        {
          parameters: args,
          dimensions: { width: args.width, height: args.height },
          filePath: args.save_to_file,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      return toMcpError(error);
    }
  }
);

// Tool 6: Estimate Character Skeleton - Medium Priority
server.tool(
  "estimate_character_skeleton",
  "Extract skeleton structure from character images",
  {
    image_path: z.string().describe("Path to character image"),
    save_visualization: z
      .string()
      .optional()
      .describe("Path to save skeleton visualization"),
  },
  async (args) => {
    try {
      // Load character image
      const characterImage = await Base64Image.fromFile(args.image_path);

      // Direct passthrough to pixellab-js
      const response = await client.estimateSkeleton({
        image: characterImage,
      });

      // Create visualization if requested (simple overlay for now)
      if (args.save_visualization) {
        // For now, save the original image - could enhance with skeleton overlay
        await characterImage.saveToFile(args.save_visualization);
      }

      return {
        content: [
          {
            type: "text",
            text: `Estimated skeleton for character image: ${response.keypoints.length} keypoints detected`,
          },
          {
            type: "image",
            data: characterImage.dataUrl,
            mimeType: "image/png",
          },
          { type: "text", text: "Skeleton data:" },
          {
            type: "text",
            text: JSON.stringify(
              {
                keypoints: response.keypoints,
                usage: response.usage,
                parameters: args,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return toMcpError(error);
    }
  }
);

// Start the server using stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch((error: unknown) => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
});

console.error("PixelLab MCP server started in stdio mode");
