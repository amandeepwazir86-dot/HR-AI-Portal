# HR AI Portal

A browser-based HR AI Portal built with React, Node.js, and Express.

The first module is a Recruitment Email Writer. It generates template-based recruitment communication for email, WhatsApp, and SMS. This version does not connect to OpenAI.

## Features

- Candidate recruitment communication form
- Stage-based template generation
- Candidate mobile number capture for WhatsApp and SMS drafts
- Job description and company profile sharing in email only
- Editable About Company section prefilled with the Translab Technologies profile
- Job description file attachment storage
- Manual send buttons that open Email, WhatsApp, and SMS apps with generated text prefilled
- Interview scheduling modes for Phone, Teams, and Face to Face interviews
- Calendar invite download for scheduled interviews
- Local storage of generated recruitment entries
- CSV report download for saved entries
- Outputs:
  - Email subject
  - Email body
  - WhatsApp message
  - SMS message
- Express API backend
- React frontend with Vite

## Sending Without Paid Providers

This app does not send WhatsApp or SMS directly from the backend. Instead, it opens the recruiter's installed apps with the generated message prefilled:

- Email uses a `mailto:` link.
- WhatsApp uses a `wa.me` link.
- SMS uses an `sms:` link.

The recruiter reviews the message and sends it manually. This avoids the need for Twilio, WhatsApp Business API, MSG91, Gupshup, or similar providers.

Note: browser `mailto:` links cannot attach files automatically. If a JD file is uploaded, the app saves it locally and shows the attached filename. The recruiter should attach that file manually in the email app before sending.

## Interview Scheduling

When `Current Stage` is `Interview Scheduled`, the form captures:

- Interview mode: Phone, HR Interview, Teams, or Face to Face
- Interview date
- Start time
- End time
- Teams meeting link for Teams interviews
- Interview address for Face to Face interviews

Generated content changes depending on the selected interview mode.

For Teams interviews, the recruiter should create or copy the Teams meeting link first and paste it into the portal. The app can open that Teams link, but it does not create a Teams meeting automatically.

For scheduled interviews, the app also provides a calendar `.ics` download.

## Stored Data and Report Download

Every successful generation is saved locally in:

```text
data/recruitmentEntries.json
```

Uploaded JD files are saved locally in:

```text
data/attachments
```

Use the `Download Report` button in the app to download a CSV report of all saved recruitment entries.

The report is also available from:

```text
http://localhost:5000/api/recruitment/report
```

## Requirements

- Node.js 18 or newer
- npm

## Install

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The React frontend runs on port `5173`.
The Express backend runs on port `5000`.

## Login

The app requires login before recruiters can generate messages, schedule interviews, or download reports.

Default local credentials:

```text
Username: coordinator
Password: ChangeMe@123
```

Change these before sharing the app by setting environment variables:

```bash
HR_PORTAL_USER=coordinator
HR_PORTAL_PASSWORD=your-secure-password
npm run dev
```

On Windows PowerShell:

```powershell
$env:HR_PORTAL_USER="coordinator"
$env:HR_PORTAL_PASSWORD="your-secure-password"
npm run dev
```

## Run Backend Only

```bash
npm run server
```

## Run Frontend Only

```bash
npm run client
```

## Build Frontend

```bash
npm run build
```

## Deploy to Render for a Permanent Link

This project includes `render.yaml` for Render deployment.

Steps:

1. Push this folder to a GitHub repository.
2. Create or login to a Render account.
3. In Render, choose `New` > `Blueprint`.
4. Connect the GitHub repository.
5. Render will detect `render.yaml`.
6. Set the environment variable:

```text
HR_PORTAL_PASSWORD=your-secure-password
```

7. Deploy the service.

After deployment, Render will provide a permanent HTTPS URL similar to:

```text
https://hr-ai-portal.onrender.com
```

Share that URL with the coordinator team along with the login username and password.

Production notes:

- The app serves both React and Express from one Render web service.
- Login is required before using the portal.
- Render free services may sleep after inactivity.
- Saved reports and uploaded JD files are currently stored on the server filesystem. For long-term production use, connect persistent storage or a database so records survive service rebuilds/redeploys.

## API

### POST `/api/recruitment/generate`

Request body:

```json
{
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "candidatePhone": "+91 98765 43210",
  "position": "HR Manager",
  "currentStage": "Interview Scheduled",
  "interviewMode": "Teams",
  "interviewDate": "2026-07-10",
  "interviewStartTime": "10:00",
  "interviewEndTime": "10:30",
  "teamsMeetingLink": "https://teams.microsoft.com/l/meetup-join/...",
  "interviewAddress": "",
  "recruiterName": "Amandeep",
  "jobDescription": "Role summary, responsibilities, skills, location, or JD link.",
  "jobDescriptionAttachment": {
    "name": "hr-manager-jd.pdf",
    "type": "application/pdf",
    "size": 245000,
    "dataUrl": "data:application/pdf;base64,..."
  },
  "companyProfile": "Translab Technologies is a global technology consulting and digital transformation company...",
  "additionalNotes": "Please bring updated documents."
}
```

### GET `/api/recruitment/report`

Downloads a CSV report containing all saved recruitment entries and generated messages.

Response:

```json
{
  "emailSubject": "Interview Scheduled for HR Manager",
  "emailBody": "...",
  "candidatePhone": "+91 98765 43210",
  "jobDescriptionAttachment": {
    "originalName": "hr-manager-jd.pdf",
    "storedFileName": "...",
    "mimeType": "application/pdf",
    "size": 245000
  },
  "whatsappMessage": "...",
  "smsMessage": "..."
}
```
