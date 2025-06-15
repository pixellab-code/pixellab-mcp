import { z } from "zod";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { toMcpResponse, toMcpError, McpToolResponse } from "../utils.js";

export const generatePixelArtWithStyleSchema = z.object({
  description: z
    .string()
    .describe(
      "Text description of what to generate (e.g., 'warrior holding shield')"
    ),
  style_image_path: z
    .string()
    .describe(
      "Path to reference style image that defines the art style to match"
    ),
  width: z
    .number()
    .default(64)
    .describe("Image width in pixels (recommended: 32, 64, 128, 256)"),
  height: z
    .number()
    .default(64)
    .describe("Image height in pixels (recommended: 32, 64, 128, 256)"),
  style_strength: z
    .number()
    .default(50.0)
    .describe(
      "How strongly to match the reference style (0-100, higher = more similar to reference)"
    ),
  no_background: z
    .boolean()
    .default(false)
    .describe("Generate character without background (useful for sprites)"),
  save_to_file: z
    .string()
    .optional()
    .describe(
      "Optional file path to save the generated image (e.g., './styled_character.png')"
    ),
  show_image: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show the generated image to the AI assistant for viewing and analysis"
    ),
});

export async function generatePixelArtWithStyle(
  args: z.infer<typeof generatePixelArtWithStyleSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
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

    const description = `Generated pixel art with style: ${args.description} (${args.width}×${args.height} pixels, style strength: ${args.style_strength}%)`;
    const metadata = {
      parameters: args,
      styleReference: args.style_image_path,
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
    return toMcpError(error);
  }
}
