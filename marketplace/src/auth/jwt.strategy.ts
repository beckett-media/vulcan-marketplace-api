import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { passportJwtSecret } from 'jwks-rsa';
import configuration, { RUNTIME_ENV } from 'src/config/configuration';
import { DetailedLogger } from 'src/logger/detailed.logger';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new DetailedLogger('JwtStrategy', {
    timestamp: true,
  });

  constructor(private readonly authService: AuthService) {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const authority = `https://cognito-idp.${config['cognito']['COGNITO_REGION']}.amazonaws.com/${config['cognito']['COGNITO_USER_POOL_ID']}`;
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authority}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: authority,
      algorithms: ['RS256'],
    });
  }

  public async validate(payload: any) {
    return {
      user: payload['sub'],
      groups: payload['cognito:groups'],
      client_id: payload['client_id'],
    };
  }
}
