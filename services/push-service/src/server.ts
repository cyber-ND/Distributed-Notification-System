import app from "./app.js";
import { consume_queue } from "./queue/rabbitmq.js";
import { send_push_notification } from "./utils/send_push.js";
import amqp from "amqplib";

async function connectRabbit() {
  const connection = await amqp.connect(app.config.RABBITMQ_CONNECTION_URL);
  const channel = await connection.createChannel();
  console.log("✅ Connected to RabbitMQ");
  return channel;
}

connectRabbit().catch((err) => {
  console.error("❌ RabbitMQ connection failed:", err.message);
});

// register consul for dynamic service discovery
async function registerService() {
  const isLocal = app.config.CONSUL_HOST === "localhost";

  const serviceAddress = isLocal
    ? "host.docker.internal"
    : app.config.SERVICE_NAME;

  const body = {
    Name: app.config.SERVICE_NAME,
    ID: `${app.config.SERVICE_NAME}-${app.config.PORT}`,
    Address: serviceAddress,
    Port: app.config.PORT,
    Check: {
      HTTP: `http://${serviceAddress}:${app.config.PORT}/health`,
      Interval: "10s",
    },
  };

  await fetch(
    `http://${app.config.CONSUL_HOST}:${app.config.CONSUL_PORT}/v1/agent/service/register`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  console.log(
    `[${app.config.SERVICE_NAME}] Registered with Consul at ${serviceAddress}:${app.config.PORT}`
  );
}

// Deregister service from Consul on shutdown
async function deregisterService() {
  const serviceId = `${app.config.SERVICE_NAME}-${app.config.PORT}`;

  try {
    await fetch(
      `http://${app.config.CONSUL_HOST}:${app.config.CONSUL_PORT}/v1/agent/service/deregister/${serviceId}`,
      { method: "PUT" }
    );
    console.log(`[${app.config.SERVICE_NAME}] Deregistered from Consul`);
  } catch (err) {
    console.error("Failed to deregister from Consul:", err);
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  await deregisterService();
  await app.close();

  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

const start = async () => {
  try {
    await app.listen({ port: app.config.PORT });
    await consume_queue("push", async (payload) => {
      const result = await send_push_notification(payload);
      if (!result.success) {
        throw new Error(result.error || "Failed to send push notification");
      }
    });
    console.log(`Push service listening on port ${app.config.PORT}`);

    await registerService();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
