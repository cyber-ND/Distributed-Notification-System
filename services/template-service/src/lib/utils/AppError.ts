class AppError extends Error {
  statusCode: number
  isOperational: boolean = true

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode

    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
