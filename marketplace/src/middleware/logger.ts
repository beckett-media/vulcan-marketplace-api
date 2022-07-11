import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
import { trimForLoggin } from 'src/util/format';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('RequestLogger');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl, path, body, params } = request;
    const baseInfo = `[${ip}] ${method} ${baseUrl}${path}`;
    var _body = trimForLoggin(body);
    var _params = trimForLoggin(params);

    this.logger.log(
      `${baseInfo} ${JSON.stringify(_body)} ${JSON.stringify(_params)}}`,
    );
    next();
  }
}
