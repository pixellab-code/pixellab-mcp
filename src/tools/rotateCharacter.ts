import { z } from "zod";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { toMcpComparison, toMcpError, McpToolResponse } from "../utils.js";

export const rotateCharacterSchema = z.object({
  image_path: z
    .string()
    .describe("Path to the character or object image to rotate"),
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
    .describe(
      "Current direction the character is facing (if known, helps with accuracy)"
    ),
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
    .describe("Target direction to rotate the character to face"),
  width: z
    .number()
    .default(64)
    .describe("Output image width in pixels (recommended: 32, 64, 128, 256)"),
  height: z
    .number()
    .default(64)
    .describe("Output image height in pixels (recommended: 32, 64, 128, 256)"),
  save_to_file: z
    .string()
    .optional()
    .describe(
      "Optional file path to save the rotated image (e.g., './character_east.png')"
    ),
  show_image: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show the before/after comparison to the AI assistant for viewing and analysis"
    ),
});

export async function rotateCharacter(
  args: z.infer<typeof rotateCharacterSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
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

    const description = `Rotated character from ${
      args.from_direction || "current view"
    } to ${args.to_direction}`;
    const metadata = {
      parameters: args,
      dimensions: { width: args.width, height: args.height },
      filePath: args.save_to_file,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };

    if (args.show_image) {
      // Show before/after comparison to AI
      return toMcpComparison(
        description,
        originalImage,
        response.image,
        metadata
      );
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
