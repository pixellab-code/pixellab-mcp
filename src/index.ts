#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PixelLabClient } from "@pixellab-code/pixellab";
import { z } from "zod";
import * as dotenv from "dotenv";

// Import individual tools
import { generatePixelArt } from "./tools/generatePixelArt.js";
import { generatePixelArtWithStyle } from "./tools/generatePixelArtWithStyle.js";
import { getBalance } from "./tools/getBalance.js";
import { rotateCharacter } from "./tools/rotateCharacter.js";
import { inpaintPixelArt } from "./tools/inpaintPixelArt.js";
import { estimateSkeleton } from "./tools/estimateSkeleton.js";
import { animateWithSkeleton } from "./tools/animateWithSkeleton.js";
import { animateWithText } from "./tools/animateWithText.js";

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let secret = process.env.PIXELLAB_SECRET;
let baseUrl = "https://api.pixellab.ai/v1"; // Default to production

for (const arg of args) {
  if (arg.startsWith("--secret=")) {
    secret = arg.split("=")[1];
  } else if (arg.startsWith("--base-url=")) {
    baseUrl = arg.split("=")[1];
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
PixelLab MCP Server

Usage: pixellab-mcp [options]

Options:
  --secret=<key>      PixelLab API secret key (required)
  --base-url=<url>    API base URL (default: https://api.pixellab.ai/v1)
  --help, -h          Show this help message

Examples:
  pixellab-mcp --secret=your-api-key
  pixellab-mcp --secret=your-key --base-url=http://localhost:8000/v1
`);
    process.exit(0);
  }
}

if (!secret) {
  console.error(
    "Error: PixelLab API secret is required. Use --secret=your-api-key"
  );
  process.exit(1);
}

// Initialize PixelLab client
const client = new PixelLabClient(secret, baseUrl);

// Create MCP server
const server = new McpServer({
  name: "pixellab-mcp",
  description: "MCP server for PixelLab pixel art generation and editing API",
  version: "1.0.0",
});

// Register tools
server.tool(
  "generate_image_pixflux",
  "Generate pixel art from text description using Pixflux model. Perfect for creating characters, objects, and scenes in retro pixel art style.",
  {
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
  },
  async (args) => generatePixelArt(args, client)
);

server.tool(
  "generate_image_bitforge",
  "Generate pixel art using a reference style image with Bitforge model. Upload a style reference to match its artistic style while generating new content.",
  {
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
  },
  async (args) => generatePixelArtWithStyle(args, client)
);

server.tool(
  "get_balance",
  "Check your PixelLab API account balance and usage credits.",
  {},
  async (args) => getBalance(args, client)
);

server.tool(
  "rotate",
  "Rotate a character or object to face a different direction. Useful for creating sprite sheets or changing character poses.",
  {
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
      .describe(
        "Output image height in pixels (recommended: 32, 64, 128, 256)"
      ),
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
  },
  async (args) => rotateCharacter(args, client)
);

server.tool(
  "inpaint",
  "Edit specific regions of pixel art using a mask. Paint new elements like hats, armor, or accessories onto existing characters.",
  {
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
      .describe(
        "Output image height in pixels (recommended: 32, 64, 128, 256)"
      ),
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
  },
  async (args) => inpaintPixelArt(args, client)
);

server.tool(
  "estimate_skeleton",
  "Analyze a character image to detect skeleton/pose keypoints. Useful for understanding character structure and poses.",
  {
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
  },
  async (args) => estimateSkeleton(args, client)
);

server.tool(
  "animate_with_skeleton",
  "Create animated pixel art sequences using skeleton keyframes. Define keypoints for different poses to create smooth animations.",
  {
    skeleton_frames: z
      .array(z.object({
        keypoints: z.array(z.object({
          x: z.number().describe("X coordinate of the keypoint"),
          y: z.number().describe("Y coordinate of the keypoint"),
          label: z.enum([
            "NOSE", "NECK", "RIGHT SHOULDER", "RIGHT ELBOW", "RIGHT ARM",
            "LEFT SHOULDER", "LEFT ELBOW", "LEFT ARM", "RIGHT HIP", "RIGHT KNEE",
            "RIGHT LEG", "LEFT HIP", "LEFT KNEE", "LEFT LEG", "RIGHT EYE",
            "LEFT EYE", "RIGHT EAR", "LEFT EAR"
          ]).describe("Skeleton joint label"),
          z_index: z.number().default(0.0).describe("Depth ordering (higher = in front)"),
        })),
      }))
      .describe("Array of skeleton frames defining the animation sequence"),
    reference_image_path: z
      .string()
      .optional()
      .describe("Optional path to reference image for character appearance"),
    width: z
      .number()
      .default(64)
      .describe("Output image width in pixels (recommended: 32, 64, 128, 256)"),
    height: z
      .number()
      .default(64)
      .describe("Output image height in pixels (recommended: 32, 64, 128, 256)"),
    view: z
      .enum(["side", "low top-down", "high top-down"])
      .default("side")
      .describe("Camera viewpoint for the animation"),
    direction: z
      .enum([
        "south", "south-east", "east", "north-east", 
        "north", "north-west", "west", "south-west"
      ])
      .default("east")
      .describe("Character facing direction"),
    reference_guidance_scale: z
      .number()
      .min(1.0)
      .max(20.0)
      .default(1.1)
      .describe("How closely to follow reference image (1.0-20.0)"),
    pose_guidance_scale: z
      .number()
      .min(1.0)
      .max(20.0)
      .default(3.0)
      .describe("How closely to follow skeleton poses (1.0-20.0)"),
    isometric: z
      .boolean()
      .default(false)
      .describe("Use isometric projection"),
    oblique_projection: z
      .boolean()
      .default(false)
      .describe("Use oblique projection"),
    init_image_strength: z
      .number()
      .min(0)
      .max(1000)
      .default(300)
      .describe("Strength of initialization images (0-1000)"),
    seed: z
      .number()
      .default(0)
      .describe("Random seed for reproducible results"),
    save_to_file: z
      .string()
      .optional()
      .describe("Optional file path template to save animation frames (e.g., './animation.png')"),
    show_image: z
      .boolean()
      .default(false)
      .describe("Whether to show the generated animation frames to the AI assistant"),
  },
  async (args) => animateWithSkeleton(args, client)
);

server.tool(
  "animate_with_text",
  "Create animated pixel art sequences from text descriptions. Requires a reference character image and describes the action to animate.",
  {
    description: z
      .string()
      .min(1)
      .describe("Description of the character to animate (e.g., 'knight in armor', 'wizard with staff')"),
    action: z
      .string()
      .min(1)
      .describe("Action to animate (e.g., 'walking', 'swinging sword', 'casting spell')"),
    reference_image_path: z
      .string()
      .describe("Path to reference character image to animate"),
    width: z
      .number()
      .default(64)
      .describe("Output image width in pixels (recommended: 32, 64, 128, 256)"),
    height: z
      .number()
      .default(64)
      .describe("Output image height in pixels (recommended: 32, 64, 128, 256)"),
    view: z
      .enum(["side", "low top-down", "high top-down"])
      .default("side")
      .describe("Camera viewpoint for the animation"),
    direction: z
      .enum([
        "south", "south-east", "east", "north-east", 
        "north", "north-west", "west", "south-west"
      ])
      .default("east")
      .describe("Character facing direction"),
    negative_description: z
      .string()
      .optional()
      .describe("What to avoid in the animation (e.g., 'blurry, distorted')"),
    text_guidance_scale: z
      .number()
      .min(1.0)
      .max(20.0)
      .default(7.5)
      .describe("How closely to follow text description (1.0-20.0)"),
    image_guidance_scale: z
      .number()
      .min(1.0)
      .max(20.0)
      .default(1.5)
      .describe("How closely to follow reference image (1.0-20.0)"),
    n_frames: z
      .number()
      .min(1)
      .max(20)
      .default(4)
      .describe("Number of animation frames to generate (1-20)"),
    start_frame_index: z
      .number()
      .min(0)
      .default(0)
      .describe("Starting frame index (for continuing animations)"),
    init_image_strength: z
      .number()
      .min(1)
      .max(999)
      .default(300)
      .describe("Strength of initialization images (1-999)"),
    seed: z
      .number()
      .default(0)
      .describe("Random seed for reproducible results"),
    save_to_file: z
      .string()
      .optional()
      .describe("Optional file path template to save animation frames (e.g., './walk_cycle.png')"),
    show_image: z
      .boolean()
      .default(false)
      .describe("Whether to show the generated animation frames to the AI assistant"),
  },
  async (args) => animateWithText(args, client)
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PixelLab MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
