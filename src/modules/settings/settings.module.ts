import { GraphQLModule } from '@graphql-modules/core';
import * as typeDefs from './schema.graphql';
import resolvers from './resolvers';

export const SettingsModule = new GraphQLModule({
  typeDefs,
  resolvers
});
