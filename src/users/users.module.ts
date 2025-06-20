import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users.model';
import { Role } from '../roles/roles.model';
import { UserRoles } from '../roles/user-roles.model';
import { RolesModule } from '../roles/roles.module';
import { Token } from '../token/token.model';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { Word } from 'src/words/word.model';
import { UserWords } from 'src/words/user-words.model';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([User, Role, Token, UserRoles, Word, UserWords]),
    RolesModule,
    forwardRef(() => AuthModule),
    TokenModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
