# PixelLab MCP Server

Model Context Protocol (MCP) server for PixelLab pixel art generation and manipulation. This server enables AI assistants like Claude to generate, edit, and manipulate pixel art using PixelLab's AI-powered API.

## Features

- 🎨 **Generate Pixel Art**: Create characters, items, and environments from text descriptions
- 🎭 **Style Transfer**: Generate pixel art using reference images for style matching
- 🔄 **Image Rotation**: Generate rotated views of characters and objects
- ✏️ **Inpainting**: Edit existing pixel art by painting in specific regions
- 🦴 **Skeleton Estimation**: Extract skeleton structure from character images
- 💰 **Balance Checking**: Monitor PixelLab API credits
- 👁️ **AI Vision**: Generated images are immediately visible to AI assistants

## Installation

### Prerequisites

- Node.js 18 or higher (required for MCP SDK compatibility)
- PixelLab API key (get one at [pixellab.ai](https://pixellab.ai))

### Install Globally (Required for MCP Clients)

For use with MCP clients like Cursor, Claude Desktop, etc., you **must install globally**:

```bash
npm install -g pixellab-mcp
```

## Configuration

Add to your MCP client configuration (e.g., Cursor or Claude Desktop) with your PixelLab secret:

```json
{
  "mcpServers": {
    "pixellab": {
      "command": "npx",
      "args": ["pixellab-mcp", "--secret=your-pixellab-secret-here"]
    }
  }
}
```

## Available Tools

### 1. `generate_image_pixflux`

Generate pixel art from text descriptions using PixelLab's Pixflux model.

**Parameters:**

- `description` (required): Text description of what to generate (e.g., "cute dragon with sword", "medieval knight")
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `negative_description` (optional): What to avoid in the generation (e.g., "blurry, ugly, distorted")
- `text_guidance_scale` (default: 8.0): How closely to follow the text description (1.0-20.0)
- `no_background` (default: false): Generate without background (useful for sprites)
- `outline` (optional): Outline style ("single color black outline", "selective outline", "lineless", etc.)
- `shading` (optional): Shading style ("flat shading", "basic shading", "detailed shading", etc.)
- `detail` (optional): Detail level ("low detail", "medium detail", "highly detailed")
- `save_to_file` (optional): Path to save the generated image (e.g., "./dragon.png")
- `show_image` (default: false): Show the generated image to the AI assistant for viewing

### 2. `generate_image_bitforge`

Generate pixel art using a reference image for style matching (Bitforge model).

**Parameters:**

- `description` (required): Text description of what to generate (e.g., "warrior holding shield")
- `style_image_path` (required): Path to reference style image
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `style_strength` (default: 50.0): How strongly to match the style (0-100)
- `no_background` (default: false): Generate without background
- `save_to_file` (optional): Path to save the generated image (e.g., "./styled_character.png")
- `show_image` (default: false): Show the generated image to the AI assistant for viewing

### 3. `rotate`

Generate rotated views of characters and objects.

**Parameters:**

- `image_path` (required): Path to character/object image
- `from_direction` (optional): Current direction ("south", "east", "north", "west", etc.)
- `to_direction` (required): Direction to rotate to ("south", "east", "north", "west", etc.)
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `save_to_file` (optional): Path to save the rotated image (e.g., "./character_east.png")
- `show_image` (default: false): Show before/after comparison to the AI assistant

### 4. `inpaint`

Edit existing pixel art by inpainting specific regions.

**Parameters:**

- `image_path` (required): Path to image to edit
- `mask_path` (required): Path to mask image (white = edit, black = keep)
- `description` (required): Description of what to paint in the masked area (e.g., "red hat", "golden armor")
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `save_to_file` (optional): Path to save the edited image (e.g., "./character_with_hat.png")
- `show_image` (default: false): Show before/after comparison to the AI assistant

### 5. `estimate_skeleton`

Extract skeleton structure from character images.

**Parameters:**

- `image_path` (required): Path to character image
- `show_image` (default: false): Show the original image with skeleton data to the AI assistant

### 6. `animate_with_skeleton`

Create animated pixel art sequences using skeleton keyframes. Define keypoints for different poses to create smooth animations.

**Parameters:**

- `skeleton_frames` (required): Array of skeleton frames defining the animation sequence
  - Each frame contains `keypoints` array with `x`, `y`, `label`, and optional `z_index`
  - Supported labels: "NOSE", "NECK", "RIGHT SHOULDER", "RIGHT ELBOW", "RIGHT ARM", "LEFT SHOULDER", "LEFT ELBOW", "LEFT ARM", "RIGHT HIP", "RIGHT KNEE", "RIGHT LEG", "LEFT HIP", "LEFT KNEE", "LEFT LEG", "RIGHT EYE", "LEFT EYE", "RIGHT EAR", "LEFT EAR"
- `reference_image_path` (optional): Path to reference image for character appearance
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `view` (default: "side"): Camera viewpoint ("side", "low top-down", "high top-down")
- `direction` (default: "east"): Character facing direction ("south", "east", "north", "west", etc.)
- `reference_guidance_scale` (default: 1.1): How closely to follow reference image (1.0-20.0)
- `pose_guidance_scale` (default: 3.0): How closely to follow skeleton poses (1.0-20.0)
- `isometric` (default: false): Use isometric projection
- `oblique_projection` (default: false): Use oblique projection
- `init_image_strength` (default: 300): Strength of initialization images (0-1000)
- `seed` (default: 0): Random seed for reproducible results
- `save_to_file` (optional): Path template to save animation frames (e.g., "./animation.png")
- `show_image` (default: false): Show the generated animation frames to the AI assistant

### 7. `animate_with_text`

Create animated pixel art sequences from text descriptions. Requires a reference character image and describes the action to animate.

**Parameters:**

- `description` (required): Description of the character to animate (e.g., "knight in armor", "wizard with staff")
- `action` (required): Action to animate (e.g., "walking", "swinging sword", "casting spell")
- `reference_image_path` (required): Path to reference character image to animate
- `width` (default: 64): Image width in pixels (recommended: 32, 64, 128, 256)
- `height` (default: 64): Image height in pixels (recommended: 32, 64, 128, 256)
- `view` (default: "side"): Camera viewpoint ("side", "low top-down", "high top-down")
- `direction` (default: "east"): Character facing direction ("south", "east", "north", "west", etc.)
- `negative_description` (optional): What to avoid in the animation (e.g., "blurry, distorted")
- `text_guidance_scale` (default: 7.5): How closely to follow text description (1.0-20.0)
- `image_guidance_scale` (default: 1.5): How closely to follow reference image (1.0-20.0)
- `n_frames` (default: 4): Number of animation frames to generate (1-20)
- `start_frame_index` (default: 0): Starting frame index (for continuing animations)
- `init_image_strength` (default: 300): Strength of initialization images (1-999)
- `seed` (default: 0): Random seed for reproducible results
- `save_to_file` (optional): Path template to save animation frames (e.g., "./walk_cycle.png")
- `show_image` (default: false): Show the generated animation frames to the AI assistant

### 8. `get_balance`

Check available PixelLab API credits.

**Parameters:** None

## Usage Examples

Once configured with your MCP client, you can use natural language to interact with PixelLab:

- "Generate a pixel art dragon with a sword"
- "Create a pixel art character in the style of this reference image"
- "Rotate this character sprite to face east"
- "Add a hat to this character using inpainting"
- "Analyze the skeleton structure of this character"
- "Create a walking animation for this character"
- "Animate this knight swinging a sword"
- "Check my PixelLab balance"

The AI assistant will call the appropriate tools and display the generated pixel art immediately when `show_image` is enabled.

## Command Line Usage

You can also run the server directly:

```bash
# Production usage (recommended)
pixellab-mcp --secret=your-pixellab-secret

# Development with local API server
pixellab-mcp --secret=your-secret --base-url=http://localhost:8000/v1

# Using environment variables
PIXELLAB_SECRET=your-secret pixellab-mcp

# Show help
pixellab-mcp --help
```

## Development

### Setup

```bash
git clone <repository-url>
cd pixellab-mcp
npm install
```

### Build

```bash
npm run build
```

### Run in Development

```bash
npm run dev -- --secret=your-test-secret
```

### Test with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test the server (production)
mcp-inspector npx pixellab-mcp --secret=your-test-secret

# Test with local development server
mcp-inspector npx pixellab-mcp --secret=your-test-secret --base-url=http://localhost:8000/v1
```

## Architecture

This MCP server is built as a lightweight wrapper around the [@pixellab-code/pixellab](https://www.npmjs.com/package/@pixellab-code/pixellab) library, providing:

- **Modular Design**: Each tool is implemented in its own file for maintainability
- **Type Safety**: Full TypeScript support with Zod validation
- **Error Handling**: Comprehensive error handling and user-friendly messages
- **AI Vision**: Optional image visibility to AI assistants via MCP image protocol
- **File Management**: Optional file saving with automatic path handling
- **Flexible Configuration**: Command line arguments or environment variables

## Tool Architecture

The server implements 8 modular tools:

- `src/tools/generatePixelArt.ts` - Pixflux text-to-pixel-art generation
- `src/tools/generatePixelArtWithStyle.ts` - Bitforge style-transfer generation
- `src/tools/getBalance.ts` - API credit checking
- `src/tools/rotateCharacter.ts` - Character rotation with comparisons
- `src/tools/inpaintPixelArt.ts` - Region-based editing with comparisons
- `src/tools/estimateSkeleton.ts` - Skeleton detection with visualization
- `src/tools/animateWithSkeleton.ts` - Skeleton-based animation generation
- `src/tools/animateWithText.ts` - Text-based animation generation

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- `@pixellab-code/pixellab`: PixelLab JavaScript client
- `zod`: Runtime type validation
- `dotenv`: Environment variable management

## Troubleshooting

### MCP Server Connection Issues

**Problem**: MCP client shows "Connection closed" or "No server info found"

**Solution**: Ensure the package is installed globally:

```bash
npm install -g pixellab-mcp
```

**Problem**: Server starts but immediately exits

**Causes & Solutions**:

1. **Invalid API key**: Verify your PixelLab secret is correct
2. **Package not found**: Install globally (see above)
3. **Node.js version**: Ensure Node.js 18+ is installed
4. **Directory issues**: Use absolute paths if needed:

```json
{
  "mcpServers": {
    "pixellab": {
      "command": "node",
      "args": ["/path/to/pixellab-mcp/dist/index.js", "--secret=your-secret"]
    }
  }
}
```

**Problem**: Server shows fewer than 8 tools

**Solution**: You should see these 8 tools:
- `generate_image_pixflux`
- `generate_image_bitforge`
- `get_balance`
- `rotate`
- `inpaint`
- `estimate_skeleton`
- `animate_with_skeleton`
- `animate_with_text`

If you see fewer, try:
1. Restart your MCP client completely
2. Reinstall globally: `npm uninstall -g pixellab-mcp && npm install -g pixellab-mcp`
3. Check for conflicting server configurations

### Testing the Server

Test manually before adding to MCP client:

```bash
# Test help (should show usage)
pixellab-mcp --help

# Test server startup (should show "PixelLab MCP Server running on stdio")
timeout 5s pixellab-mcp --secret=your-secret
```

## License

MIT

## Support

- **PixelLab API**: [docs.pixellab.ai](https://docs.pixellab.ai)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: Create an issue in this repository
