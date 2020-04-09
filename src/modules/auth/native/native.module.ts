import { GraphQLModule } from '@graphql-modules/core';
import * as typeDefs from './schema.graphql';
import resolvers, { ClientInputs } from './resolvers';
import { NativeAuthProvider } from './native.provider';

/** The native module is for basic username, password and email auth */
export const Native = new GraphQLModule({
  typeDefs,
  resolvers,
  providers: [NativeAuthProvider],
});
