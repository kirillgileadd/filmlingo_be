import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import * as process from 'node:process';

type GoogleProfile = {
  id: string;
  displayName?: string | null;
  name?: { familyName: string | null; givenName: string | null };
  emails?: { value?: string; verified: boolean }[];
  photos?: { value?: string }[];
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
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
