import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getInfo(): {
    name: string;
    version: string;
    description: string;
    status: string;
    environment: string;
  } {
    return {
      name: this.configService.get<string>('APP_NAME', 'SaaS Boilerplate'),
      version: '1.0.0',
      description: 'Enterprise-grade SaaS Boilerplate Backend',
      status: 'running',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }
}
