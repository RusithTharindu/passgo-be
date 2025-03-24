import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { LoggerMiddleware } from './middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.use(new LoggerMiddleware().use);

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //   }),
  // );

  // const config = new DocumentBuilder()
  //   .setTitle('PassGo API')
  //   .setDescription('API Documentation for PassGo')
  //   .setVersion('1.0.0')
  //   .addBearerAuth()
  //   .build();

  // const configService = app.get(ConfigService);

  // const document = SwaggerModule.createDocument(app, config);

  // SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000", 
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  });

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
