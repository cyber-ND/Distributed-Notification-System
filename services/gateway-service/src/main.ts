import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as dotenv from 'dotenv';
import { SwaggerGateway } from './swagger.gateway';
import { AppModule } from './app.module';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api/v1');

  // Global validation pipe (class-validator + class-transformer)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // optional CORS
  app.enableCors();

    // Setup Swagger UI
  const swaggerGateway = app.get(SwaggerGateway);
  await swaggerGateway.setup(app);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway listening on port ${port}`);
  console.log(`Swagger docs at http://localhost:${port}/swagger/api-docs`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap error', err);
  process.exit(1);
});
