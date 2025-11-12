import amqplib from "amqplib"
import mustache from "mustache"
import type { SendMailOptions } from "nodemailer"

import app from "../app.js"
import fetch_template from "../lib/helpers/fetch_template.js"
import circuit_breaker from "../lib/utils/circuit_breaker.js"

let connection: amqplib.ChannelModel | null = null
let channel: amqplib.Channel | null = null

export const get_channel = async () => {
  if (!connection) {
    connection = await amqplib.connect(app.config.RABBITMQ_CONNECTION_URL)

    connection.on("error", err => {
      console.error("RabbitMQ connection error:", err)
      connection = null
      channel = null
    })

    connection.on("close", () => {
      console.log("RabbitMQ connection closed")
      connection = null
      channel = null
    })
  }

  if (!channel) {
    channel = await connection.createChannel()
  }

  return channel
}

export const consume_queue = async (
  routingKey: "email" | "push",
  callback: (data: SendMailOptions) => Promise<void>,
) => {
  const ch = await get_channel()

  // Main exchange
  ch.assertExchange("notifications.direct", "direct", {
    durable: true,
    autoDelete: false,
  })

  // Main queue with dead letter exchange configured
  await ch.assertQueue(`${routingKey}.queue`, {
    durable: true,
    autoDelete: false,
    deadLetterExchange: "notifications.direct",
    deadLetterRoutingKey: "failed",
  })

  // Create dead letter queue for failed messages
  await ch.assertQueue(`${routingKey}.failed`, {
    durable: true,
    autoDelete: false,
  })

  // Bind exchange with queues
  await ch.bindQueue(`${routingKey}.failed`, "notifications.direct", "failed")
  await ch.bindQueue(`${routingKey}.queue`, "notifications.direct", routingKey)

  ch.consume(`${routingKey}.queue`, async (msg: any) => {
    if (msg) {
      console.log(`\n📨 Received message on ${routingKey}.queue`)
      try {
        const data = JSON.parse(msg.content.toString()) as {
          template_code: string
          email: string
          variables: Record<string, string>
          priority: number
        }

        // fetch template
        const template = await circuit_breaker(
          async () => await fetch_template(data.template_code),
          "Template",
        ).fire()

        console.log(data)
        const html = mustache.render(template.body, data.variables)

        await callback({
          to: data.email,
          subject: template.subject,
          from: "<hng.notification@gmail.com>",
          html,
        })

        // todo: call gateway status update endpoint to mark notification as sent
        ch.ack(msg)
      } catch (error) {
        // call gateway status update endpoint to mark notification as failed
        ch.nack(msg, false, false)
        console.log(
          `💀 Message sent to Dead Letter Queue: ${routingKey}.failed\n`,
        )
      }
    }
  })
}
