import env from "@fastify/env"
import Fastify from "fastify"

import { envSchema as schema } from "./schema.js"

const app = Fastify({ logger: true })

await app.register(env, {
  confKey: "config",
  schema,
  dotenv: true,
})

app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    success: false,
    statusCode: 404,
    message: "Not Found",
  })
})

app.setErrorHandler((error, _request, reply) => {
  reply.status(500).send({
    success: false,
    message: error instanceof Error ? error.message : "Internal Server Error",
  })
})

app.get("/health", async (_request, reply) => {
  reply.send({ success: true, message: "ok" })
})

export default app
