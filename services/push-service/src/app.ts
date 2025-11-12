import env from "@fastify/env"
import Fastify from "fastify"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import type { FastifyRequest, FastifyReply } from "./types/fastify.js"

import { envSchema as schema } from "./schema.js"
import { pushRoutes } from "./routes/push.routes.js"
import { HealthResponseSchema } from "./schema/push.schema.js"

const app = Fastify({ logger: true })

await app.register(env as any, {
  confKey: "config",
  schema,
  dotenv: true,
})

// Register Swagger
await app.register(swagger as any, {
  swagger: {
    info: {
      title: "Push Service API",
      description: "API documentation for Push Notification Service",
      version: "1.0.0",
      contact: {
        name: "Push Service Team",
        email: "support@example.com",
      },
    },
    host: "localhost:3000",
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
      {
        name: "Push Notifications",
        description: "Push notification operations",
      },
      { name: "Health", description: "Health check endpoints" },
    ],
  },
})

// Register Swagger UI
await app.register(swaggerUi as any, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
})

// Register push routes
await app.register(pushRoutes, { prefix: "/api/v1/push" })

// Health endpoint with Swagger schema
app.get(
  "/health",
  {
    schema: {
      description: "Health check endpoint",
      tags: ["Health"],
      response: {
        200: HealthResponseSchema,
      },
    },
  },
  async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  },
)

export default app
