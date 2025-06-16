import {
  TextContent,
  ImageContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { Base64Image, Keypoint, ImageSize } from "@pixellab-code/pixellab";
import { toMcpError, McpToolResponse } from "../utils.js";

const AnimateWithSkeletonParamsSchema = z.object({
  skeleton_frames: z.array(z.object({
    keypoints: z.array(z.object({
      x: z.number(),
      y: z.number(), 
      label: z.enum([
        "NOSE", "NECK", "RIGHT SHOULDER", "RIGHT ELBOW", "RIGHT ARM",
        "LEFT SHOULDER", "LEFT ELBOW", "LEFT ARM", "RIGHT HIP", "RIGHT KNEE",
        "RIGHT LEG", "LEFT HIP", "LEFT KNEE", "LEFT LEG", "RIGHT EYE",
        "LEFT EYE", "RIGHT EAR", "LEFT EAR"
      ]),
      z_index: z.number().optional().default(0.0),
    })),
  })),
  reference_image_path: z.string().optional(),
  width: z.number().min(16).max(512).default(64),
  height: z.number().min(16).max(512).default(64),
  view: z.enum(["side", "low top-down", "high top-down"]).default("side"),
  direction: z.enum([
    "south", "south-east", "east", "north-east", 
    "north", "north-west", "west", "south-west"
  ]).default("east"),
  reference_guidance_scale: z.number().min(1.0).max(20.0).default(1.1),
  pose_guidance_scale: z.number().min(1.0).max(20.0).default(3.0),
  isometric: z.boolean().default(false),
  oblique_projection: z.boolean().default(false),
  init_image_strength: z.number().min(0).max(1000).default(300),
  seed: z.number().optional().default(0),
  save_to_file: z.string().optional(),
  show_image: z.boolean().default(false),
});

export async function animateWithSkeleton(
  args: z.infer<typeof AnimateWithSkeletonParamsSchema>,
  client: PixelLabClient
): Promise<McpToolResponse> {
  try {
    const params = AnimateWithSkeletonParamsSchema.parse(args);

    // Convert skeleton frames to the expected format
    const skeletonKeypoints = params.skeleton_frames.map(frame => ({
      keypoints: frame.keypoints.map(kp => ({
        x: kp.x,
        y: kp.y,
        label: kp.label,
        zIndex: kp.z_index,
      } as Keypoint))
    }));

    // Load reference image if provided
    let referenceImage: Base64Image | undefined;
    if (params.reference_image_path) {
      referenceImage = await Base64Image.fromFile(params.reference_image_path);
    }

    const imageSize: ImageSize = { width: params.width, height: params.height };

    const result = await client.animateWithSkeleton({
      imageSize,
      skeletonKeypoints,
      view: params.view,
      direction: params.direction,
      referenceGuidanceScale: params.reference_guidance_scale,
      poseGuidanceScale: params.pose_guidance_scale,
      isometric: params.isometric,
      obliqueProjection: params.oblique_projection,
      referenceImage,
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
          text: `Animated pixel art sequence with ${result.images.length} frames using skeleton keypoints. Cost: $${result.usage.usd.toFixed(4)}. Files saved: ${params.save_to_file.replace(/(\.[^.]+)?$/, "_frame{0-" + (result.images.length - 1) + "}$1")}`,
        });
      } else {
        contents.push({
          type: "text", 
          text: `Animated pixel art sequence with ${result.images.length} frames using skeleton keypoints. Cost: $${result.usage.usd.toFixed(4)}`,
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