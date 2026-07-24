import { Plus, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { inputClassName, Textarea } from '../components/Field';
import { LoadingState } from '../components/LoadingState';
import { useToast } from '../components/toastContext';
import {
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import type { TechnicalSkillKeyword, UserProfileResponse } from '../lib/types';

export function ProfilePage() {
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [coverLetterInstructionTemplate, setCoverLetterInstructionTemplate] =
    useState('');
  const [jobTitleKeywords, setJobTitleKeywords] = useState<string[]>([]);
  const [mainTechnicalSkillKeywords, setMainTechnicalSkillKeywords] = useState<
    TechnicalSkillKeyword[]
  >([]);
  const [secondaryTechnicalSkillKeywords, setSecondaryTechnicalSkillKeywords] =
    useState<TechnicalSkillKeyword[]>([]);
  const [newJobTitleKeyword, setNewJobTitleKeyword] = useState('');
  const [newMainTechnicalSkillKeyword, setNewMainTechnicalSkillKeyword] =
    useState('');
  const [
    newSecondaryTechnicalSkillKeyword,
    setNewSecondaryTechnicalSkillKeyword,
  ] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isSavingInstructionTemplate, setIsSavingInstructionTemplate] =
    useState(false);
  const [isSavingKeywords, setIsSavingKeywords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const syncProfileState = useCallback((nextProfile: UserProfileResponse) => {
    setResumeMarkdown(nextProfile.resumeMarkdown);
    setCoverLetterInstructionTemplate(
      nextProfile.coverLetterInstructionTemplate,
    );
    setJobTitleKeywords(nextProfile.jobTitleKeywords);
    setMainTechnicalSkillKeywords(nextProfile.mainTechnicalSkillKeywords);
    setSecondaryTechnicalSkillKeywords(
      nextProfile.secondaryTechnicalSkillKeywords,
    );
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProfile =
          await apiRequest<UserProfileResponse>('/users/profile');

        if (!ignore) {
          syncProfileState(nextProfile);
        }
      } catch (caughtError) {
        if (!ignore) {
          const message = getErrorMessage(caughtError);
          setError(message);
          toast.error(`Could not load profile: ${message}`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [syncProfileState, toast]);

  async function saveResume() {
    setIsSavingResume(true);

    try {
      const nextProfile = await apiRequest<UserProfileResponse>(
        '/users/profile/resume',
        {
          body: JSON.stringify({ resumeMarkdown }),
          method: 'POST',
        },
      );

      syncProfileState(nextProfile);
      toast.success('Resume saved');
    } catch (caughtError) {
      toast.error(
        `${getErrorMessage(caughtError)} The previous profile is unchanged.`,
      );
    } finally {
      setIsSavingResume(false);
    }
  }

  async function saveCoverLetterInstructionTemplate() {
    setIsSavingInstructionTemplate(true);

    try {
      const nextProfile = await apiRequest<UserProfileResponse>(
        '/users/profile/cover-letter-instruction-template',
        {
          body: JSON.stringify({ coverLetterInstructionTemplate }),
          method: 'POST',
        },
      );

      syncProfileState(nextProfile);
      toast.success('Instruction template saved');
    } catch (caughtError) {
      toast.error(
        `Could not save instruction template: ${getErrorMessage(caughtError)}`,
      );
    } finally {
      setIsSavingInstructionTemplate(false);
    }
  }

  async function saveProfileKeywords() {
    setIsSavingKeywords(true);

    try {
      const nextProfile = await apiRequest<UserProfileResponse>(
        '/users/profile/keywords',
        {
          body: JSON.stringify({
            jobTitleKeywords,
            mainTechnicalSkillKeywords,
            secondaryTechnicalSkillKeywords,
          }),
          method: 'POST',
        },
      );

      syncProfileState(nextProfile);
      toast.success('Keywords saved');
    } catch (caughtError) {
      toast.error(`Could not save keywords: ${getErrorMessage(caughtError)}`);
    } finally {
      setIsSavingKeywords(false);
    }
  }

  function addJobTitleKeyword() {
    const keyword = newJobTitleKeyword.trim();

    if (!keyword || includesKeyword(jobTitleKeywords, keyword)) {
      return;
    }

    setJobTitleKeywords((currentKeywords) => [...currentKeywords, keyword]);
    setNewJobTitleKeyword('');
  }

  function deleteJobTitleKeyword(keyword: string) {
    setJobTitleKeywords((currentKeywords) =>
      currentKeywords.filter((currentKeyword) => currentKeyword !== keyword),
    );
  }

  function addTechnicalSkillKeyword(category: 'main' | 'secondary') {
    const keyword = (
      category === 'main'
        ? newMainTechnicalSkillKeyword
        : newSecondaryTechnicalSkillKeyword
    ).trim();
    const allTechnicalSkills = [
      ...mainTechnicalSkillKeywords,
      ...secondaryTechnicalSkillKeywords,
    ];

    if (
      !keyword ||
      allTechnicalSkills.some(
        (skill) =>
          skill.keyword.toLocaleLowerCase() === keyword.toLocaleLowerCase(),
      )
    ) {
      return;
    }

    const setSkills =
      category === 'main'
        ? setMainTechnicalSkillKeywords
        : setSecondaryTechnicalSkillKeywords;
    setSkills((currentSkills) => [...currentSkills, { keyword, weight: 5 }]);
    if (category === 'main') {
      setNewMainTechnicalSkillKeyword('');
    } else {
      setNewSecondaryTechnicalSkillKeyword('');
    }
  }

  function deleteTechnicalSkillKeyword(
    category: 'main' | 'secondary',
    keyword: string,
  ) {
    const setSkills =
      category === 'main'
        ? setMainTechnicalSkillKeywords
        : setSecondaryTechnicalSkillKeywords;
    setSkills((currentSkills) =>
      currentSkills.filter((skill) => skill.keyword !== keyword),
    );
  }

  function updateTechnicalSkillWeight(
    category: 'main' | 'secondary',
    keyword: string,
    weight: number,
  ) {
    const setSkills =
      category === 'main'
        ? setMainTechnicalSkillKeywords
        : setSecondaryTechnicalSkillKeywords;
    setSkills((currentSkills) =>
      currentSkills.map((skill) =>
        skill.keyword === keyword
          ? { ...skill, weight: clampTechnicalSkillWeight(weight) }
          : skill,
      ),
    );
  }

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>User Profile</h1>
        <Button
          disabled={isLoading || isSavingResume}
          icon={<Save size={16} />}
          isLoading={isSavingResume}
          onClick={saveResume}
          variant="primary"
        >
          Save Resume
        </Button>
      </div>
      {isLoading ? <LoadingState label="Loading profile" /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="grid grid-cols-1 items-start gap-section md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-section">
          <div className={panelClass}>
            <Textarea
              label="Resume Markdown"
              onChange={(event) => setResumeMarkdown(event.target.value)}
              placeholder="# Resume"
              rows={22}
              value={resumeMarkdown}
            />
          </div>
          <div className={panelClass}>
            <Textarea
              label="Cover-letter instruction template"
              onChange={(event) =>
                setCoverLetterInstructionTemplate(event.target.value)
              }
              placeholder="Keep it concise, focus on..."
              rows={7}
              value={coverLetterInstructionTemplate}
            />
            <div className="mt-section flex justify-end">
              <Button
                disabled={isLoading || isSavingInstructionTemplate}
                icon={<Save size={16} />}
                isLoading={isSavingInstructionTemplate}
                onClick={saveCoverLetterInstructionTemplate}
                variant="primary"
              >
                Save Instructions
              </Button>
            </div>
          </div>
        </div>
        <aside className={`${panelClass} grid gap-[18px]`}>
          <div className="flex items-center justify-between gap-inline">
            <h2 className="m-0 text-base font-bold text-app-text">Keywords</h2>
            <Button
              disabled={isLoading}
              icon={<Save size={14} />}
              isLoading={isSavingKeywords}
              onClick={saveProfileKeywords}
              variant="secondary"
            >
              Save Keywords
            </Button>
          </div>
          <JobTitleKeywordSection
            label="Job-title keywords"
            newKeyword={newJobTitleKeyword}
            onAdd={addJobTitleKeyword}
            onDelete={deleteJobTitleKeyword}
            onNewKeywordChange={setNewJobTitleKeyword}
            values={jobTitleKeywords}
          />
          <TechnicalSkillKeywordSection
            description="Core languages, runtimes, and role-defining frameworks."
            label="Main technical skills"
            newKeyword={newMainTechnicalSkillKeyword}
            onAdd={() => addTechnicalSkillKeyword('main')}
            onDelete={(keyword) => deleteTechnicalSkillKeyword('main', keyword)}
            onNewKeywordChange={setNewMainTechnicalSkillKeyword}
            onWeightChange={(keyword, weight) =>
              updateTechnicalSkillWeight('main', keyword, weight)
            }
            values={mainTechnicalSkillKeywords}
          />
          <TechnicalSkillKeywordSection
            description="Supporting libraries, platforms, and tools, regardless of expertise."
            label="Secondary technical skills"
            newKeyword={newSecondaryTechnicalSkillKeyword}
            onAdd={() => addTechnicalSkillKeyword('secondary')}
            onDelete={(keyword) =>
              deleteTechnicalSkillKeyword('secondary', keyword)
            }
            onNewKeywordChange={setNewSecondaryTechnicalSkillKeyword}
            onWeightChange={(keyword, weight) =>
              updateTechnicalSkillWeight('secondary', keyword, weight)
            }
            values={secondaryTechnicalSkillKeywords}
          />
        </aside>
      </div>
    </section>
  );
}

function JobTitleKeywordSection({
  label,
  newKeyword,
  onAdd,
  onDelete,
  onNewKeywordChange,
  values,
}: {
  label: string;
  newKeyword: string;
  onAdd: () => void;
  onDelete: (keyword: string) => void;
  onNewKeywordChange: (keyword: string) => void;
  values: string[];
}) {
  return (
    <section>
      <h2 className="mb-2.5 mt-0 text-[15px] font-bold text-app-text">
        {label}
      </h2>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_36px] gap-inline">
        <input
          aria-label="New job-title keyword"
          className={`${inputClassName} h-8`}
          onChange={(event) => onNewKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onAdd();
            }
          }}
          placeholder="Add job title"
          value={newKeyword}
        />
        <Button
          aria-label="Add job-title keyword"
          icon={<Plus size={15} />}
          onClick={onAdd}
          title="Add job title"
          variant="secondary"
        />
      </div>
      {values.length === 0 ? (
        <p className="text-app-text-muted">No keywords saved.</p>
      ) : (
        <div className="grid gap-1.5">
          {values.map((value) => (
            <div
              className="grid min-h-8 grid-cols-[minmax(0,1fr)_36px] items-center gap-inline rounded-control border border-brand-200 bg-brand-50 px-2 text-xs font-bold text-brand-700"
              key={value}
            >
              <span className="min-w-0 truncate">{value}</span>
              <Button
                aria-label={`Delete ${value}`}
                icon={<Trash2 size={14} />}
                onClick={() => onDelete(value)}
                title="Delete keyword"
                variant="ghost"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TechnicalSkillKeywordSection({
  description,
  label,
  newKeyword,
  onAdd,
  onDelete,
  onNewKeywordChange,
  onWeightChange,
  values,
}: {
  description: string;
  label: string;
  newKeyword: string;
  onAdd: () => void;
  onDelete: (keyword: string) => void;
  onNewKeywordChange: (keyword: string) => void;
  onWeightChange: (keyword: string, weight: number) => void;
  values: TechnicalSkillKeyword[];
}) {
  return (
    <section>
      <h2 className="mb-2.5 mt-0 text-[15px] font-bold text-app-text">
        {label}
      </h2>
      <p className="mb-2 text-xs text-app-text-muted">{description}</p>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_36px] gap-inline">
        <input
          aria-label={`New ${label.toLocaleLowerCase()} keyword`}
          className={`${inputClassName} h-8`}
          onChange={(event) => onNewKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onAdd();
            }
          }}
          placeholder="Add technical skill"
          value={newKeyword}
        />
        <Button
          aria-label={`Add ${label.toLocaleLowerCase()} keyword`}
          icon={<Plus size={15} />}
          onClick={onAdd}
          title={`Add ${label.toLocaleLowerCase()} keyword`}
          variant="secondary"
        />
      </div>
      {values.length === 0 ? (
        <p className="text-app-text-muted">No keywords saved.</p>
      ) : (
        <div className="grid gap-2">
          {values.map((skill) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_64px_36px] items-center gap-inline"
              key={skill.keyword}
            >
              <span className="min-w-0 truncate text-sm font-semibold text-app-text">
                {skill.keyword}
              </span>
              <input
                aria-label={`${skill.keyword} weight`}
                className={`${inputClassName} h-8 px-2 text-center`}
                max={10}
                min={1}
                onChange={(event) =>
                  onWeightChange(skill.keyword, Number(event.target.value))
                }
                step={1}
                type="number"
                value={skill.weight}
              />
              <Button
                aria-label={`Delete ${skill.keyword}`}
                icon={<Trash2 size={14} />}
                onClick={() => onDelete(skill.keyword)}
                title="Delete skill"
                variant="ghost"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function includesKeyword(
  keywords: readonly string[],
  keyword: string,
): boolean {
  return keywords.some(
    (currentKeyword) =>
      currentKeyword.toLocaleLowerCase() === keyword.toLocaleLowerCase(),
  );
}

function clampTechnicalSkillWeight(weight: number): number {
  if (!Number.isFinite(weight)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.round(weight)));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
