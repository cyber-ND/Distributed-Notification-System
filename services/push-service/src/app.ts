import env from "@fastify/env";
import Fastify from "fastify";
import type { FastifyRequest, FastifyReply } from "./types/fastify.js";

import { envSchema as schema } from "./schema.js";

const app = Fastify({ logger: true });

await app.register(env, {
  confKey: "config",
  schema,
  dotenv: true,
});

app.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
  reply.send({ status: "ok" });
});

export default app;