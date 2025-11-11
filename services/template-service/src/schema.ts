export const env_schema = {
  type: "object",
  required: [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    "SERVICE_NAME",
    "CONSUL_HOST",
    "CONSUL_PORT",
  ],
  properties: {
    PORT: { type: "number", default: 3001 },
    DB_URL: { type: "string" },
    SERVICE_NAME: { type: "string", default: "template-service" },
    CONSUL_HOST: { type: "string", default: "localhost" },
    CONSUL_PORT: { type: "number", default: 8500 },
    NODE_ENV: { type: "string", default: "development" },
  },
};

export const create_template_schema = {
  type: "object",
  required: ["name", "subject", "body"],
  properties: {
    name: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
  },
};

export const update_template_schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
  },
  additionalProperties: false,
};
