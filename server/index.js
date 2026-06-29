import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { generateRecruitmentMessages, recruitmentStages } from './templates/recruitmentTemplates.js';

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, '..', 'data');
const attachmentsDirectory = path.join(dataDirectory, 'attachments');
const entriesFile = path.join(dataDirectory, 'recruitmentEntries.json');
let saveQueue = Promise.resolve();
const sessions = new Map();
const authUser = process.env.HR_PORTAL_USER || 'coordinator';
const authPassword = process.env.HR_PORTAL_PASSWORD || 'ChangeMe@123';
const interviewStages = ['Interview Scheduled', 'HR Interview'];

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ensureDataFile = async () => {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.mkdir(attachmentsDirectory, { recursive: true });

  try {
    await fs.access(entriesFile);
  } catch {
    await fs.writeFile(entriesFile, '[]', 'utf8');
  }
};

const sanitizeFileName = (fileName) =>
  fileName
    .replace(/[^a-zA-Z0-9.\-_ ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 120);

const saveAttachment = async (attachment, entryId) => {
  if (!attachment?.dataUrl || !attachment?.name) return null;

  await ensureDataFile();

  const match = attachment.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid attachment format.');
  }

  const [, mimeType, base64Content] = match;
  const buffer = Buffer.from(base64Content, 'base64');
  const maxSizeInBytes = 5 * 1024 * 1024;

  if (buffer.length > maxSizeInBytes) {
    throw new Error('Job description attachment must be 5 MB or smaller.');
  }

  const safeName = sanitizeFileName(attachment.name);
  const storedFileName = `${entryId}-${safeName}`;
  const storedPath = path.join(attachmentsDirectory, storedFileName);

  await fs.writeFile(storedPath, buffer);

  return {
    originalName: attachment.name,
    storedFileName,
    mimeType,
    size: buffer.length
  };
};

const readEntries = async () => {
  await ensureDataFile();
  const fileContent = await fs.readFile(entriesFile, 'utf8');
  return JSON.parse(fileContent);
};

const saveEntry = async (entry) => {
  const writeOperation = saveQueue.then(async () => {
    const entries = await readEntries();
    entries.push(entry);
    await fs.writeFile(entriesFile, JSON.stringify(entries, null, 2), 'utf8');
    return entry;
  });

  saveQueue = writeOperation.catch(() => {});
  return writeOperation;
};

const csvEscape = (value) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const entriesToCsv = (entries) => {
  const headers = [
    'Created At',
    'Candidate Name',
    'Candidate Email',
    'Candidate Mobile Number',
    'Position',
    'Current Stage',
    'Interview Mode',
    'Interview Date',
    'Interview Start Time',
    'Interview End Time',
    'Teams Meeting Link',
    'Interview Address',
    'Recruiter Name',
    'Job Description',
    'Job Description Attachment',
    'Company Profile',
    'Additional Notes',
    'Email Subject',
    'Email Body',
    'WhatsApp Message',
    'SMS Message'
  ];

  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.candidateName,
    entry.candidateEmail,
    entry.candidatePhone,
    entry.position,
    entry.currentStage,
    entry.interviewMode,
    entry.interviewDate,
    entry.interviewStartTime,
    entry.interviewEndTime,
    entry.teamsMeetingLink,
    entry.interviewAddress,
    entry.recruiterName,
    entry.jobDescription,
    entry.jobDescriptionAttachment?.originalName || '',
    entry.companyProfile,
    entry.additionalNotes,
    entry.emailSubject,
    entry.emailBody,
    entry.whatsappMessage,
    entry.smsMessage
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'hr-ai-portal' });
});

const requireAuth = (req, res, next) => {
  const authHeader = req.get('authorization') || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const token = headerToken || req.query.token;

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Please login to continue.' });
  }

  next();
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === authUser && password === authPassword) {
    const token = randomUUID();
    sessions.set(token, {
      username,
      createdAt: new Date().toISOString()
    });

    return res.json({ token, username });
  }

  res.status(401).json({ message: 'Invalid username or password.' });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  sessions.delete(token);
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/recruitment/report', requireAuth, async (req, res) => {
  try {
    const entries = await readEntries();
    const csv = entriesToCsv(entries);
    const dateStamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="recruitment-report-${dateStamp}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Report download failed:', error);
    res.status(500).json({ message: 'Unable to download recruitment report.' });
  }
});

app.post('/api/recruitment/generate', requireAuth, async (req, res) => {
  const {
    candidateName,
    candidateEmail,
    candidatePhone,
    position,
    currentStage,
    interviewMode,
    interviewDate,
    interviewStartTime,
    interviewEndTime,
    teamsMeetingLink,
    interviewAddress,
    recruiterName,
    jobDescription,
    companyProfile,
    jobDescriptionAttachment,
    additionalNotes
  } = req.body;

  const missingFields = [];

  if (!candidateName?.trim()) missingFields.push('Candidate Name');
  if (!candidateEmail?.trim()) missingFields.push('Candidate Email');
  if (!candidatePhone?.trim()) missingFields.push('Candidate Mobile Number');
  if (!position?.trim()) missingFields.push('Position');
  if (!currentStage?.trim()) missingFields.push('Current Stage');
  if (!recruiterName?.trim()) missingFields.push('Recruiter Name');
  if (!jobDescription?.trim()) missingFields.push('Job Description');
  if (!companyProfile?.trim()) missingFields.push('Company Profile');

  if (interviewStages.includes(currentStage)) {
    if (!interviewMode?.trim()) missingFields.push('Interview Mode');
    if (!interviewDate?.trim()) missingFields.push('Interview Date');
    if (!interviewStartTime?.trim()) missingFields.push('Interview Start Time');
    if (!interviewEndTime?.trim()) missingFields.push('Interview End Time');
    if (interviewMode === 'Teams' && !teamsMeetingLink?.trim()) {
      missingFields.push('Teams Meeting Link');
    }
    if (interviewMode === 'Face to Face' && !interviewAddress?.trim()) {
      missingFields.push('Interview Address');
    }
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Please complete all required fields.',
      missingFields
    });
  }

  if (
    interviewStages.includes(currentStage) &&
    interviewStartTime &&
    interviewEndTime &&
    interviewEndTime <= interviewStartTime
  ) {
    return res.status(400).json({
      message: 'Interview end time must be later than start time.'
    });
  }

  if (!recruitmentStages.includes(currentStage)) {
    return res.status(400).json({
      message: 'Invalid current stage selected.'
    });
  }

  const entryData = {
    candidateName,
    candidateEmail,
    candidatePhone,
    position,
    currentStage,
    interviewMode,
    interviewDate,
    interviewStartTime,
    interviewEndTime,
    teamsMeetingLink,
    interviewAddress,
    recruiterName,
    jobDescription,
    companyProfile,
    additionalNotes
  };

  const messages = generateRecruitmentMessages(entryData);

  try {
    const entryId = randomUUID();
    const savedAttachment = await saveAttachment(jobDescriptionAttachment, entryId);
    const savedEntry = await saveEntry({
      id: entryId,
      createdAt: new Date().toISOString(),
      ...entryData,
      jobDescriptionAttachment: savedAttachment,
      ...messages
    });

    res.json({
      ...messages,
      jobDescriptionAttachment: savedAttachment,
      savedEntryId: savedEntry.id
    });
  } catch (error) {
    console.error('Recruitment entry save failed:', error);
    res.status(500).json({ message: error.message || 'Generated message could not be saved.' });
  }
});

const clientBuildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`HR AI Portal API running on http://localhost:${port}`);
});
