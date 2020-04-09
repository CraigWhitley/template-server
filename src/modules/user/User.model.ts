import { prop, getModelForClass } from '@typegoose/typegoose';

export enum Status {
  UNCONFIRMED = 'UNCONFIRMED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}
export class User {
  @prop({ enum: Status, required: true })
  status!: Status;

  defaultErrorMessage: 'Sorry, there was an error processing this request. Please try again in a few minutes.';
}

export const UserModel = getModelForClass(User);
