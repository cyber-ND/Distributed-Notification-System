import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RabbitMQProvider } from '../queues/rabbitmq.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from '../users/users.module';
import * as amqp from 'amqplib';

@Module({
  imports: [HttpModule, UsersModule,],
  controllers: [NotificationsController],
  providers: [NotificationsService, RabbitMQProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
