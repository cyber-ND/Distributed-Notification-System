import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UpdateNotificationStatusDto } from './dto/notification-status.dto';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Create queue notification (email | push)
  @Post('/notifications')
  @HttpCode(HttpStatus.ACCEPTED)
  async createNotification(@Body() body: CreateNotificationDto) {
    const result = await this.notificationsService.handleNotification(body);
    return {
      success: true,
      data: result.data || null,
      message: result.message,
      meta: result.meta || null,
    };
  }

  // status updates from downstream services (email/push)
  @Post('/:notification_preference/status')
  async updateStatus(
    @Param('notification_preference') notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ) {
    const result = await this.notificationsService.updateStatus(
      notification_preference,
      body,
    );
    return {
      success: true,
      data: result.data || null,
      message: result.message || `${notification_preference} status updated`,
      meta: result.meta || null,
    };
  }

  // notification status by request_id
  @Get('/:request_id')
  async getStatus(@Param('request_id') request_id: string) {
    const result = await this.notificationsService.getStatus(request_id);
    return {
      success: true,
      data: result.data || null,
      message: result.message || null,
      meta: result.meta || null,
    };
  }

  @Get('/health')
  health() {
    return {
      success: true,
      data: { status: 'ok' },
      message: 'healthy',
      meta: null,
    };
  }
}
