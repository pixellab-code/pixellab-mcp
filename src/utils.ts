import { Base64Image } from "@pixellab-code/pixellab";

// MCP response type definition
export type McpToolResponse = {
  content: (
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  )[];
  _meta?: Record<string, unknown>;
  isError?: boolean;
};

// Simple conversion utilities - no duplication of business logic
export function toMcpResponse(
  description: string,
  image: Base64Image,
  metadata?: any
): McpToolResponse {
  const content: McpToolResponse["content"] = [
    { type: "text", text: description },
    { type: "image", data: image.dataUrl, mimeType: "image/png" },
  ];

  if (metadata) {
    content.push({ type: "text", text: JSON.stringify(metadata, null, 2) });
  }

  return { content };
}

export function toMcpError(error: unknown): McpToolResponse {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (typeof error === "object" && error !== null) {
    try {
      // Try to stringify the object for better error reporting
      errorMessage = JSON.stringify(error, null, 2);
    } catch {
      // If JSON.stringify fails, fall back to a descriptive message
      errorMessage = `Object error: ${Object.prototype.toString.call(error)}`;
    }
  } else {
    errorMessage = `Unknown error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: "text",
        text: `Error: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

// For comparison views (before/after images)
export function toMcpComparison(
  description: string,
  beforeImage: Base64Image,
  afterImage: Base64Image,
  metadata?: any
): McpToolResponse {
  const content: McpToolResponse["content"] = [
    { type: "text", text: description },
    { type: "text", text: "Before:" },
    { type: "image", data: beforeImage.dataUrl, mimeType: "image/png" },
    { type: "text", text: "After:" },
    { type: "image", data: afterImage.dataUrl, mimeType: "image/png" },
  ];

  if (metadata) {
    content.push({ type: "text", text: JSON.stringify(metadata, null, 2) });
  }

  return { content };
}
