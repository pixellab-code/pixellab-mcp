import { describe, it, expect, beforeAll } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { PixelLabClient } from '@pixellab-code/pixellab';
import { generatePixelArt } from '../../src/tools/generatePixelArt.js';
import { retryWithBackoff } from '../utils';

describe('MCP Tool: generate_image_pixflux', () => {
  let client: PixelLabClient;
  let resultsDir: string;

  beforeAll(async () => {
    client = PixelLabClient.fromEnvFile('.env.development.secrets');
    resultsDir = path.join('tests', 'results', 'mcp-tools');
    await fs.mkdir(resultsDir, { recursive: true });
  });

  it('should generate basic pixel art', async () => {
    const args = {
      description: 'cute dragon with sword',
      width: 64,
      height: 64,
      text_guidance_scale: 8.0,
      no_background: false,
      show_image: false,
    };

    const response = await retryWithBackoff(async () => {
      return await generatePixelArt(args, client);
    }, 5, 3000);

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);

    const textContent = response.content.find(c => c.type === 'text');
    expect(textContent).toBeDefined();
    expect(textContent?.text).toContain('Generated pixel art');
    expect(textContent?.text).toContain('64x64');
  }, 180000);

  it('should generate pixel art with style options', async () => {
    const args = {
      description: 'medieval knight with shield',
      width: 128,
      height: 128,
      text_guidance_scale: 10.0,
      no_background: true,
      outline: 'single color black outline' as const,
      shading: 'detailed shading' as const,
      detail: 'highly detailed' as const,
      show_image: false,
    };

    const response = await retryWithBackoff(async () => {
      return await generatePixelArt(args, client);
    }, 5, 3000);

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    const textContent = response.content.find(c => c.type === 'text');
    expect(textContent).toBeDefined();
    expect(textContent?.text).toContain('Generated pixel art');
    expect(textContent?.text).toContain('128x128');
    expect(textContent?.text).toContain('no background');
  }, 180000);

  it('should save to file when specified', async () => {
    const outputPath = path.join(resultsDir, 'mcp_pixflux_saved.png');
    
    const args = {
      description: 'pixel art wizard',
      width: 64,
      height: 64,
      save_to_file: outputPath,
      show_image: false,
    };

    const response = await retryWithBackoff(async () => {
      return await generatePixelArt(args, client);
    }, 5, 3000);

    expect(response).toBeDefined();
    
    // Verify file was created
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    const textContent = response.content.find(c => c.type === 'text');
    expect(textContent?.text).toContain('Saved to');
    expect(textContent?.text).toContain(outputPath);
  }, 180000);

  it('should show image when show_image is true', async () => {
    const args = {
      description: 'pixel art cat',
      width: 32,
      height: 32,
      show_image: true,
    };

    const response = await retryWithBackoff(async () => {
      return await generatePixelArt(args, client);
    }, 5, 3000);

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();

    // Should have both text and image content
    const textContent = response.content.find(c => c.type === 'text');
    const imageContent = response.content.find(c => c.type === 'image');
    
    expect(textContent).toBeDefined();
    expect(imageContent).toBeDefined();
    expect(imageContent?.data).toBeDefined();
    expect(imageContent?.mimeType).toBe('image/png');
  }, 180000);

  it('should handle negative description', async () => {
    const args = {
      description: 'beautiful pixel art flower',
      negative_description: 'ugly, blurry, distorted',
      width: 64,
      height: 64,
      show_image: false,
    };

    const response = await retryWithBackoff(async () => {
      return await generatePixelArt(args, client);
    }, 5, 3000);

    expect(response).toBeDefined();
    const textContent = response.content.find(c => c.type === 'text');
    expect(textContent?.text).toContain('Generated pixel art');
  }, 180000);
}); 