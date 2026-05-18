import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

import cookieParser from 'cookie-parser';

import { getCorsOrigins } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  expressApp.get('/', (_req, res) => {
    res.json({
      service: 'RBAC API',
      status: 'ok',
      health: '/api/health',
      auth: '/api/auth',
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 5000;

  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
