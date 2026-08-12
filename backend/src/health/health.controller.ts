import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok' | 'error';
  /** Whether the database answered a trivial query. */
  database: 'up' | 'down';
  /** Seconds since the process started. */
  uptime: number;
  timestamp: string;
}

/**
 * Public liveness/readiness probe at `GET /api/health`.
 *
 * Deliberately unauthenticated so platform health checks and uptime monitors
 * can reach it, and exempt from rate limiting so a frequent pinger is never
 * throttled into a false alarm.
 *
 * It reports `503` when the database is unreachable: a process that is running
 * but cannot serve a single request is not healthy, and answering `200` there
 * would hide a total outage from whatever is watching.
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Service and database health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unreachable' })
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResponse> {
    let database: 'up' | 'down' = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      database = 'down';
      this.logger.error(
        'Health check failed: database unreachable',
        error instanceof Error ? error.stack : String(error),
      );
    }

    if (database === 'down') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: database === 'up' ? 'ok' : 'error',
      database,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
