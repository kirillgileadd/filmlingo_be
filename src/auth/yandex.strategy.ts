import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-yandex';
import { AuthService } from './auth.service';

type YandexProfile = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  name?: { familyName: string | null; givenName: string | null } | null;
  gender: null;
  emails: { value: string }[];
  photos?:
    | {
        value?: string;
        type?: string;
      }[]
    | null;
};

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.YANDEX_CLIENT_ID,
      clientSecret: process.env.YANDEX_CLIENT_SECRET,
      callbackURL: 'http://localhost:8000/auth/yandex/callback',
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: YandexProfile,
    // eslint-disable-next-line @typescript-eslint/ban-types
    done: Function,
  ) {
    const { displayName, emails, photos } = profile;

    const user = await this.authService.findOrCreateUser({
      username: displayName,
      email: emails?.[0]?.value,
      photo: photos?.[0]?.value,
      isActivated: true,
    });

    done(null, user);
  }
}
