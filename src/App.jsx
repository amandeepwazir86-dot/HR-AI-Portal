import { useState } from 'react';

const stages = [
  'Resume Shortlisted',
  'Interview Scheduled',
  'Next Round Selected',
  'Offer Under Approval',
  'Documents Required',
  'Rejected'
];

const defaultCompanyProfile =
  'Translab Technologies is a global technology consulting and digital transformation company specializing in Cloud, Data & AI, Digital Engineering, Application Modernization, and Managed Services. The company partners with enterprises across Banking, Financial Services, Healthcare, Manufacturing, Telecom, and the Public Sector to deliver innovative, scalable, and business-driven technology solutions. In addition to its consulting services, Translab has developed Tantor, its proprietary AI-powered data and analytics platform that enables organizations to streamline data management, improve governance, and derive actionable business insights through intelligent automation.';

const initialForm = {
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  position: '',
  currentStage: 'Resume Shortlisted',
  interviewMode: 'Phone',
  interviewDate: '',
  interviewStartTime: '',
  interviewEndTime: '',
  teamsMeetingLink: '',
  interviewAddress: '',
  recruiterName: '',
  jobDescription: '',
  jobDescriptionAttachment: null,
  companyProfile: defaultCompanyProfile,
  additionalNotes: ''
};

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('hrPortalToken');
    const username = localStorage.getItem('hrPortalUsername');
    return token ? { token, username } : null;
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [formData, setFormData] = useState(initialForm);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Login failed.');
      }

      localStorage.setItem('hrPortalToken', payload.token);
      localStorage.setItem('hrPortalUsername', payload.username);
      setAuth(payload);
      setLoginData({ username: '', password: '' });
    } catch (loginRequestError) {
      setLoginError(loginRequestError.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (auth?.token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      }).catch(() => {});
    }

    localStorage.removeItem('hrPortalToken');
    localStorage.removeItem('hrPortalUsername');
    setAuth(null);
    setGeneratedContent(null);
    setError('');
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        jobDescriptionAttachment: {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result
        }
      }));
    };

    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setFormData((current) => ({
      ...current,
      jobDescriptionAttachment: null
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setGeneratedContent(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/recruitment/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify(formData)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to generate recruitment messages.');
      }

      setGeneratedContent(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const normalizedPhone = formData.candidatePhone.replace(/[^\d]/g, '');
  const emailLink = generatedContent
    ? `mailto:${encodeURIComponent(formData.candidateEmail)}?subject=${encodeURIComponent(
        generatedContent.emailSubject
      )}&body=${encodeURIComponent(generatedContent.emailBody)}`
    : '';
  const whatsappLink = generatedContent
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(generatedContent.whatsappMessage)}`
    : '';
  const smsLink = generatedContent
    ? `sms:${normalizedPhone}?body=${encodeURIComponent(generatedContent.smsMessage)}`
    : '';
  const calendarLink = generatedContent ? createCalendarLink(formData, generatedContent) : '';
  const showInterviewFields = formData.currentStage === 'Interview Scheduled';

  if (!auth) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">HR AI Portal</p>
          <h1>Coordinator Login</h1>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </label>
            {loginError && <div className="error-message">{loginError}</div>}
            <button className="generate-button" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">HR AI Portal</p>
            <h1>Recruitment Email Writer</h1>
          </div>
          <div className="header-actions">
            <a
              className="download-report-button"
              href={`/api/recruitment/report?token=${encodeURIComponent(auth.token)}`}
            >
              Download Report
            </a>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Logout
            </button>
            <span className="status-pill">Template Mode</span>
          </div>
        </header>

        <div className="content-grid">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Candidate Name
                <input
                  name="candidateName"
                  value={formData.candidateName}
                  onChange={handleChange}
                  placeholder="Enter candidate name"
                  required
                />
              </label>

              <label>
                Candidate Email
                <input
                  type="email"
                  name="candidateEmail"
                  value={formData.candidateEmail}
                  onChange={handleChange}
                  placeholder="candidate@example.com"
                  required
                />
              </label>

              <label>
                Candidate Mobile Number
                <input
                  type="tel"
                  name="candidatePhone"
                  value={formData.candidatePhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </label>

              <label>
                Position
                <input
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Enter position"
                  required
                />
              </label>

              <label>
                Current Stage
                <select name="currentStage" value={formData.currentStage} onChange={handleChange}>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Interview Date
                <input
                  type="date"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleChange}
                  required={showInterviewFields}
                />
              </label>

              {showInterviewFields && (
                <>
                  <label>
                    Interview Mode
                    <select
                      name="interviewMode"
                      value={formData.interviewMode}
                      onChange={handleChange}
                    >
                      <option value="Phone">Phone</option>
                      <option value="HR Interview">HR Interview</option>
                      <option value="Teams">Teams</option>
                      <option value="Face to Face">Face to Face</option>
                    </select>
                  </label>

                  <label>
                    Start Time
                    <input
                      type="time"
                      name="interviewStartTime"
                      value={formData.interviewStartTime}
                      onChange={handleChange}
                      required={showInterviewFields}
                    />
                  </label>

                  <label>
                    End Time
                    <input
                      type="time"
                      name="interviewEndTime"
                      value={formData.interviewEndTime}
                      onChange={handleChange}
                      required={showInterviewFields}
                    />
                  </label>
                </>
              )}

              <label>
                Recruiter Name
                <input
                  name="recruiterName"
                  value={formData.recruiterName}
                  onChange={handleChange}
                  placeholder="Enter recruiter name"
                  required
                />
              </label>
            </div>

            {showInterviewFields && formData.interviewMode === 'Teams' && (
              <label>
                Teams Meeting Link
                <input
                  type="url"
                  name="teamsMeetingLink"
                  value={formData.teamsMeetingLink}
                  onChange={handleChange}
                  placeholder="Paste Microsoft Teams meeting link"
                  required
                />
              </label>
            )}

            {showInterviewFields && formData.interviewMode === 'Face to Face' && (
              <label>
                Interview Address
                <textarea
                  name="interviewAddress"
                  value={formData.interviewAddress}
                  onChange={handleChange}
                  placeholder="Enter office address, floor, room, landmark, and contact instructions"
                  rows="4"
                  required
                />
              </label>
            )}

            <label>
              Job Description
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the JD summary, responsibilities, skills, location, or JD link"
                rows="5"
                required
              />
            </label>

            <div className="attachment-field">
              <span className="attachment-label">Attach Job Description</span>
              <label className="file-upload-button">
                Choose JD File
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleAttachmentChange}
                />
              </label>
              {formData.jobDescriptionAttachment && (
                <div className="attachment-summary">
                  <span>{formData.jobDescriptionAttachment.name}</span>
                  <button type="button" onClick={removeAttachment}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <label>
              About Company
              <textarea
                name="companyProfile"
                value={formData.companyProfile}
                onChange={handleChange}
                placeholder="Edit the company profile before generating communication"
                rows="5"
                required
              />
            </label>

            <label>
              Additional Notes
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Add interview timing, document list, joining details, or other context"
                rows="5"
              />
            </label>

            {error && <div className="error-message">{error}</div>}

            <button className="generate-button" type="submit" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Email'}
            </button>
          </form>

          <section className="output-panel" aria-live="polite">
            {generatedContent ? (
              <>
                <div className="action-bar">
                  <a className="action-button email-action" href={emailLink}>
                    Open Email
                  </a>
                  <a
                    className="action-button whatsapp-action"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open WhatsApp
                  </a>
                  <a className="action-button sms-action" href={smsLink}>
                    Open SMS
                  </a>
                  {formData.currentStage === 'Interview Scheduled' && (
                    <a
                      className="action-button calendar-action"
                      href={calendarLink}
                      download={`interview-${formData.candidateName || 'candidate'}.ics`}
                    >
                      Download Calendar
                    </a>
                  )}
                  {formData.currentStage === 'Interview Scheduled' &&
                    formData.interviewMode === 'Teams' && (
                      <a
                        className="action-button teams-action"
                        href={formData.teamsMeetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Teams
                      </a>
                    )}
                </div>
                <OutputBlock title="Email Subject" content={generatedContent.emailSubject} compact />
                {generatedContent.jobDescriptionAttachment && (
                  <OutputBlock
                    title="Attached Job Description"
                    content={`${generatedContent.jobDescriptionAttachment.originalName} saved with this entry. Attach this file manually when sending email from your mail app.`}
                    compact
                  />
                )}
                <OutputBlock title="Email Body" content={generatedContent.emailBody} />
                <OutputBlock
                  title={`WhatsApp Message to ${generatedContent.candidatePhone}`}
                  content={generatedContent.whatsappMessage}
                />
                <OutputBlock
                  title={`SMS Message to ${generatedContent.candidatePhone}`}
                  content={generatedContent.smsMessage}
                />
              </>
            ) : (
              <div className="empty-state">
                <h2>Generated content will appear here</h2>
                <p>Complete the candidate details and generate stage-based recruitment communication.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function OutputBlock({ title, content, compact = false }) {
  return (
    <article className="output-block">
      <h2>{title}</h2>
      <pre className={compact ? 'compact-output' : ''}>{content}</pre>
    </article>
  );
}

export default App;

function createCalendarLink(formData, generatedContent) {
  const startDate = toCalendarDate(formData.interviewDate, formData.interviewStartTime);
  const endDate = toCalendarDate(formData.interviewDate, formData.interviewEndTime);
  const location =
    formData.interviewMode === 'Teams'
      ? formData.teamsMeetingLink
      : formData.interviewMode === 'Face to Face'
        ? formData.interviewAddress
        : `Phone: ${formData.candidatePhone}`;
  const description = generatedContent.emailBody.replace(/\r?\n/g, '\\n');
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HR AI Portal//Recruitment Interview//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${formData.candidateEmail}`,
    `DTSTAMP:${toCalendarDate(new Date().toISOString().slice(0, 10), '00:00')}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:Interview - ${formData.position} - ${formData.candidateName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location.replace(/\r?\n/g, ' ')}`,
    `ATTENDEE;CN=${formData.candidateName}:MAILTO:${formData.candidateEmail}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}

function toCalendarDate(dateValue, timeValue) {
  if (!dateValue || !timeValue) return '';
  return `${dateValue.replaceAll('-', '')}T${timeValue.replace(':', '')}00`;
}
