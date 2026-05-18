import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 8;
const BASE_DELAY_MS = 2000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let lastError: unknown;
    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Database connected after ${attempt} attempts`);
        }
        return;
      } catch (e) {
        lastError = e;
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `Database connect attempt ${attempt}/${CONNECT_ATTEMPTS} failed: ${msg}`,
        );
        if (attempt < CONNECT_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * attempt));
        }
      }
    }
    this.logger.error(
      'Could not reach DATABASE_URL. For Neon: resume the project in the dashboard, use ?sslmode=require on the URL, and check VPN/firewall.',
    );
    throw lastError;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
