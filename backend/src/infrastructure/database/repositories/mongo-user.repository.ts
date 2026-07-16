import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../application/ports/user-repository.port';
import { DEFAULT_TECHNICAL_SKILL_WEIGHT } from '../../../domain/users/user-profile';
import type {
  TechnicalSkillKeyword,
  UserProfile,
} from '../../../domain/users/user-profile';
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
            coverLetterInstructionTemplate: '',
            jobTitleKeywords: [],
            resumeMarkdown: '',
            technicalSkillKeywords: [],
            matchingProfileVersion: 1,
          },
        },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return toUserProfile(user);
  }

  async saveResumeWithKeywords(input: {
    resumeMarkdown: string;
    jobTitleKeywords: string[];
    technicalSkillKeywords: string[];
  }): Promise<UserProfile> {
    const existingProfile = await this.resolveDefaultUser();
    const existingWeights = new Map(
      existingProfile.technicalSkillKeywords.map((skill) => [
        skill.keyword.toLocaleLowerCase(),
        skill.weight,
      ]),
    );
    const technicalSkillKeywords = toStringKeywords(
      input.technicalSkillKeywords,
    ).map((keyword) => ({
      keyword,
      weight:
        existingWeights.get(keyword.toLocaleLowerCase()) ??
        DEFAULT_TECHNICAL_SKILL_WEIGHT,
    }));

    const user = await this.userModel
      .findByIdAndUpdate(
        DEFAULT_USER_ID,
        {
          $set: {
            resumeMarkdown: input.resumeMarkdown,
            jobTitleKeywords: toStringKeywords(input.jobTitleKeywords),
            technicalSkillKeywords,
          },
          $inc: { matchingProfileVersion: 1 },
        },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return toUserProfile(user);
  }

  async saveCoverLetterInstructionTemplate(input: {
    coverLetterInstructionTemplate: string;
  }): Promise<UserProfile> {
    const user = await this.userModel
      .findByIdAndUpdate(
        DEFAULT_USER_ID,
        {
          $set: {
            coverLetterInstructionTemplate:
              input.coverLetterInstructionTemplate,
          },
        },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return toUserProfile(user);
  }

  async saveProfileKeywords(input: {
    jobTitleKeywords: string[];
    technicalSkillKeywords: TechnicalSkillKeyword[];
  }): Promise<UserProfile> {
    const user = await this.userModel
      .findByIdAndUpdate(
        DEFAULT_USER_ID,
        {
          $set: {
            jobTitleKeywords: toStringKeywords(input.jobTitleKeywords),
            technicalSkillKeywords: toTechnicalSkillKeywords(
              input.technicalSkillKeywords,
            ),
          },
          $inc: { matchingProfileVersion: 1 },
        },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .orFail()
      .exec();

    return toUserProfile(user);
  }
}

function toUserProfile(user: UserDocument): UserProfile {
  return {
    id: user._id,
    resumeMarkdown: user.resumeMarkdown,
    coverLetterInstructionTemplate: user.coverLetterInstructionTemplate ?? '',
    jobTitleKeywords: toStringKeywords(user.jobTitleKeywords),
    technicalSkillKeywords: toTechnicalSkillKeywords(
      user.technicalSkillKeywords,
    ),
    matchingProfileVersion: Math.max(1, user.matchingProfileVersion ?? 1),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toStringKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenKeywords = new Set<string>();
  const keywords: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const keyword = item.trim();

    if (!keyword) {
      continue;
    }

    const normalizedKeyword = keyword.toLocaleLowerCase();

    if (seenKeywords.has(normalizedKeyword)) {
      continue;
    }

    seenKeywords.add(normalizedKeyword);
    keywords.push(keyword);
  }

  return keywords;
}

function toTechnicalSkillKeywords(value: unknown): TechnicalSkillKeyword[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenKeywords = new Set<string>();
  const technicalSkillKeywords: TechnicalSkillKeyword[] = [];

  for (const item of value) {
    const skill = toTechnicalSkillKeyword(item);

    if (!skill) {
      continue;
    }

    const normalizedKeyword = skill.keyword.toLocaleLowerCase();

    if (seenKeywords.has(normalizedKeyword)) {
      continue;
    }

    seenKeywords.add(normalizedKeyword);
    technicalSkillKeywords.push(skill);
  }

  return technicalSkillKeywords;
}

function toTechnicalSkillKeyword(
  value: unknown,
): TechnicalSkillKeyword | undefined {
  if (typeof value === 'string') {
    const keyword = value.trim();

    return keyword
      ? { keyword, weight: DEFAULT_TECHNICAL_SKILL_WEIGHT }
      : undefined;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const item = value as { keyword?: unknown; weight?: unknown };

  if (typeof item.keyword !== 'string') {
    return undefined;
  }

  const keyword = item.keyword.trim();

  if (!keyword) {
    return undefined;
  }

  return {
    keyword,
    weight: toTechnicalSkillWeight(item.weight),
  };
}

function toTechnicalSkillWeight(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TECHNICAL_SKILL_WEIGHT;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}
