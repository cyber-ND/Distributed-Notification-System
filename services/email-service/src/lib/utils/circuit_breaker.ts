import CircuitBreaker from "opossum"

const circuit_breaker = <T>(operation: () => Promise<T>, service: string) => {
  const options = {
    failureThreshold: 50, // Open after 50% of requests fail
    resetTimeout: 10000, // Try again after 10 seconds
    timeout: 8080, // Time before request is considered failed
    errorThresholdPercentage: 50, // Error percentage to open circuit,
  }

  const breaker = new CircuitBreaker(operation, options)

  // Add listeners for circuit state changes
  breaker.on("open", () => {
    console.log(`Circuit OPEN - ${service} service appears to be down`)
  })

  breaker.on("halfOpen", () => {
    console.log(`Circuit HALF-OPEN - Testing ${service} service`)
  })

  breaker.on("close", () => {
    console.log(`Circuit CLOSED - ${service} service restored`)
  })

  return breaker
}

export default circuit_breaker
