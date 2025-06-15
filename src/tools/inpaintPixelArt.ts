import { z } from "zod";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { toMcpComparison, toMcpError, McpToolResponse } from "../utils.js";

export const inpaintPixelArtSchema = z.object({
  image_path: z
    .string()
    .describe("Path to the original pixel art image to edit"),
  mask_path: z
    .string()
    .describe(
      "Path to mask image where white pixels = areas to edit/replace, black pixels = areas to keep unchanged"
    ),
  description: z
    .string()
    .describe(
      "Description of what to paint in the masked area (e.g., 'red hat', 'golden armor', 'blue cape')"
    ),
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
      "Optional file path to save the edited image (e.g., './character_with_hat.png')"
    ),
  show_image: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show the before/after comparison to the AI assistant for viewing and analysis"
    ),
});

export async function inpaintPixelArt(
  args: z.infer<typeof inpaintPixelArtSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
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

    const description = `Inpainted pixel art: ${args.description}`;
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
