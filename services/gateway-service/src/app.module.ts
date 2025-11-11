import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RabbitMQProvider } from './modules/queues/rabbitmq.provider';
import { UsersModule } from './modules/users/users.module';
import { SwaggerGateway } from './swagger.gateway';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    NotificationsModule,
    UsersModule,
  ],
  providers: [RabbitMQProvider, SwaggerGateway],
  exports: [RabbitMQProvider],
})
export class AppModule {}
