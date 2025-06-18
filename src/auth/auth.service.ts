import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcryptjs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailVerification } from './interfaces/emailverification.interface';
import { ForgottenPassword } from './interfaces/forgottenpassword.interface';
import { JWTService } from './jwt.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('EmailVerification')
    private readonly emailVerificationModel: Model<EmailVerification>,
    @InjectModel('ForgottenPassword')
    private readonly forgottenPasswordModel: Model<ForgottenPassword>,
    private readonly jwtService: JWTService,
    private readonly userService: UserService,
  ) {}

  async validateLogin(email: string, password: string) {
    const userFromDb = await this.userService.findByEmail(email);
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    if (!userFromDb.auth.email.valid)
      throw new HttpException('LOGIN.EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);

    const isValidPass = await bcrypt.compare(password, userFromDb.password);

    if (isValidPass) {
      const accessToken = this.jwtService.createToken(
        email,
        userFromDb._id as string,
      );
      return { token: accessToken, user: userFromDb };
    } else {
      throw new HttpException('LOGIN.ERROR', HttpStatus.UNAUTHORIZED);
    }
  }

  async verifyEmail(token: string): Promise<boolean | void> {
    const emailVerif = await this.emailVerificationModel.findOne({
      emailToken: token,
    });
    if (emailVerif && emailVerif.email) {
      const userFromDb = await this.userService.findByEmail(emailVerif.email);
      if (userFromDb) {
        userFromDb.auth.email.valid = true;
        const savedUser = await userFromDb.save();
        await emailVerif.deleteOne();
        return !!savedUser;
      }
    } else {
      throw new HttpException(
        'LOGIN.EMAIL_CODE_NOT_VALID',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async createEmailToken(email: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationModel.findOne({
      email: email,
    });
    if (
      emailVerification &&
      (new Date().getTime() - emailVerification.timestamp.getTime()) / 60000 <
        15
    ) {
      throw new HttpException(
        'LOGIN.EMAIL_SENT_RECENTLY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      await this.emailVerificationModel.findOneAndUpdate(
        { email: email },
        {
          email: email,
          emailToken: (
            Math.floor(Math.random() * 9000000) + 1000000
          ).toString(), //Generate 7 digits number
          timestamp: new Date(),
        },
        { upsert: true },
      );
      return true;
    }
  }

  async sendEmailVerification(email: string): Promise<boolean> {
    const model = await this.emailVerificationModel.findOne({ email: email });

    if (model && model.emailToken) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: '587',
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'kitty.stroman40@ethereal.email',
          pass: 'hH7ayZgMBxajZueHjq',
        },
      });

      const mailOptions = {
        from: '"Company" <' + 'kitty.stroman40@ethereal.email' + '>',
        to: email, // list of receivers (separated by ,)
        subject: 'Verify Email',
        text: 'Verify Email',
        html:
          'Hi! <br><br> Thanks for your registration<br><br>' +
          '<a href=' +
          'smtp.ethereal.email' +
          ':' +
          '587' +
          '/auth/email/verify/' +
          model.emailToken +
          '>Click here to activate your account</a>', // html body
      };

      const sent = await new Promise<boolean>(function (resolve, reject) {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Message error: %s', error);
            return reject(error);
          }
          console.log('Message sent: %s', info.messageId);
          resolve(true);
        });
      });

      return sent;
    } else {
      throw new HttpException(
        'REGISTER.USER_NOT_REGISTERED',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async createForgottenPasswordToken(
    email: string,
  ): Promise<ForgottenPassword> {
    const forgottenPassword = await this.forgottenPasswordModel.findOne({
      email: email,
    });
    if (
      forgottenPassword &&
      (new Date().getTime() - forgottenPassword.timestamp.getTime()) / 60000 <
        15
    ) {
      throw new HttpException(
        'RESET_PASSWORD.EMAIL_SENT_RECENTLY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      const forgottenPasswordModel =
        await this.forgottenPasswordModel.findOneAndUpdate(
          { email: email },
          {
            email: email,
            newPasswordToken: (
              Math.floor(Math.random() * 9000000) + 1000000
            ).toString(), //Generate 7 digits number,
            timestamp: new Date(),
          },
          { upsert: true, new: true },
        );
      if (forgottenPasswordModel) {
        return forgottenPasswordModel;
      } else {
        throw new HttpException(
          'LOGIN.ERROR.GENERIC_ERROR',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async sendEmailForgotPassword(email: string): Promise<boolean> {
    const userFromDb = await this.userService.findByEmail(email);
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const tokenModel = await this.createForgottenPasswordToken(email);

    if (tokenModel && tokenModel.newPasswordToken) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: '587',
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'kitty.stroman40@ethereal.email',
          pass: 'hH7ayZgMBxajZueHjq',
        },
      });

      const mailOptions = {
        from: '"Company" <' + 'kitty.stroman40@ethereal.email' + '>',
        to: email, // list of receivers (separated by ,)
        subject: 'Forgotten Password',
        text: 'Forgot Password',
        html:
          'Hi! <br><br> If you requested to reset your password<br><br>' +
          '<a href=' +
          'smtp.ethereal.email' +
          ':' +
          '587' +
          '/auth/email/reset-password/' +
          tokenModel.newPasswordToken +
          '>Click here</a>', // html body
      };

      const sent = await new Promise<boolean>(function (resolve, reject) {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Message error: %s', error);
            return reject(error);
          }
          console.log('Message sent: %s', info.messageId);
          resolve(true);
        });
      });

      return sent;
    } else {
      throw new HttpException(
        'REGISTER.USER_NOT_REGISTERED',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getForgottenPasswordModel(
    newPasswordToken: string,
  ): Promise<ForgottenPassword | null> {
    return await this.forgottenPasswordModel.findOne({
      newPasswordToken: newPasswordToken,
    });
  }

  async checkPassword(email: string, password: string) {
    const userFromDb = await this.userService.findByEmail(email);
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    return await bcrypt.compare(password, userFromDb.password);
  }
}
