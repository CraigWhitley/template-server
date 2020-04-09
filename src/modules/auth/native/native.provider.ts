import { Injectable } from '@graphql-modules/di';
import { NativeAuthModel, NativeAuth } from './NativeAuth.model';
import { Status } from '../../user/User.model';
import { Logging } from '../../../lib/logging';
import {
  usernameLength,
  passwordLength,
  passwordFormat,
  emailFormat
} from '../../../lib/validate';

const MIN_USERNAME_LENGTH = 5;
const MAX_USERNAME_LENGTH = 18;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const PASSWORD_REGEX = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/;
const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

const logger = new Logging().logger;

interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

interface ChangePassword {
  username: string;
  oldPassword: string;
  newPassword: string;
}

interface ChangeEmail {
  username: string;
  password: string;
  newEmail: string;
}

interface Token {
  accessToken: string;
}

@Injectable()
export class NativeAuthProvider {
  registerUser = async ({
    username,
    email,
    password
  }: RegisterUserInput): Promise<Boolean> => {
    /* #region Validation */

    // TODO: [client] Password strength meter on client https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet
    // TODO: Do we want to persist device information? IP addresses??

    if (!username || !password || !email) {
      logger.warn({
        message:
          'User managed to bypass both client and graphql "required" validation on either the username, password or email.',
        meta: 'native-provider'
      });
      throw new Error('All fields are required.');
    }

    const emailToLower = email.toLowerCase();
    const displayName = username;
    const usernameToLower = username.toLowerCase();

    if (await NativeAuthModel.exists({ username: usernameToLower }))
      throw new Error('Username already exists.');

    if (await NativeAuthModel.exists({ email: emailToLower }))
      throw new Error('Email already exists.');

    usernameLength(username, MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH);

    passwordLength(password, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH);

    passwordFormat(password, PASSWORD_REGEX);

    emailFormat(emailToLower, EMAIL_REGEX);

    /* #endregion */
    const confirmationCode: string = NativeAuth.generateConfirmationCode();

    const hashedPassword = NativeAuthModel.hashPassword(password);

    if (hashedPassword) {
      try {
        await NativeAuthModel.create({
          username: usernameToLower,
          displayName: displayName,
          password: hashedPassword,
          email: emailToLower,
          status: Status.UNCONFIRMED,
          confirmationCode: confirmationCode
        });

        //TODO: Send email to user with callback and code
        // For now, console.log it so we can continue implementing native auth

        return true;
      } catch (error) {
        logger.error({ message: error, meta: 'native-provider' });
        throw new Error(NativeAuthModel.defaultErrorMessage);
      }
    } else {
      logger.error({
        message: 'User creation failed: cannot hash password',
        meta: 'native-provider'
      });
      throw new Error(NativeAuthModel.defaultErrorMessage);
    }
  };
  registerUserCode = async ({ code }): Promise<Token> => {
    //FIXME: Rate limit amount of code retries for x amount of time
    let users: NativeAuth[];
    try {
      users = await NativeAuthModel.find({
        confirmationCode: code
      });
    } catch (error) {
      logger.error({ message: error, meta: 'native-provider' });
      throw new Error(NativeAuthModel.defaultErrorMessage);
    }

    // If no user was found with that code...
    if (users.length === 0) {
      //TODO: Resend code functionality. args: email, search db for email etc.
      logger.warn({
        message: 'Could not find confirmation code in database.',
        meta: 'native-provider'
      });
      throw new Error(
        'Sorry, that confirmation code is invalid. Please use the "Resend Code" option.'
      );
    }

    // If there is more than a single user with that code (!!!)...
    if (users.length > 1) {
      logger.error({
        message:
          'More than one instance of a unique validation code in the database!',
        meta: 'native-provider'
      });
      throw new Error(
        'Sorry, that confirmation code is invalid. Please use the "Resend Code" option.'
      );
    }

    let user: NativeAuth = users[0];

    if (user) {
      if (user.status === Status.UNCONFIRMED) {
        // We have a user and it's status is UNCONFIRMED. Expected behaviour.
        const token = await NativeAuth.createToken(user, '72h');

        user.status = Status.ACTIVE;
        user.confirmationCode = undefined;
        user.loginAttempts = 0;

        try {
          await NativeAuthModel.updateOne({ username: user.username }, user);
        } catch (error) {
          logger.error({ message: error, meta: 'native-provider' });
          throw new Error(NativeAuthModel.defaultErrorMessage);
        }
        return { accessToken: token };
      }

      if (user.status === Status.ACTIVE) {
        user.confirmationCode = undefined;
        const token = await NativeAuth.createToken(user, '72h');
        try {
          await NativeAuthModel.updateOne({ username: user.username }, user);
        } catch (error) {
          logger.error({ message: error, meta: 'native-provider' });
          throw new Error(NativeAuthModel.defaultErrorMessage);
        }

        return { accessToken: token };
      }

      if (user.status === Status.SUSPENDED) {
        throw new Error(
          'Sorry, this account is currently suspended. Please contact support if you think this is in error.'
        );
      }
    }
    //FIXME: How did we get here??
    logger.error({
      message: 'Somehow we got here, work out how!',
      meta: 'nativeauth-provider'
    });
    throw new Error(NativeAuthModel.defaultErrorMessage);
  };
  resendUserCode = async ({ email }: RegisterUserInput): Promise<Boolean> => {
    let user: NativeAuth | undefined;

    try {
      user = (await NativeAuthModel.findOne({
        email: email.toLowerCase()
      })) as NativeAuth;
    } catch (error) {
      logger.error({ message: error, meta: 'native-provider' });
    }

    if (user) {
      if (user.status === Status.ACTIVE) {
        logger.warn({
          message:
            'User tried to activate account using code, but account was already active: ' +
            user.username,
          meta: 'native-provider'
        });
        throw new Error('Account already activated. Please log in.');
      }
      const confirmationCode: string = NativeAuth.generateConfirmationCode();
      user.status = Status.UNCONFIRMED;
      user.confirmationCode = confirmationCode;

      try {
        await NativeAuthModel.updateOne({ username: user.username }, user);
      } catch (error) {
        logger.error({ message: error, meta: 'native-provider' });
        throw new Error('User could not be updated.');
      }

      //TODO: Send email to use with callback code

      return true;
    } else {
      throw new Error('Email could not be found.');
    }
  };
  loginUser = async ({
    username,
    password
  }: RegisterUserInput): Promise<Token> => {
    const user: NativeAuth = await this.authenticateUser(username, password);

    if (user) {
      return { accessToken: await NativeAuthModel.createToken(user, '72h') };
    } else {
      logger.warn({
        message: 'Incorrect login attempt for user: ' + username,
        meta: 'native-provider'
      });
      throw new Error('Username or password incorrect.');
    }
  };
  changePassword = async ({
    username,
    oldPassword,
    newPassword
  }: ChangePassword): Promise<Boolean> => {
    // Lets validate the new password before we make any database calls
    passwordLength(newPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH);
    passwordFormat(newPassword, PASSWORD_REGEX);

    // Re-authenticate user for security
    const user: NativeAuth = await this.authenticateUser(username, oldPassword);

    if (user) {
      try {
        user.password = NativeAuthModel.hashPassword(newPassword);
        await NativeAuthModel.updateOne({ password: user.password }, user);
        return true;
      } catch (error) {
        logger.error({ message: error, meta: 'native-provider' });
        throw new Error(
          'Sorry, password could not be updated. Please try again later.'
        );
      }
    }
    return false;
  };
  changeEmail = async ({
    username,
    password,
    newEmail
  }: ChangeEmail): Promise<Boolean> => {
    // Lets validate the new email before we make any database calls
    emailFormat(newEmail, EMAIL_REGEX);

    // Re-authenticate user for security
    const user: NativeAuth = await this.authenticateUser(username, password);

    if (user) {
      try {
        user.email = newEmail.toLowerCase();
        user.status = Status.UNCONFIRMED;
        user.confirmationCode = NativeAuthModel.generateConfirmationCode();

        // TODO: Send email with confirmation code
        // TODO: [client] Somehow handle the user viewing profile to update email, but being UNCONFIRMED at the same time?

        await NativeAuthModel.updateOne(
          {
            email: user.email,
            status: user.status,
            confirmationCode: user.confirmationCode
          },
          user
        );
        return true;
      } catch (error) {
        logger.error({ message: error, meta: 'native-provider' });
        throw new Error(
          'Sorry, email could not be updated. Please try again later.'
        );
      }
    }
    return false;
  };
  forgotPassword = async ({ email }: RegisterUserInput): Promise<Boolean> => {
    try {
      const user = await NativeAuthModel.findOne({ email: email });
      if (user) {
        // TODO: Send email with reset code
        return true;
      } else {
        //TODO: No user found with that email
        return false;
      }
    } catch (error) {
      logger.error({ message: error, meta: 'native-provider' });
      return false;
    }
    //TODO: forgotPassword implement
    return true;
  };
  forgotPasswordCode = async ({ code }): Promise<Token> => {
    //TODO: forgotPasswordCode implement
    return { accessToken: '' };
  };
  private authenticateUser = async (
    username: string,
    password: string
  ): Promise<NativeAuth> => {
    let user: NativeAuth;
    let passwordResult = false;

    try {
      user = (await NativeAuthModel.findOne({
        username: username.toLowerCase()
      })) as NativeAuth;
    } catch (error) {
      logger.error({ message: error, meta: 'native-provider' });
      throw new Error(NativeAuthModel.defaultErrorMessage);
    }

    if (user)
      passwordResult = await NativeAuth.comparePassword(
        password,
        user.password
      );
    else {
      logger.warn({
        message: '[username] Incorrect login attempt for user: ' + username,
        meta: 'native-provider'
      });
      throw new Error('Username or password incorrect.');
    }

    if (passwordResult) {
      return user;
    } else {
      // TODO: handle multiple failed login attempts.
      // account lockout after x attempts?
      user.loginAttempts++;
      await NativeAuthModel.updateOne({ username: user.username }, user);
      logger.warn({
        message: `[password] ${user.loginAttempts} Incorrect login attempts for user: ${user.username}`,
        meta: 'native-provider'
      });
      throw new Error(
        `Username or password incorrect. Login Attempt ${user.loginAttempts} / 4 before account is locked for security.`
      );
    }
  };
}
