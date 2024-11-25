import { Request } from 'express';
import { UserDto } from './users/dto/user.dto';

export type RequestWithUser = {
  user?: UserDto;
} & Request;
