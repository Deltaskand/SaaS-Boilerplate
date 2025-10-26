import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Database Module
 * Configures PostgreSQL connection using Prisma
 * This is a global module, so PrismaService is available everywhere
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
