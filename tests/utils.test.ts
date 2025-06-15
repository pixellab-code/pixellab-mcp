import { describe, it, expect } from "@jest/globals";
import { toMcpResponse, toMcpError, toMcpComparison } from "../src/utils";
import { Base64Image } from "@pixellab-code/pixellab";

describe("MCP Utils", () => {
  describe("toMcpResponse", () => {
    it("should create a proper MCP response with text and image", () => {
      const mockImage = {
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      } as Base64Image;

      const response = toMcpResponse("Test message", mockImage, {
        test: "metadata",
      });

      expect(response.content).toHaveLength(3);
      expect(response.content[0]).toEqual({
        type: "text",
        text: "Test message",
      });
      expect(response.content[1]).toEqual({
        type: "image",
        data: mockImage.dataUrl,
        mimeType: "image/png",
      });
      expect(response.content[2].type).toBe("text");
      expect(response.content[2].text).toContain("test");
    });
  });

  describe("toMcpError", () => {
    it("should handle Error objects", () => {
      const error = new Error("Test error");
      const response = toMcpError(error);

      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual({
        type: "text",
        text: "Error: Test error",
      });
    });

    it("should handle string errors", () => {
      const response = toMcpError("String error");

      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual({
        type: "text",
        text: "Error: String error",
      });
    });

    it("should handle unknown errors", () => {
      const response = toMcpError({ unknown: "object" });

      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toBe(
        'Error: {\n  "unknown": "object"\n}'
      );
    });

    it("should handle null errors", () => {
      const response = toMcpError(null);

      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toBe("Error: Unknown error: null");
    });

    it("should handle circular reference objects", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const response = toMcpError(circularObj);

      expect(response.content).toHaveLength(1);
      expect(response.content[0].text).toBe(
        "Error: Object error: [object Object]"
      );
    });
  });

  describe("toMcpComparison", () => {
    it("should create a comparison response with before and after images", () => {
      const beforeImage = {
        dataUrl: "data:image/png;base64,before",
      } as Base64Image;

      const afterImage = {
        dataUrl: "data:image/png;base64,after",
      } as Base64Image;

      const response = toMcpComparison(
        "Comparison test",
        beforeImage,
        afterImage,
        { test: "metadata" }
      );

      expect(response.content).toHaveLength(6);
      expect(response.content[0].text).toBe("Comparison test");
      expect(response.content[1].text).toBe("Before:");
      expect(response.content[2].data).toBe(beforeImage.dataUrl);
      expect(response.content[3].text).toBe("After:");
      expect(response.content[4].data).toBe(afterImage.dataUrl);
      expect(response.content[5].type).toBe("text");
    });
  });
});
