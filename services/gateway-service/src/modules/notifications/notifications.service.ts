import { HttpService } from "@nestjs/axios"
import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common"
import Redis from "ioredis"
import { lastValueFrom } from "rxjs"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto, NotificationType } from "./dto/notification.dto"
import { UsersService } from "../users/users.service"

export interface NotificationResponse {
  success: boolean
  message: string
  data: any
  meta: any
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private redis: Redis
  private channel: any
  private exchange: string

  constructor(
    @Inject("RABBITMQ_CONNECTION") private mqProvider: any,
    private readonly http: HttpService,
    private readonly usersService: UsersService, // circuit breaker + Consul handled internally
  ) {
    this.channel = mqProvider?.channel
    this.exchange =
      mqProvider?.exchange ||
      process.env.RABBITMQ_EXCHANGE ||
      "notifications.direct"
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      retryStrategy: times => Math.min(times * 50, 2000),
    })

    this.redis.on("error", err =>
      this.logger.error("[ioredis] Redis error:", err.message),
    )
    this.redis.on("connect", () =>
      this.logger.log("[ioredis] Connected successfully"),
    )
  }

  // ==========================
  // Handle create notification
  // ==========================
  async handleNotification(
    payload: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    const {
      notification_type,
      user_id,
      template_code,
      variables,
      request_id,
      priority,
      metadata,
    } = payload

    if (!request_id) throw new BadRequestException("request_id is required")

    // Fetch user from UsersService (circuit breaker + Consul handled internally)
    let userRes
    try {
      userRes = await this.usersService.forwardToUserService(
        "GET",
        `/api/v1/users/${user_id}`,
      )
    } catch (err) {
      this.logger.error(
        "User service request failed",
        err?.response?.data || err.message,
      )
      return {
        success: false,
        message: "Failed to fetch user",
        data: null,
        meta: null,
      }
    }

    const user = userRes?.data?.data
    if (!user)
      return {
        success: false,
        message: "User not found",
        data: null,
        meta: null,
      }

    const prefKey =
      notification_type === NotificationType.EMAIL ? "email" : "push"
    if (!user.preferences || !user.preferences[prefKey]) {
      return {
        success: true,
        message: `${notification_type} notifications disabled by user`,
        data: { request_id, notification_type, priority },
        meta: null,
      }
    }

    const key = `notification:${request_id}`
    const existing = JSON.parse((await this.redis.get(key)) || "{}")

    if (existing) {
      if (["pending", "delivered"].includes(existing.status)) {
        return {
          success: true,
          message: "Notification already processed",
          data: { request_id, notification_type, priority },
          meta: null,
        }
      }
      if (existing.status === "failed") {
        return {
          success: true,
          message: "Notification previously failed",
          data: { request_id, notification_type, priority },
          meta: null,
        }
      }
    } else {
      await this.redis.set(
        key,
        JSON.stringify({
          status: "pending",
          timestamp: new Date().toISOString(),
        }),
        "EX",
        60 * 60 * 24,
      )
    }

    try {
      await this.channel.publish(
        this.exchange,
        notification_type,
        Buffer.from(
          JSON.stringify({
            notification_type,
            user_id,
            template_code,
            variables,
            request_id,
            priority,
            metadata,
          }),
        ),
        { persistent: true, priority },
      )

      return {
        success: true,
        message: `${notification_type} notification queued successfully`,
        data: { request_id, notification_type, priority },
        meta: null,
      }
    } catch (err) {
      this.logger.error("Failed to publish to queue", err?.message || err)
      return {
        success: false,
        message: "Failed to queue notification",
        data: null,
        meta: null,
      }
    }
  }

  // ==========================
  // Update status
  // ==========================
  async updateStatus(
    notification_type: string,
    body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    const { notification_id, status, timestamp, error } = body
    if (!notification_id)
      return {
        success: false,
        message: "notification_id required",
        data: null,
        meta: null,
      }

    const key = `notification:${notification_id}`
    const record = {
      status,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    }

    await this.redis.set(key, JSON.stringify(record), "EX", 60 * 60 * 24)

    return {
      success: true,
      message: `${notification_type} notification status updated`,
      data: { notification_id, status, error },
      meta: null,
    }
  }

  // ==========================
  // Get status
  // ==========================
  async getStatus(request_id: string): Promise<NotificationResponse> {
    const key = `notification:${request_id}`
    const raw = await this.redis.get(key)
    if (!raw)
      return { success: false, message: "not found", data: null, meta: null }

    const parsed = JSON.parse(raw)
    return {
      success: true,
      message: "ok",
      data: { request_id, status: parsed },
      meta: null,
    }
  }

  // ==========================
  // Generic gateway proxy
  // ==========================
  async forwardToService(
    serviceName: string,
    method: string,
    path: string,
    data?: any,
  ): Promise<any> {
    try {
      const baseUrl =
        await this.usersService["consulService"].getServiceAddress(serviceName)
      if (!baseUrl) throw new Error(`${serviceName} not found in Consul`)

      const url = `${baseUrl}${path}`
      const res = await lastValueFrom(this.http.request({ method, url, data }))
      return res.data
    } catch (err: any) {
      this.logger.error(`❌ Proxy to ${serviceName} failed:`, err.message)
      return {
        success: false,
        message: `${serviceName} unavailable`,
        error: err.message,
      }
    }
  }
}
