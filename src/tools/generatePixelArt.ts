import { z } from "zod";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { toMcpResponse, toMcpError, McpToolResponse } from "../utils.js";

export const generatePixelArtSchema = z.object({
  description: z
    .string()
    .describe(
      "Text description of what to generate (e.g., 'cute dragon with sword', 'medieval knight')"
    ),
  width: z
    .number()
    .default(64)
    .describe("Image width in pixels (recommended: 32, 64, 128, 256)"),
  height: z
    .number()
    .default(64)
    .describe("Image height in pixels (recommended: 32, 64, 128, 256)"),
  negative_description: z
    .string()
    .optional()
    .describe(
      "What to avoid in the generation (e.g., 'blurry, ugly, distorted')"
    ),
  text_guidance_scale: z
    .number()
    .default(8.0)
    .describe(
      "How closely to follow the text description (1.0-20.0, higher = more faithful to prompt)"
    ),
  no_background: z
    .boolean()
    .default(false)
    .describe("Generate character without background (useful for sprites)"),
  outline: z
    .enum([
      "single color black outline",
      "single color outline",
      "selective outline",
      "lineless",
    ])
    .optional()
    .describe("Outline style for the pixel art"),
  shading: z
    .enum([
      "flat shading",
      "basic shading",
      "medium shading",
      "detailed shading",
      "highly detailed shading",
    ])
    .optional()
    .describe("Shading complexity level"),
  detail: z
    .enum(["low detail", "medium detail", "highly detailed"])
    .optional()
    .describe("Overall detail level of the generated art"),
  save_to_file: z
    .string()
    .optional()
    .describe(
      "Optional file path to save the generated image (e.g., './dragon.png')"
    ),
  show_image: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show the generated image to the AI assistant for viewing and analysis"
    ),
});

export async function generatePixelArt(
  args: z.infer<typeof generatePixelArtSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
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

    // Create response with optional image viewing
    const description = `Generated pixel art: ${args.description} (${args.width}×${args.height} pixels)`;
    const metadata = {
      parameters: args,
      dimensions: { width: args.width, height: args.height },
      filePath: args.save_to_file,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };

    if (args.show_image) {
      // Show image to AI for viewing and analysis
      return toMcpResponse(description, response.image, metadata);
    } else {
      // Text-only response
      return {
        content: [
          { type: "text", text: description },
          { type: "text", text: `Cost: $${response.usage.usd} USD` },
          { type: "text", text: JSON.stringify(metadata, null, 2) },
        ],
      };
    }
  } catch (error) {
    // Reuse existing error handling
    return toMcpError(error);
  }
}
