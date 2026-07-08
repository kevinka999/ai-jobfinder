import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../application/ports/user-repository.port';
import { UserProfile } from '../../../domain/users/user-profile';
import { DEFAULT_USER_ID, User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async resolveDefaultUser(): Promise<UserProfile> {
    const user = await this.userModel
      .findByIdAndUpdate(
        DEFAULT_USER_ID,
        {
          $setOnInsert: {
            _id: DEFAULT_USER_ID,
            jobTitleKeywords: [],
            resumeMarkdown: '',
            technicalSkillKeywords: [],
          },
        },
        {
          new: true,
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return {
      id: user._id,
      resumeMarkdown: user.resumeMarkdown,
      jobTitleKeywords: user.jobTitleKeywords,
      technicalSkillKeywords: user.technicalSkillKeywords,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async saveResumeWithKeywords(input: {
    resumeMarkdown: string;
    jobTitleKeywords: string[];
    technicalSkillKeywords: string[];
  }): Promise<UserProfile> {
    const user = await this.userModel
      .findByIdAndUpdate(
        DEFAULT_USER_ID,
        {
          $set: {
            resumeMarkdown: input.resumeMarkdown,
            jobTitleKeywords: input.jobTitleKeywords,
            technicalSkillKeywords: input.technicalSkillKeywords,
          },
        },
        {
          new: true,
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return {
      id: user._id,
      resumeMarkdown: user.resumeMarkdown,
      jobTitleKeywords: user.jobTitleKeywords,
      technicalSkillKeywords: user.technicalSkillKeywords,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
