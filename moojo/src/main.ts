import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { expressApp } from './express';

async function bootstrap() {
  // https://stackoverflow.com/a/68943920
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

  await app.listen(3000);
}
bootstrap();
