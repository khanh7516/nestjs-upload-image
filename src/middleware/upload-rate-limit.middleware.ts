import rateLimit from 'express-rate-limit';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UploadRateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many uploads from this IP, please try again later.',

    handler: (req: Request, res: Response, next: NextFunction) => {
      console.warn(`[RateLimit] Blocked IP ${req.ip} - ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message: 'Too many uploads from this IP, please try again later.',
      });
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
