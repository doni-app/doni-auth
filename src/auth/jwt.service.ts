import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../user/interfaces/user.interface';
import { InjectModel } from '../../node_modules/@nestjs/mongoose';

@Injectable()
export class JWTService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  createToken(
    email: string,
    id: string,
  ): { expires_in: string; access_token: string } {
    const expiresIn = '7d',
      secretOrKey = 'secretKey'; // Use a secure key in production
    const userInfo = { email: email, id: id };
    const token = jwt.sign(userInfo, secretOrKey, { expiresIn });
    return {
      expires_in: expiresIn,
      access_token: token,
    };
  }

  async validateUser(signedUser: User): Promise<User | null> {
    const userFromDb = await this.userModel.findOne({
      email: signedUser.email,
    });
    if (userFromDb) {
      return userFromDb;
    }
    return null;
  }
}
