import AppError from "../lib/utils/AppError.js"
import { create_template_schema, update_template_schema } from "../schema.js"

const template_routes = async (fastify: any) => {
  fastify.get(
    "/",
    {
      schema: {
        description: "Get all templates",
        tags: ["Templates"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    subject: { type: "string" },
                    body: { type: "string" },
                  },
                },
              },
              meta: {
                type: "object",
                properties: { total: { type: "number" } },
              },
            },
          },
        },
      },
    },
    async (_request: any, reply: any) => {
      try {
        const [templates] = await fastify.mysql.query("SELECT * FROM templates")
        reply.code(200).send({
          success: true,
          data: templates,
          meta: { total: templates.length },
        })
      } catch {
        throw new AppError("Failed to fetch templates", 500)
      }
    },
  )

  fastify.post(
    "/",
    {
      schema: {
        description: "Create a new template",
        tags: ["Templates"],
        body: create_template_schema,
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const { name, subject, body } = request.body
        if (!name || !subject || !body) {
          return reply.send(new AppError("Missing required fields", 400))
        }

        const [template] = await fastify.mysql.query(
          "INSERT INTO templates (name, subject, body) VALUES (?, ?, ?)",
          [name, subject, body],
        )

        reply.code(201).send({
          success: true,
          data: { id: template.insertId, name, subject, body },
        })
      } catch {
        throw new AppError("Failed to create template", 500)
      }
    },
  )

  fastify.get(
    "/:template_code",
    {
      schema: {
        description: "Get template by code",
        tags: ["Templates"],
        params: {
          type: "object",
          required: ["template_code"],
          properties: { template_code: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const { template_code } = request.params
        const [[template]] = await fastify.mysql.query(
          "SELECT * FROM templates WHERE name = ?",
          [template_code],
        )

        if (!template)
          return reply.send(new AppError("Template not found", 404))

        reply.code(200).send({
          success: true,
          data: template,
        })
      } catch {
        throw new AppError("Unable to fetch template", 404)
      }
    },
  )

  fastify.patch(
    "/:template_code",
    {
      schema: {
        description: "Update template",
        tags: ["Templates"],
        params: {
          type: "object",
          required: ["template_code"],
          properties: { template_code: { type: "string" } },
        },
        body: update_template_schema,
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: update_template_schema,
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const { template_code } = request.params
        const fields = request.body

        if (!fields || !Object.keys(fields).length) {
          return reply.send(new AppError("No fields provided for update", 400))
        }

        const setClauses = []
        const values = []
        for (const [key, value] of Object.entries(fields)) {
          setClauses.push(`${key} = ?`)
          values.push(value)
        }

        const sql = `UPDATE templates SET ${setClauses.join(
          ", ",
        )} WHERE name = ?`
        values.push(template_code)

        const [result] = await fastify.mysql.query(sql, values)

        if (result.affectedRows === 0) {
          return reply.send(new AppError("Template not found", 404))
        }

        reply.send({
          success: true,
          message: "Template updated successfully",
          data: fields,
        })
      } catch {
        throw new AppError("Failed to update template", 500)
      }
    },
  )

  fastify.delete(
    "/:template_code",
    {
      schema: {
        description: "Delete template",
        tags: ["Templates"],
        params: {
          type: "object",
          required: ["template_code"],
          properties: { template_code: { type: "string" } },
        },
        response: {
          204: { type: "null" },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const { template_code } = request.params

        const [[template]] = await fastify.mysql.query(
          "SELECT * FROM templates WHERE name = ?",
          [template_code],
        )

        if (!template) {
          return reply.send(new AppError("Template not found", 404))
        }

        await fastify.mysql.query("DELETE FROM templates WHERE name = ?", [
          template_code,
        ])
        reply.code(204).send()
      } catch {
        throw new AppError("Failed to delete template", 500)
      }
    },
  )
}

export default template_routes
