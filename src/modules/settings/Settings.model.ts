import { prop, getModelForClass } from '@typegoose/typegoose';

export class Settings {}

export const SettingsModel = getModelForClass(Settings);
