import {
  TextContent,
  ImageContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { Base64Image, ImageSize } from "@pixellab-code/pixellab";
import { toMcpError, McpToolResponse } from "../utils.js";

const AnimateWithTextParamsSchema = z.object({
  description: z.string().min(1),
  action: z.string().min(1),
  reference_image_path: z.string(),
  width: z.number().min(16).max(512).default(64),
  height: z.number().min(16).max(512).default(64),
  view: z.enum(["side", "low top-down", "high top-down"]).default("side"),
  direction: z.enum([
    "south", "south-east", "east", "north-east", 
    "north", "north-west", "west", "south-west"
  ]).default("east"),
  negative_description: z.string().optional(),
  text_guidance_scale: z.number().min(1.0).max(20.0).default(7.5),
  image_guidance_scale: z.number().min(1.0).max(20.0).default(1.5),
  n_frames: z.number().min(1).max(20).default(4),
  start_frame_index: z.number().min(0).default(0),
  init_image_strength: z.number().min(1).max(999).default(300),
  seed: z.number().optional().default(0),
  save_to_file: z.string().optional(),
  show_image: z.boolean().default(false),
});

export async function animateWithText(
  args: z.infer<typeof AnimateWithTextParamsSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
  try {
    const params = AnimateWithTextParamsSchema.parse(args);

    // Load reference image
    const referenceImage = await Base64Image.fromFile(params.reference_image_path);
    const imageSize: ImageSize = { width: params.width, height: params.height };

    const result = await client.animateWithText({
      imageSize,
      description: params.description,
      action: params.action,
      referenceImage,
      view: params.view,
      direction: params.direction,
      negativeDescription: params.negative_description,
      textGuidanceScale: params.text_guidance_scale,
      imageGuidanceScale: params.image_guidance_scale,
      nFrames: params.n_frames,
      startFrameIndex: params.start_frame_index,
      initImageStrength: params.init_image_strength,
      seed: params.seed,
    });

    const contents: (TextContent | ImageContent)[] = [];

    if (result.images.length > 0) {
      // Save files if requested
      if (params.save_to_file) {
        for (let i = 0; i < result.images.length; i++) {
          const fileName = params.save_to_file.replace(/(\.[^.]+)?$/, `_frame${i}$1`);
          await result.images[i].saveToFile(fileName);
        }
        contents.push({
          type: "text",
          text: `Animated pixel art sequence with ${result.images.length} frames from text description: "${params.description}" with action: "${params.action}". Cost: $${result.usage.usd.toFixed(4)}. Files saved: ${params.save_to_file.replace(/(\.[^.]+)?$/, "_frame{0-" + (result.images.length - 1) + "}$1")}`,
        });
      } else {
        contents.push({
          type: "text", 
          text: `Animated pixel art sequence with ${result.images.length} frames from text description: "${params.description}" with action: "${params.action}". Cost: $${result.usage.usd.toFixed(4)}`,
        });
      }

      // Show images if requested
      if (params.show_image) {
        for (let i = 0; i < result.images.length; i++) {
          contents.push({
            type: "image",
            data: result.images[i].base64,
            mimeType: "image/png",
          });
        }
      }
    } else {
      contents.push({
        type: "text",
        text: "No animated frames were generated.",
      });
    }

    return { content: contents };
  } catch (error) {
    return toMcpError(error);
  }
} 