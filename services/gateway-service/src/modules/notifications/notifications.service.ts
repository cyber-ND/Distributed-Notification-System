import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { lastValueFrom } from 'rxjs';
import { UpdateNotificationStatusDto } from './dto/notification-status.dto';
import {
  CreateNotificationDto,
  NotificationType,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private redis: Redis;
  private channel: any;
  private exchange: string;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private mqProvider: any,
    private readonly http: HttpService,
    private readonly usersService: UsersService,
  ) {
    this.channel = mqProvider?.channel;
    this.exchange = mqProvider?.exchange || process.env.RABBITMQ_EXCHANGE || 'notifications.direct';

    // Use environment variables for Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000), // retry with backoff
    });

    // Catch connection errors
    this.redis.on('error', (err) => {
      this.logger.error('[ioredis] Redis connection error:', err.message);
    });

    this.redis.on('connect', () => {
      this.logger.log('[ioredis] Connected to Redis successfully');
    });
  }

  // Safe Redis helpers
  private async safeSet(key: string, value: any, expireSec?: number) {
    try {
      if (this.redis.status !== 'ready') {
        this.logger.warn('[ioredis] Redis not ready, skipping set', key);
        return;
      }
      if (expireSec) {
        await this.redis.set(key, JSON.stringify(value), 'EX', expireSec);
      } else {
        await this.redis.set(key, JSON.stringify(value));
      }
    } catch (err) {
      this.logger.error('[ioredis] Failed to set key', key, err.message);
    }
  }

  private async safeGet(key: string) {
    try {
      if (this.redis.status !== 'ready') {
        this.logger.warn('[ioredis] Redis not ready, skipping get', key);
        return null;
      }
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      this.logger.error('[ioredis] Failed to get key', key, err.message);
      return null;
    }
  }

  private async safeLpush(key: string, value: any) {
    try {
      if (this.redis.status !== 'ready') return;
      await this.redis.lpush(key, JSON.stringify(value));
      await this.redis.ltrim(key, 0, 100);
    } catch (err) {
      this.logger.error('[ioredis] Failed to push list', key, err.message);
    }
  }

  // Handle create notification
  async handleNotification(payload: CreateNotificationDto) {
    const {
      notification_type,
      user_id,
      template_code,
      variables,
      request_id,
      priority,
      metadata,
    } = payload;

    if (!request_id) throw new BadRequestException('request_id is required');

    // validate user
    // todo: implement circuit breaker and consul dynamic service discovery
    const userUrl = `${process.env.USER_SERVICE_URL}/api/v1/users/${user_id}`;
    let userRes;
    try {
      userRes = await this.usersService.forwardToUserService('GET', `/api/v1/users/${user_id}`);
    } catch (err) {
      this.logger.error(
        'User service request failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Failed to fetch user');
    }

    console.log(userRes);
    const user = userRes?.data?.data;
    if (!user) throw new BadRequestException('User not found');

    // validate notification preference
    const prefKey =
      notification_type === NotificationType.EMAIL ? 'email' : 'push';

    if (!user.preferences || !user.preferences[prefKey]) {
      return {
        message: `${notification_type} notifications disabled by user`,
        data: {
          request_id: request_id,
          notification_type: notification_type,
          priority: priority,
        },
        meta: null,
      };
    }

    // Idempotency key for uniqueness
    const key = `notification:${request_id}`;

    const existing = JSON.parse((await this.redis.get(key)) || '{}');

    if (existing) {
      if (existing.status === 'pending' || existing.status === 'delivered') {
        return {
          message: 'Notification already processed',
          data: { request_id, notification_type, priority },
          meta: null,
        };
      }

      if (existing.status === 'failed') {
        return {
          message: 'Notification previously failed',
          data: { request_id, notification_type, priority },
          meta: null,
        };
      }
    } else {
      await this.redis.set(
        key,
        JSON.stringify({
          status: 'pending',
          timestamp: new Date().toISOString(),
        }),
        'EX',
        60 * 60 * 24, // keep for 24 hours
      );
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
        {
          persistent: true,
          priority,
        },
      );
    } catch (err) {
      this.logger.error('Failed to publish to queue', err?.message || err);
      throw new BadRequestException('Failed to queue notification');
    }

    return {
      message: `${notification_type} notification queued successfully`,
      data: { request_id, notification_type, priority },
      meta: null,
    };
  }

  // Called by downstream services to update status
  async updateStatus(
    notification_type: string,
    body: UpdateNotificationStatusDto,
  ) {
    const { notification_id, status, timestamp, error } = body;

    if (!notification_id)
      throw new BadRequestException('notification_id required');

    const record = {
      status,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    await this.redis.set(key, JSON.stringify(record), 'EX', 60 * 60 * 24); // keep for 24 hours

    // // Optionally: append to a list of status events for that notification
    // await this.redis.lpush(
    //   `notification_events:${notification_id}`,
    //   JSON.stringify(record),
    // );
    // await this.redis.ltrim(`notification_events:${notification_id}`, 0, 100); // keep last 100

    return {
      message: `${notification_type} notification status updated`,
      data: { notification_id, status, error },
      meta: null,
    };
  }

  // Get status
  async getStatus(request_id: string) {
    const key = `notification:${request_id}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      return { success: false, message: 'not found', data: null, meta: null };
    }
    const parsed = JSON.parse(raw);
    // Also return recent events if present
    // const eventsRaw = await this.redis.lrange(
    //   `notification_events:${request_id}`,
    //   0,
    //   50,
    // );

    // const events = eventsRaw.map((e) => {
    //   try {
    //     return JSON.parse(e);
    //   } catch {
    //     return e;
    //   }
    // });

    return {
      message: 'ok',
      data: { request_id, status: parsed },
      meta: null,
    };
  }
}
