import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto } from "./dto/notification.dto"
import {
  NotificationsService,
  NotificationResponse,
} from "./notifications.service"

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Create queue notification (email | push)
  @Post("/notifications")
  @HttpCode(HttpStatus.ACCEPTED)
  async createNotification(
    @Body() body: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    return await this.notificationsService.handleNotification(body)
  }

  // Update notification status (email/push)
  @Post("/:notification_preference/status")
  async updateStatus(
    @Param("notification_preference") notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    return await this.notificationsService.updateStatus(
      notification_preference,
      body,
    )
  }

  // Get notification status by request_id
  @Get("/:request_id")
  async getStatus(
    @Param("request_id") request_id: string,
  ): Promise<NotificationResponse> {
    return await this.notificationsService.getStatus(request_id)
  }

  // Health check endpoint
  @Get("/health")
  health(): NotificationResponse {
    return {
      success: true,
      message: "healthy",
      data: { status: "ok" },
      meta: null,
    }
  }

  // ------------------------------
  // Generic Proxy endpoint
  // ------------------------------
  @Post("/proxy/:service/*")
  async proxyRequest(
    @Param("service") service: string,
    @Body() body: any,
    @Query() query: any,
  ): Promise<any> {
    const path = "/" + (service ? service + "/" : "") + (query.path || "")
    return await this.notificationsService.forwardToService(
      service,
      "POST",
      path,
      body,
    )
  }

  @Get("/proxy/:service/*")
  async proxyGetRequest(
    @Param("service") service: string,
    @Query() query: any,
  ): Promise<any> {
    const path = "/" + (service ? service + "/" : "") + (query.path || "")
    return await this.notificationsService.forwardToService(
      service,
      "GET",
      path,
    )
  }
}
