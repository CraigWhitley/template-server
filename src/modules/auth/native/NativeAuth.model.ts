import {
  prop,
  getDiscriminatorModelForClass,
  post
} from '@typegoose/typegoose';
import { User, UserModel } from '../../user/User.model';
import jwt from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';
import { Logging } from '../../../lib/logging';
import bcryptjs from 'bcryptjs';
const logger = new Logging().logger;

// @post<NativeAuth>('find', user => {
//   console.log('Post found!: ', user);
// })
// @post<NativeAuth>('findOne', user => {
//   user.status = NativeAuthModel.convertStringToStatus(user.status)
// })
export class NativeAuth extends User {
  @prop({ required: true, unique: true })
  public username!: string;
  @prop({ required: true })
  public displayName!: string;
  @prop({ required: true, unique: true })
  public email!: string;
  @prop()
  public password!: string;
  @prop()
  public confirmationCode?: string;
  @prop()
  public forgotPasswordCode?: string;
  @prop({ required: true, default: 0 })
  public loginAttempts: number;
  static readonly generateConfirmationCode = (): string =>
    uuidv4().replace(/-/g, '');
  static readonly getJwt = () => {
    return jwt;
  };
  static readonly hashPassword = (password: string): string => {
    const salt = bcryptjs.genSaltSync(10);
    if (salt) return bcryptjs.hashSync(password, salt);
    else {
      logger.error({
        message: 'Could not generate salt for password.',
        meta: 'nativeauth-model'
      });
      throw new Error('Could not generate salt for password.');
    }
  };

  static readonly comparePassword = async (
    password: string,
    userDbPassword: string
  ): Promise<boolean> => {
    const result = await bcryptjs.compare(password, userDbPassword);

    return result;
  };
  static readonly createToken = (
    user: NativeAuth,
    expiresIn: number | string
  ) => {
    const { username, email } = user;
    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!username || !email) {
      logger.error({
        message: 'No username or email passed to create token method.',
        meta: 'nativeauth-model'
      });
      throw new Error('No username or email passed to create token method.');
    }
    if (!jwtSecret) {
      logger.error({
        message: 'JWT secret is unreadable.',
        meta: 'nativeauth-model'
      });
      throw new Error('JWT secret is unreadable.');
    }
    try {
      const token = jwt.sign({ username, email }, jwtSecret, {
        expiresIn: expiresIn
      });
      return token;
    } catch (error) {
      logger.error({
        message: error,
        meta: 'nativeauth-model'
      });
      throw new Error('JWT could not create token: ' + error);
    }
  };
}

// Combine NativeAuth into UserModel
export const NativeAuthModel = getDiscriminatorModelForClass(
  UserModel,
  NativeAuth
);
