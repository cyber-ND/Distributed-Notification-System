import app from "../../app.js"

const fetch_template = async (
  template_code: string,
): Promise<{ body: string; subject: string }> => {
  const res = await fetch(
    `http://${app.config.CONSUL_HOST}:${app.config.CONSUL_PORT}/v1/catalog/service/${app.config.SERVICE_NAME}`,
  )

  const services = await res.json()

  const template_service = services[0]

  const templateUrl = `http://${
    template_service.ServiceAddress || template_service.Address
  }:${template_service.ServicePort}/api/v1/templates/${template_code}`

  const templateRes = await fetch(templateUrl)

  const data = await templateRes.json()

  console.log("template :", data)

  return data.data
}

export default fetch_template
