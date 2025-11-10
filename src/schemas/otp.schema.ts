import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ default: 0 })
  attempts: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Create TTL index to auto-delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

