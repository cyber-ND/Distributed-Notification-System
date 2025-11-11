import { Provider } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
dotenv.config();

export const RabbitMQProvider: Provider = {
  provide: 'RABBITMQ_CONNECTION',
  useFactory: async () => {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error('RABBITMQ_URL not set in env');

    const conn = await amqp.connect(url);
    const channel = await conn.createChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'notifications.direct';

    await channel.assertExchange(exchange, 'direct', {
      durable: true,
      autoDelete: false,
    });

    // optional prefetch
    await channel.prefetch(10);

    return { channel, exchange };
  },
};
