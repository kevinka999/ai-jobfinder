import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Textarea } from '../components/Field';
import { apiRequest } from '../lib/api';
import type { UserProfileResponse } from '../lib/types';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
          setError(getErrorMessage(caughtError));
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
  }, []);

  async function saveResume() {
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

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
      setSaveMessage('Resume saved');
    } catch (caughtError) {
      setError(`${getErrorMessage(caughtError)} The previous profile is unchanged.`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h1>User Profile</h1>
        <Button
          disabled={isLoading || isSaving}
          icon={<Save size={16} />}
          onClick={saveResume}
          variant="primary"
        >
          {isSaving ? 'Saving' : 'Save'}
        </Button>
      </div>
      {isLoading ? <LoadingState label="Loading profile" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {saveMessage ? <div className="success-line">{saveMessage}</div> : null}
      <div className="profile-grid">
        <div className="panel">
          <Textarea
            label="Resume Markdown"
            onChange={(event) => setResumeMarkdown(event.target.value)}
            placeholder="# Resume"
            rows={22}
            value={resumeMarkdown}
          />
        </div>
        <aside className="panel side-panel">
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
    <section className="keyword-section">
      <h2>{label}</h2>
      {values.length === 0 ? (
        <p className="muted">No keywords saved.</p>
      ) : (
        <div className="keyword-list">
          {values.map((value) => (
            <span className="keyword-chip" key={value}>
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
