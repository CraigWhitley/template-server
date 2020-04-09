import { NativeAuthProvider } from './native.provider';
import { NativeAuthModel } from './NativeAuth.model';
import { Logging } from '../../../lib/logging';
import { Status } from 'src/modules/user/User.model';
const logger = new Logging().logger;

export interface ClientInputs {
  username: string;
  email: string;
  password: string;
  status: Status;
}
export default {
  Query: {
    //TODO: me():user using express middleware
    findUserByUsername: async function (root, { username }: ClientInputs) {
      try {
        const user = await NativeAuthModel.findOne({
          username: username.toLowerCase(),
        });
        return user;
      } catch (error) {
        logger.error({ message: error, meta: 'native-resolver' });
        throw new Error('');
      }
    },
    findUserByEmail: async function (root, { email }: ClientInputs) {
      try {
        const user = await NativeAuthModel.findOne({
          email: email.toLowerCase(),
        });
        return user;
      } catch (error) {
        logger.error({ message: error, meta: 'native-resolver' });
        throw new Error(NativeAuthModel.defaultErrorMessage);
      }
    },
    findUsersByStatus: async function (root, { status }: ClientInputs) {
      //TODO: Move status query to User module
      try {
        const usersResult = await NativeAuthModel.find({ status: status });
        return usersResult;
      } catch (error) {
        logger.error({ message: error, meta: 'native-resolver' });
        throw new Error(NativeAuthModel.defaultErrorMessage);
      }
    },
    isUsernameUnique: async function (root, { username }: ClientInputs) {
      try {
        return await NativeAuthModel.exists({
          username: username.toLowerCase(),
        });
      } catch (error) {
        logger.error({ message: error, meta: 'native-resolver' });
        throw new Error(NativeAuthModel.defaultErrorMessage);
      }
    },
    isEmailUnique: async function (root, { email }: ClientInputs) {
      try {
        return await NativeAuthModel.exists({ email: email.toLowerCase() });
      } catch (error) {
        logger.error({ message: error, meta: 'native-resolver' });
        throw new Error(NativeAuthModel.defaultErrorMessage);
      }
    },
  },
  Mutation: {
    changeEmail: (root, data, { injector }) =>
      injector.get(NativeAuthProvider).changeEmail(data),
    changePassword: (root, data, { injector }) =>
      injector.get(NativeAuthProvider).changePassword(data),
    forgotPassword: (root, { data }, { injector }) =>
      injector.get(NativeAuthProvider).forgotPassword(data),
    forgotPasswordCode: (root, { data }, { injector }) =>
      injector.get(NativeAuthProvider).forgotPasswordCode(data),
    loginUser: (root, data, { injector }) =>
      injector.get(NativeAuthProvider).loginUser(data),
    registerUser: (root, { data }, { injector }) =>
      injector.get(NativeAuthProvider).registerUser(data),
    registerUserCode: (root, data, { injector }) =>
      injector.get(NativeAuthProvider).registerUserCode(data),
    resendUserCode: (root, data, { injector }) =>
      injector.get(NativeAuthProvider).resendUserCode(data),
  },
};
