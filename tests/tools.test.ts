import { describe, it, expect, beforeAll } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { PixelLabClient, Base64Image } from '@pixellab-code/pixellab';
import { retryWithBackoff } from './utils';

describe('MCP Tools Integration Tests', () => {
  let client: PixelLabClient;
  let resultsDir: string;

  beforeAll(async () => {
    // Initialize client from environment file
    client = PixelLabClient.fromEnvFile('.env.development.secrets');
    
    // Create results directory for test outputs
    resultsDir = path.join('tests', 'results');
    await fs.mkdir(resultsDir, { recursive: true });
  });

  describe('generate_pixel_art (Pixflux)', () => {
    it('should generate pixel art from text description', async () => {
      const response = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'cute dragon with sword',
          imageSize: { width: 64, height: 64 },
          noBackground: false,
          textGuidanceScale: 8.0,
        });
      }, 5, 3000);

      // Verify response structure
      expect(response.image).toBeDefined();
      expect(response.image.base64).toBeDefined();
      expect(response.image.format).toBeDefined();
      expect(response.usage).toBeDefined();
      expect(response.usage.type).toBe('usd');
      expect(typeof response.usage.usd).toBe('number');

      // Verify image buffer
      const buffer = response.image.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Save the generated image
      const outputPath = path.join(resultsDir, 'mcp_pixflux_dragon.png');
      await response.image.saveToFile(outputPath);

      // Verify file was created
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }, 180000); // 3 minute timeout

    it('should generate pixel art with style options', async () => {
      const response = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'medieval knight',
          imageSize: { width: 64, height: 64 },
          noBackground: true,
          outline: 'single color black outline',
          shading: 'medium shading',
          detail: 'medium detail',
        });
      }, 5, 3000);

      expect(response.image).toBeDefined();
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save with descriptive name
      const outputPath = path.join(resultsDir, 'mcp_pixflux_knight_styled.png');
      await response.image.saveToFile(outputPath);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }, 180000);
  });

  describe('generate_pixel_art_with_style (Bitforge)', () => {
    it('should generate pixel art using style reference', async () => {
      // First generate a style reference image
      const styleResponse = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'retro 8-bit style character',
          imageSize: { width: 64, height: 64 },
        });
      }, 5, 3000);

      const styleImagePath = path.join(resultsDir, 'style_reference.png');
      await styleResponse.image.saveToFile(styleImagePath);

      // Now use it as style reference
      const styleImage = await Base64Image.fromFile(styleImagePath);
      
      const response = await retryWithBackoff(async () => {
        return await client.generateImageBitforge({
          description: 'wizard casting spell',
          imageSize: { width: 64, height: 64 },
          styleImage,
          styleStrength: 75.0,
          noBackground: false,
        });
      }, 5, 3000);

      expect(response.image).toBeDefined();
      expect(response.usage).toBeDefined();
      expect(response.usage.usd).toBeGreaterThan(0);

      // Save the styled result
      const outputPath = path.join(resultsDir, 'mcp_bitforge_wizard.png');
      await response.image.saveToFile(outputPath);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }, 300000); // 5 minute timeout for two API calls
  });

  describe('get_pixellab_balance', () => {
    it('should retrieve account balance', async () => {
      const balance = await client.getBalance();

      expect(balance).toBeDefined();
      expect(balance.type).toBe('usd');
      expect(typeof balance.usd).toBe('number');
      expect(balance.usd).toBeGreaterThanOrEqual(0);

      console.log(`Current balance: $${balance.usd} USD`);
    });
  });

  describe('rotate_character', () => {
    it('should rotate character to different direction', async () => {
      // First generate a character to rotate
      const characterResponse = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'pixel art character facing south',
          imageSize: { width: 64, height: 64 },
          noBackground: true,
        });
      }, 5, 3000);

      const characterPath = path.join(resultsDir, 'character_original.png');
      await characterResponse.image.saveToFile(characterPath);

      // Load and rotate the character
      const originalImage = await Base64Image.fromFile(characterPath);
      
      const rotateResponse = await retryWithBackoff(async () => {
        return await client.rotate({
          imageSize: { width: 64, height: 64 },
          fromImage: originalImage,
          fromDirection: 'south',
          toDirection: 'east',
        });
      }, 5, 3000);

      expect(rotateResponse.image).toBeDefined();
      expect(rotateResponse.usage.usd).toBeGreaterThan(0);

      // Save the rotated result
      const outputPath = path.join(resultsDir, 'mcp_rotated_character.png');
      await rotateResponse.image.saveToFile(outputPath);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }, 300000);
  });

  describe('estimate_character_skeleton', () => {
    it('should extract skeleton from character image', async () => {
      // First generate a character for skeleton estimation
      const characterResponse = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'clear pixel art character with visible limbs',
          imageSize: { width: 64, height: 64 },
          noBackground: true,
        });
      }, 5, 3000);

      const characterPath = path.join(resultsDir, 'character_for_skeleton.png');
      await characterResponse.image.saveToFile(characterPath);

      // Estimate skeleton
      const characterImage = await Base64Image.fromFile(characterPath);
      
      const skeletonResponse = await retryWithBackoff(async () => {
        return await client.estimateSkeleton({
          image: characterImage,
        });
      }, 5, 3000);

      expect(skeletonResponse.keypoints).toBeDefined();
      expect(Array.isArray(skeletonResponse.keypoints)).toBe(true);
      expect(skeletonResponse.usage.usd).toBeGreaterThan(0);

      // Log skeleton data for inspection
      console.log(`Detected ${skeletonResponse.keypoints.length} keypoints:`);
      skeletonResponse.keypoints.forEach((kp, i) => {
        console.log(`  ${i + 1}. ${kp.label}: (${kp.x}, ${kp.y}) confidence: ${kp.confidence}`);
      });

      // Save skeleton data to file
      const skeletonDataPath = path.join(resultsDir, 'skeleton_data.json');
      await fs.writeFile(skeletonDataPath, JSON.stringify(skeletonResponse, null, 2));
    }, 300000);
  });

  describe('inpaint_pixel_art', () => {
    it('should edit pixel art using mask', async () => {
      // Generate base image
      const baseResponse = await retryWithBackoff(async () => {
        return await client.generateImagePixflux({
          description: 'pixel art character without hat',
          imageSize: { width: 64, height: 64 },
          noBackground: true,
        });
      }, 5, 3000);

      const basePath = path.join(resultsDir, 'character_no_hat.png');
      await baseResponse.image.saveToFile(basePath);

      // Create a simple mask (white square in top area for hat)
      const maskData = Buffer.alloc(64 * 64 * 4); // RGBA
      for (let y = 0; y < 20; y++) { // Top 20 pixels
        for (let x = 15; x < 49; x++) { // Middle area
          const idx = (y * 64 + x) * 4;
          maskData[idx] = 255;     // R
          maskData[idx + 1] = 255; // G  
          maskData[idx + 2] = 255; // B
          maskData[idx + 3] = 255; // A
        }
      }

      const maskPath = path.join(resultsDir, 'hat_mask.png');
      // Create mask image using sharp or similar - for now, let's create a simple white rectangle
      const sharp = require('sharp');
      await sharp(maskData, { 
        raw: { width: 64, height: 64, channels: 4 } 
      }).png().toFile(maskPath);

      // Load images for inpainting
      const originalImage = await Base64Image.fromFile(basePath);
      const maskImage = await Base64Image.fromFile(maskPath);

      const inpaintResponse = await retryWithBackoff(async () => {
        return await client.inpaint({
          description: 'red wizard hat',
          imageSize: { width: 64, height: 64 },
          inpaintingImage: originalImage,
          maskImage: maskImage,
        });
      }, 5, 3000);

      expect(inpaintResponse.image).toBeDefined();
      expect(inpaintResponse.usage.usd).toBeGreaterThan(0);

      // Save the inpainted result
      const outputPath = path.join(resultsDir, 'mcp_inpainted_character.png');
      await inpaintResponse.image.saveToFile(outputPath);

      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }, 300000);
  });
});
