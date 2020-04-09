import { GraphQLModule } from '@graphql-modules/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SettingsModule } from './settings/settings.module';

export const AppModule = new GraphQLModule({
  imports: [UserModule, AuthModule, SettingsModule]
});
