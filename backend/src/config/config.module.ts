import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Config Module
 * @Global decorator makes ConfigService available everywhere
 * No need to import this module in other modules
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
