import { GraphQLModule } from '@graphql-modules/core';
import { Native } from './native/native.module';

/** Add Auth modules you wish to use here */
export const AuthModule = new GraphQLModule({
  imports: [Native]
});
