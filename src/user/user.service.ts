import * as bcrypt from 'bcryptjs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/user.interface';

const saltRounds = 12;

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email: email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userRegistered = await this.findByEmail(createUserDto.email);

    if (!userRegistered) {
      createUserDto.password = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const createdUser = new this.userModel(createUserDto);

      return await createdUser.save();
    } else if (!userRegistered.auth.email.valid) {
      return userRegistered;
    } else {
      throw new HttpException(
        'REGISTRATION.USER_ALREADY_REGISTERED',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async setPassword(email: string, newPassword: string): Promise<boolean> {
    const userFromDb = await this.userModel.findOne({ email: email });
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    userFromDb.password = await bcrypt.hash(newPassword, saltRounds);

    await userFromDb.save();
    return true;
  }
}
