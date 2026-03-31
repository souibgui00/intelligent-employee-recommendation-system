import { Module } from '@nestjs/common';
<<<<<<< HEAD
=======
import { MongooseModule } from '@nestjs/mongoose';
>>>>>>> feature/participation-history-tracking
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
<<<<<<< HEAD
import { ConfigModule, ConfigService } from '@nestjs/config';
=======
import { GoogleStrategy } from './google.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Session, SessionSchema } from './schema/session.schema';
import { CommonModule } from '../common/common.module';
>>>>>>> feature/participation-history-tracking

@Module({
  imports: [
    UsersModule,
<<<<<<< HEAD
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
=======
    CommonModule,
    PassportModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
>>>>>>> feature/participation-history-tracking
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }

