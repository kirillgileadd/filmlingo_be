import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

async function start() {
  const PORT = process.env.PORT || 8000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization', // добавляем разрешенные заголовки
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('egfilm Backend')
    .setDescription('egfilm REST API docs')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // Убедитесь, что указали формат JWT
      },
      'JWT', // Это имя схемы для авторизации
    )
    .addTag('Gilead')
    .build();

  // app.useGlobalPipes(new ValidationPipe());

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  app
    .getHttpAdapter()
    .getInstance()
    .get('/api-json', (req, res) => {
      res.json(document);
    });

  app.useGlobalGuards();

  app.useStaticAssets(join(__dirname, '..', 'uploads/video'), {
    prefix: '/uploads/video',
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads/subtitles'), {
    prefix: '/uploads/subtitles',
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads/image'), {
    prefix: '/uploads/image',
  });

  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

start();
