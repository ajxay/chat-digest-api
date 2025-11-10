import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExampleDocument = Example & Document;

@Schema({ timestamps: true })
export class Example {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ExampleSchema = SchemaFactory.createForClass(Example);

