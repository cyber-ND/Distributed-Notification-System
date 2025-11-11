import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      PORT: number;
      FCM_PRIVATE_KEY: string;
      FCM_CLIENT_EMAIL: string;
      FCM_PROJECT_ID: string;
      RABBITMQ_CONNECTION_URL: string;
      SERVICE_NAME: string;
      CONSUL_HOST: string;
      CONSUL_PORT: number;
      NODE_ENV: string;
    };
  }
}

export type { FastifyRequest, FastifyReply };