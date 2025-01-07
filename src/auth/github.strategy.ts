import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';
import * as process from 'node:process'; // Ваш AuthService

export type GithubProfile = {
  displayName?: string;
  username?: string;
  profileUrl?: string;
  photos?: { value: string }[];
  emails: { value: string }[];
};

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_REDIRECT_URL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GithubProfile,
  ) {
    const { displayName, photos, emails } = profile;
    const user = await this.authService.findOrCreateUser({
      username: displayName,
      email: emails?.[0]?.value,
      photo: photos?.[0]?.value,
      isActivated: true,
    });

    return user;
  }
}
