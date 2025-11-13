import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { RabbitMQProvider } from "../queues/rabbitmq.provider"
import { UsersModule } from "../users/users.module"
import { NotificationsController } from "./notifications.controller"
import { NotificationsService } from "./notifications.service"
import { ConsulModule } from "../../consul/consul.module"

@Module({
  imports: [HttpModule, UsersModule, ConsulModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RabbitMQProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
