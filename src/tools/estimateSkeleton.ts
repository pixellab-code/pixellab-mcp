import { z } from "zod";
import { PixelLabClient, Base64Image } from "@pixellab-code/pixellab";
import { toMcpResponse, toMcpError, McpToolResponse } from "../utils.js";

export const estimateSkeletonSchema = z.object({
  image_path: z
    .string()
    .describe(
      "Path to the character image to analyze for skeleton/pose detection"
    ),
  show_image: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show the original image with skeleton data to the AI assistant for viewing and analysis"
    ),
});

export async function estimateSkeleton(
  args: z.infer<typeof estimateSkeletonSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
  try {
    // Load image
    const image = await Base64Image.fromFile(args.image_path);

    // Direct passthrough to pixellab-js
    const response = await client.estimateSkeleton({
      image,
    });

    const description = `Estimated skeleton with ${response.keypoints.length} keypoints detected`;
    const metadata = {
      parameters: args,
      keypointCount: response.keypoints.length,
      keypoints: response.keypoints.map((kp) => ({
        label: kp.label,
        position: { x: kp.x, y: kp.y },
        zIndex: kp.zIndex,
      })),
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };

    if (args.show_image) {
      // Show original image with skeleton data to AI
      return toMcpResponse(description, image, metadata);
    } else {
      // Text-only response with skeleton data
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
