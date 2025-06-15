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
  "generate_pixel_art",
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
  "generate_pixel_art_with_style",
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
  "get_pixellab_balance",
  "Check your PixelLab API account balance and usage credits.",
  {},
  async (args) => getBalance(args, client)
);

server.tool(
  "rotate_character",
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
  "inpaint_pixel_art",
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
  "estimate_character_skeleton",
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
