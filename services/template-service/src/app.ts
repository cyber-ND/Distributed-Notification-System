import env from "@fastify/env"
import mysql from "@fastify/mysql"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"

import error_handler from "./lib/utils/error_handler.js"
import template_routes from "./routes/template_route.js"
import { env_schema } from "./schema.js"

const app = Fastify({ logger: true })

await app.register(env, {
  confKey: "config",
  schema: env_schema,
  dotenv: true,
})

await app.register(swagger, {
  openapi: {
    info: {
      title: "Template Service",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:" + app.config.PORT }],
  },
})

await app.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  staticCSP: true,
})

app.register(mysql, {
  promise: true,
  connectionString: app.config.DB_URL,
})

app.register(template_routes, { prefix: "/api/v1/templates" })

app.get("/health", async (_request, reply) => {
  reply.send({ status: "ok" })
})

app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    success: false,
    statusCode: 404,
    message: "Not Found",
  })
})

app.setErrorHandler(error_handler)

export default app
