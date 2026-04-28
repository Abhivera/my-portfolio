import { createServerFn } from "@tanstack/react-start";

export const getServerStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    // Simulate a backend call or environment check
    return {
      status: "online",
      runtime: "Node.js",
      lastUpdated: new Date().toISOString(),
      message: "Backend services are healthy and running on Node.js.",
    };
  });
