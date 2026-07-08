import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const DEFAULT_USER_ID = 'default-user';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  _id!: string;

  @Prop({ default: '', type: String })
  resumeMarkdown!: string;

  @Prop({ default: [], type: [String] })
  jobTitleKeywords!: string[];

  @Prop({ default: [], type: [String] })
  technicalSkillKeywords!: string[];

  createdAt!: Date;

  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
