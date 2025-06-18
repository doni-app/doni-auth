import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/schemas/user.schema';
import { ForgottenPasswordSchema } from './schemas/forgottenpassword.schema';
import { EmailVerificationSchema } from './schemas/emailverification.schema';
import { JWTService } from './jwt.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'EmailVerification', schema: EmailVerificationSchema },
      { name: 'ForgottenPassword', schema: ForgottenPasswordSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, JWTService],
})
export class AuthModule {}
