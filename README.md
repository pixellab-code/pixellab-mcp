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

- Node.js 16 or higher
- PixelLab API key (get one at [pixellab.ai](https://pixellab.ai))

### Install

```bash
npm install -g mcp-pixellab
```

Or run directly with npx:

```bash
npx mcp-pixellab --secret=your-pixellab-secret
```

## Configuration

### MCP Client Configuration (Recommended)

Add to your MCP client configuration (e.g., Claude Desktop) with your PixelLab secret:

```json
{
  "mcpServers": {
    "pixellab": {
      "command": "npx",
      "args": ["mcp-pixellab", "--secret=your-pixellab-secret-here"]
    }
  }
}
```

### Development Configuration

For development with a local API server:

```json
{
  "mcpServers": {
    "pixellab": {
      "command": "npx",
      "args": [
        "mcp-pixellab",
        "--secret=your-pixellab-secret-here",
        "--base-url=http://localhost:8000"
      ]
    }
  }
}
```

### Alternative: Environment Variables

You can also use environment variables if preferred:

```bash
export PIXELLAB_SECRET="your_api_key_here"
# Optional: for development only
export PIXELLAB_BASE_URL="http://localhost:8000"
```

Then configure without arguments:

```json
{
  "mcpServers": {
    "pixellab": {
      "command": "npx",
      "args": ["mcp-pixellab"]
    }
  }
}
```

## Available Tools

### 1. `generate_pixel_art`

Generate pixel art from text descriptions using PixelLab's Pixflux model.

**Parameters:**

- `description` (required): Text description of what to generate
- `width` (default: 64): Image width in pixels
- `height` (default: 64): Image height in pixels
- `negative_description` (optional): What to avoid in the generation
- `text_guidance_scale` (default: 8.0): How closely to follow the text
- `no_background` (default: false): Generate without background
- `outline` (optional): Outline style ("single color black outline", "selective outline", etc.)
- `shading` (optional): Shading style ("flat shading", "basic shading", etc.)
- `detail` (optional): Detail level ("low detail", "medium detail", "highly detailed")
- `save_to_file` (optional): Path to save the generated image

### 2. `generate_pixel_art_with_style`

Generate pixel art using a reference image for style matching (Bitforge model).

**Parameters:**

- `description` (required): Text description of what to generate
- `style_image_path` (required): Path to reference style image
- `width` (default: 64): Image width in pixels
- `height` (default: 64): Image height in pixels
- `style_strength` (default: 50.0): How strongly to match the style (0-100)
- `no_background` (default: false): Generate without background
- `save_to_file` (optional): Path to save the generated image

### 3. `rotate_character`

Generate rotated views of characters and objects.

**Parameters:**

- `image_path` (required): Path to character/object image
- `from_direction` (optional): Current direction ("south", "east", "north", "west", etc.)
- `to_direction` (required): Direction to rotate to
- `width` (default: 64): Image width in pixels
- `height` (default: 64): Image height in pixels
- `save_to_file` (optional): Path to save the rotated image

### 4. `inpaint_pixel_art`

Edit existing pixel art by inpainting specific regions.

**Parameters:**

- `image_path` (required): Path to image to edit
- `mask_path` (required): Path to mask image (white = edit, black = keep)
- `description` (required): Description of what to paint in the masked area
- `width` (default: 64): Image width in pixels
- `height` (default: 64): Image height in pixels
- `save_to_file` (optional): Path to save the edited image

### 5. `estimate_character_skeleton`

Extract skeleton structure from character images.

**Parameters:**

- `image_path` (required): Path to character image
- `save_visualization` (optional): Path to save skeleton visualization

### 6. `get_pixellab_balance`

Check available PixelLab API credits.

**Parameters:** None

## Usage Examples

Once configured with your MCP client, you can use natural language to interact with PixelLab:

- "Generate a pixel art dragon with a sword"
- "Create a pixel art character in the style of this reference image"
- "Rotate this character sprite to face east"
- "Add a hat to this character using inpainting"
- "Check my PixelLab balance"

The AI assistant will call the appropriate tools and display the generated pixel art immediately.

## Command Line Usage

You can also run the server directly:

```bash
# Production usage (recommended)
mcp-pixellab --secret=your-pixellab-secret

# Using environment variables
PIXELLAB_SECRET=your-secret mcp-pixellab
```

## Development

### Setup

```bash
git clone <repository-url>
cd mcp-pixellab
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
mcp-inspector npx mcp-pixellab --secret=your-test-secret

# Test with local development server
mcp-inspector npx mcp-pixellab --secret=your-test-secret --base-url=http://localhost:8000
```

## Architecture

This MCP server is built as a lightweight wrapper around the [pixellab-js](https://github.com/pixellab-code/pixellab-js) library, providing:

- **Minimal overhead**: Direct passthrough to pixellab-js with format conversion only
- **Type safety**: Full TypeScript support with Zod validation
- **Error handling**: Comprehensive error handling and user-friendly messages
- **Image visibility**: Generated images are immediately visible to AI assistants
- **File management**: Optional file saving with automatic path handling
- **Flexible configuration**: Command line arguments or environment variables

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- `@pixellab-code/pixellab`: PixelLab JavaScript client
- `zod`: Runtime type validation
- `dotenv`: Environment variable management

## License

MIT

## Support

- **PixelLab API**: [docs.pixellab.ai](https://docs.pixellab.ai)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: Create an issue in this repository
