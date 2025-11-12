import nodemailer from "nodemailer"

import type { SendMailOptions, Transporter } from "nodemailer"
import app from "../../app.js"

let transporter: Transporter

function create_transporter(): Transporter {
  return nodemailer.createTransport({
    host: app.config.SMTP_HOST,
    port: app.config.SMTP_PORT,
    auth: {
      user: app.config.SMTP_USER,
      pass: app.config.SMTP_PASS,
    },
  })
}

function get_transporter(): Transporter {
  if (!transporter) {
    transporter = create_transporter()
  }
  return transporter
}

async function send_mail({
  from,
  to,
  html,
  subject,
  ...rest
}: SendMailOptions) {
  try {
    const result = await get_transporter().sendMail({
      from,
      to,
      subject,
      html,
      ...rest,
    })

    return result
  } catch (e) {
    console.error(e)
    throw e
  }
}

export default send_mail
