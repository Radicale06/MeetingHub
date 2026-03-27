import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { userApi, type UpdateProfileData } from '../api/user';
import './Settings.css';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Brasilia' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'Atlantic/Reykjavik', label: '(UTC+00:00) Reykjavik' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin, Rome' },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv' },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, Kolkata' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Shanghai' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul' },
  { value: 'Australia/Sydney', label: '(UTC+11:00) Sydney' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland' },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
  { value: 'Africa/Lagos', label: '(UTC+01:00) Lagos' },
  { value: 'Africa/Johannesburg', label: '(UTC+02:00) Johannesburg' },
  { value: 'Africa/Casablanca', label: '(UTC+01:00) Casablanca' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Espanol' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portugues' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setJobTitle(user.jobTitle || '');
      setCompany(user.company || '');
      setTimezone(user.timezone || 'UTC');
      setLanguage(user.language || 'en');
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const data: UpdateProfileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        timezone,
        language,
      };
      await userApi.updateProfile(data);
      await refreshUser();
      showSuccess('Profile saved successfully.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      await userApi.uploadAvatar(file);
      await refreshUser();
      showSuccess('Avatar updated.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      await userApi.removeAvatar();
      await refreshUser();
      showSuccess('Avatar removed.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?';

  return (
    <div className="mh-settings-page">
      <div className="mh-settings-header">
        <h2>Settings</h2>
        <p>Manage your account settings and preferences.</p>
      </div>

      <div className="mh-settings-content">
        {/* Secondary Nav */}
        <nav className="mh-settings-nav">
          <a href="#profile" className="active">Profile</a>
          <a href="#preferences">Preferences</a>
        </nav>

        {/* Settings Panel */}
        <div className="mh-settings-panel">
          {successMsg && <div className="mh-settings-success">{successMsg}</div>}
          {errorMsg && <div className="mh-settings-error">{errorMsg}</div>}

          <section className="mh-settings-section" id="profile">
            <div className="mh-section-title">
              <h3>Profile Information</h3>
              <p>Update your photo and personal details.</p>
            </div>

            <div className="mh-profile-photo-area">
              <Avatar src={user?.avatarUrl || undefined} fallback={initials} size="xl" />
              <div className="mh-photo-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? 'Uploading...' : 'Upload new image'}
                </Button>
                {user?.avatarUrl && (
                  <Button variant="outline" onClick={handleRemoveAvatar} disabled={uploadingAvatar}>
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <form className="mh-settings-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="mh-form-row">
                <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Input label="Email Address" value={email} type="email" disabled />

              <div className="mh-form-row">
                <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </form>
          </section>

          <section className="mh-settings-section" id="preferences">
            <div className="mh-section-title">
              <h3>Experience Preferences</h3>
              <p>Customize how MeetingHub looks and feels for you.</p>
            </div>

            <div className="mh-settings-form">
              <div className="mh-form-row">
                <Select
                  label="Timezone"
                  options={TIMEZONE_OPTIONS}
                  value={timezone}
                  onChange={setTimezone}
                />
                <Select
                  label="Language"
                  options={LANGUAGE_OPTIONS}
                  value={language}
                  onChange={setLanguage}
                />
              </div>
            </div>
          </section>

          <div className="mh-settings-actions">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
