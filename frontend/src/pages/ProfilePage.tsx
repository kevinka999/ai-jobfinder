import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Textarea } from '../components/Field';
import { useToast } from '../components/toastContext';
import {
  pageHeadingClass,
  pageStackClass,
  pageTitleClass,
  panelClass,
} from '../design/classes';
import { apiRequest } from '../lib/api';
import type { UserProfileResponse } from '../lib/types';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const nextProfile =
          await apiRequest<UserProfileResponse>('/users/profile');

        if (!ignore) {
          setProfile(nextProfile);
          setResumeMarkdown(nextProfile.resumeMarkdown);
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
  }, [toast]);

  async function saveResume() {
    setIsSaving(true);

    try {
      const nextProfile = await apiRequest<UserProfileResponse>(
        '/users/profile/resume',
        {
          body: JSON.stringify({ resumeMarkdown }),
          method: 'POST',
        },
      );

      setProfile(nextProfile);
      setResumeMarkdown(nextProfile.resumeMarkdown);
      toast.success('Resume saved');
    } catch (caughtError) {
      toast.error(
        `${getErrorMessage(caughtError)} The previous profile is unchanged.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={pageStackClass}>
      <div className={pageHeadingClass}>
        <h1 className={pageTitleClass}>User Profile</h1>
        <Button
          disabled={isLoading || isSaving}
          icon={<Save size={16} />}
          isLoading={isSaving}
          onClick={saveResume}
          variant="primary"
        >
          Save
        </Button>
      </div>
      {isLoading ? <LoadingState label="Loading profile" /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="grid grid-cols-1 items-start gap-section md:grid-cols-[minmax(0,1fr)_320px]">
        <div className={panelClass}>
          <Textarea
            label="Resume Markdown"
            onChange={(event) => setResumeMarkdown(event.target.value)}
            placeholder="# Resume"
            rows={22}
            value={resumeMarkdown}
          />
        </div>
        <aside className={`${panelClass} grid gap-[18px]`}>
          <KeywordSection
            label="Job-title keywords"
            values={profile?.jobTitleKeywords ?? []}
          />
          <KeywordSection
            label="Technical-skill keywords"
            values={profile?.technicalSkillKeywords ?? []}
          />
        </aside>
      </div>
    </section>
  );
}

function KeywordSection({ label, values }: { label: string; values: string[] }) {
  return (
    <section>
      <h2 className="mb-2.5 mt-0 text-[15px] font-bold text-app-text">
        {label}
      </h2>
      {values.length === 0 ? (
        <p className="text-app-text-muted">No keywords saved.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              className="inline-flex min-h-[26px] items-center rounded-control border border-brand-200 bg-brand-50 px-2 text-xs font-bold text-brand-700"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
