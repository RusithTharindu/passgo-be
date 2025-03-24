import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use = (req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} - ${responseTime}ms`,
      );
    });

    next();
  };
}
