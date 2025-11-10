import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  phoneNumber: string;

  @Prop()
  email?: string;

  @Prop()
  name?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

