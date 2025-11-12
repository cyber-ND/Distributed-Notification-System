import type { FastifyReply, FastifyRequest } from "fastify"

interface IError extends Error {
  statusCode?: number
  isOperational?: boolean
  validation?: any
}

const errorHandler = (
  error: unknown,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  const err = error as IError

  reply.status(err.statusCode ?? 500).send({
    success: false,
    message: err.isOperational
      ? (err.message ?? "Internal Server Error")
      : "Internal Server Error",
    error: err.validation ?? undefined,
  })
}

export default errorHandler
