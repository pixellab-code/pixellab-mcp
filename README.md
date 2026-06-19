[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/pixellab-code-pixellab-mcp-badge.png)](https://mseep.ai/app/pixellab-code-pixellab-mcp)

# PixelLab MCP - Vibe Coding AI Toolkit 🎨🤖

Enable "Vibe Coding" with PixelLab's Model Context Protocol (MCP) server. Generate pixel art characters, animations, and tilesets directly from your AI coding assistant!

## 🚀 Quick Start

Visit our interactive setup guide at: **[https://www.pixellab.ai/vibe-coding](https://www.pixellab.ai/vibe-coding)**

The setup page provides:
- 🔧 One-click configuration for your AI coding assistant
- 🎯 Support for 15+ AI coding tools
- 📋 Copy-paste setup instructions
- 🔑 Automatic API token integration

## 🎮 Use Cases

Build your dream games with AI-powered pixel art generation:

- **Top-down strategy games** in Unity with Cursor
- **2D platformers** in Godot with VS Code  
- **Roguelike adventures** in Pygame with Claude Code
- **RPG worlds** with tilesets and character animations

## 🛠️ Supported AI Assistants

### Featured Clients
- **VS Code** - Native MCP support in v1.102+
- **Cursor** - Full MCP integration
- **Claude Code** - CLI tool with MCP support
- **Gemini CLI** - Command-line AI assistant
- **Zed** - Modern code editor with AI
- **Cline** - VS Code extension

### Additional Clients
- Claude Desktop
- Windsurf
- Continue
- BoltAI
- LM Studio
- Perplexity Desktop
- Kiro
- And many more MCP-compatible clients!

## 🎨 Available Tools

### Create Character
Generate pixel art characters with 4 or 8 directional views:
```python
create_character(description="cute wizard", n_directions=8)
```

### Animate Character
Add animations to existing characters (walk, run, idle, etc.):
```python
animate_character(character_id="abc123", animation="walk")
```

### Tileset Creation
Generate Wang tilesets for seamless game environments:
```python
create_tileset(lower="ocean", upper="sandy beach")
```

### Isometric Tiles
Create individual isometric tiles:
```python
create_isometric_tile(description="grass on top of dirt", size=32)
```

## 📖 What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI assistants to safely interact with external tools and data sources. With PixelLab's MCP server, your AI assistant can generate pixel art characters, animations, and tilesets directly within your coding environment.

## 🔧 Manual Configuration

If you prefer manual setup, here's the basic configuration for any MCP client:

```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}
```

Replace `YOUR_API_TOKEN` with your actual token from [PixelLab](https://www.pixellab.ai/vibe-coding).

## 🎯 Getting Started

1. **Sign up** at [PixelLab.ai](https://www.pixellab.ai) to get your API token
2. **Choose your AI assistant** from our supported clients
3. **Configure** using our interactive setup at [pixellab.ai/vibe-coding](https://www.pixellab.ai/vibe-coding)
4. **Start creating** pixel art directly from your code editor!

## 💬 Support & Community

- **Discord**: [Join our community](https://discord.gg/pBeyTBF8T7)
- **Documentation**: [MCP Protocol Docs](https://modelcontextprotocol.io)
- **Issues**: [GitHub Issues](https://github.com/pixellab-ai/pixellab-mcp/issues)

## 📝 License

Copyright © 2025 PixelLab. All rights reserved.

---

Built with ❤️ by the PixelLab team for the indie game dev community.