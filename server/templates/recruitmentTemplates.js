export const recruitmentStages = [
  'Resume Shortlisted',
  'Interview Scheduled',
  'HR Interview',
  'Next Round Selected',
  'Offer Under Approval',
  'Documents Required',
  'Rejected'
];

const formatDate = (dateValue) => {
  if (!dateValue) return '';

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const optionalNotes = (notes) => {
  if (!notes?.trim()) return '';
  return `\n\nAdditional notes:\n${notes.trim()}`;
};

const formatTime = (timeValue) => {
  if (!timeValue) return '';

  const [hoursValue, minutesValue] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hoursValue), Number(minutesValue), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return timeValue;
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const interviewDetails = ({
  interviewMode,
  interviewDate,
  interviewStartTime,
  interviewEndTime,
  teamsMeetingLink,
  interviewAddress,
  candidatePhone
}) => {
  const dateText = formatDate(interviewDate);
  const startText = formatTime(interviewStartTime);
  const endText = formatTime(interviewEndTime);
  const timeText = startText && endText ? `${startText} to ${endText}` : startText || endText;
  const scheduleText = [dateText, timeText].filter(Boolean).join(', ');

  if (interviewMode === 'Teams') {
    return {
      scheduleText,
      emailLine:
        `Your Microsoft Teams interview is scheduled${scheduleText ? ` for ${scheduleText}` : ''}.\n\n` +
        `Teams meeting link:\n${teamsMeetingLink.trim()}\n\n` +
        `Please join the meeting a few minutes before the scheduled time.`,
      shortLine:
        `Teams interview${scheduleText ? ` on ${scheduleText}` : ''}. Link: ${teamsMeetingLink.trim()}`
    };
  }

  if (interviewMode === 'Face to Face') {
    return {
      scheduleText,
      emailLine:
        `Your face-to-face interview is scheduled${scheduleText ? ` for ${scheduleText}` : ''}.\n\n` +
        `Interview address:\n${interviewAddress.trim()}\n\n` +
        `Please reach the venue a few minutes before the scheduled time.`,
      shortLine:
        `Face-to-face interview${scheduleText ? ` on ${scheduleText}` : ''}. Address: ${interviewAddress.trim()}`
    };
  }

  if (interviewMode === 'HR Interview') {
    return {
      scheduleText,
      emailLine:
        `Your HR interview is scheduled${scheduleText ? ` for ${scheduleText}` : ''}.\n\n` +
        `The HR team will discuss your profile, role expectations, compensation details, availability, and next steps.`,
      shortLine:
        `HR interview${scheduleText ? ` on ${scheduleText}` : ''}`
    };
  }

  return {
    scheduleText,
    emailLine:
      `Your phone interview is scheduled${scheduleText ? ` for ${scheduleText}` : ''}.\n\n` +
      `Our recruitment team will contact you on ${candidatePhone}. Please keep your phone available at the scheduled time.`,
    shortLine:
      `Phone interview${scheduleText ? ` on ${scheduleText}` : ''}. We will call you on ${candidatePhone}`
  };
};

const signOff = (recruiterName) => `\n\nRegards,\n${recruiterName.trim()}\nRecruitment Team`;

const jdAndCompanyDetails = (jobDescription, companyProfile) =>
  `\n\nJob Description:\n${jobDescription.trim()}\n\nCompany Profile:\n${companyProfile.trim()}`;

const templates = {
  'Resume Shortlisted': ({
    candidateName,
    candidatePhone,
    position,
    recruiterName,
    jobDescription,
    companyProfile,
    additionalNotes
  }) => ({
    candidatePhone,
    emailSubject: `Resume Shortlisted for ${position}`,
    emailBody:
      `Dear ${candidateName},\n\n` +
      `Thank you for applying for the ${position} position. We are pleased to inform you that your resume has been shortlisted for the next step in our recruitment process.\n\n` +
      `Please review the job description and company profile below before the next step.` +
      jdAndCompanyDetails(jobDescription, companyProfile) +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
      `Hi ${candidateName}, your resume has been shortlisted for ${position}. We will contact you shortly with the next steps. - ${recruiterName}`,
    smsMessage:
      `Hi ${candidateName}, your resume is shortlisted for ${position}. We will contact you soon. - ${recruiterName}`
  }),

  'Interview Scheduled': ({
    candidateName,
    candidatePhone,
    position,
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
  }) => {
    const details = interviewDetails({
      interviewMode,
      interviewDate,
      interviewStartTime,
      interviewEndTime,
      teamsMeetingLink,
      interviewAddress,
      candidatePhone
    });

    return {
      candidatePhone,
      emailSubject: `Interview Scheduled for ${position}`,
      emailBody:
        `Dear ${candidateName},\n\n` +
        `We are pleased to invite you for an interview for the ${position} position.\n\n` +
        `${details.emailLine}\n\n` +
        `Please review the job description and company profile before the interview.` +
        jdAndCompanyDetails(jobDescription, companyProfile) +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
        `Hi ${candidateName}, your ${details.shortLine} for ${position}. Please confirm your availability. - ${recruiterName}`,
      smsMessage:
        `${details.shortLine} for ${position}. Please confirm availability. - ${recruiterName}`
    };
  },

  'Next Round Selected': ({
    candidateName,
    candidatePhone,
    position,
    recruiterName,
    jobDescription,
    companyProfile,
    additionalNotes
  }) => ({
    candidatePhone,
    emailSubject: `Selected for Next Round - ${position}`,
    emailBody:
      `Dear ${candidateName},\n\n` +
      `Congratulations. You have been selected for the next round of the recruitment process for the ${position} position.\n\n` +
      `Please keep the job description and company profile handy for the next discussion.` +
      jdAndCompanyDetails(jobDescription, companyProfile) +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
      `Hi ${candidateName}, congratulations. You are selected for the next round for ${position}. Details will be shared shortly. - ${recruiterName}`,
    smsMessage:
      `Congratulations ${candidateName}. You are selected for the next round for ${position}. - ${recruiterName}`
  }),

  'Offer Under Approval': ({
    candidateName,
    candidatePhone,
    position,
    recruiterName,
    jobDescription,
    companyProfile,
    additionalNotes
  }) => ({
    candidatePhone,
    emailSubject: `Offer Update for ${position}`,
    emailBody:
      `Dear ${candidateName},\n\n` +
      `Thank you for your continued interest in the ${position} position.\n\n` +
      `We are happy to inform you that your offer is currently under internal approval. We will update you as soon as the approval process is completed.\n\n` +
      `For your reference, the job description and company profile are included below.` +
      jdAndCompanyDetails(jobDescription, companyProfile) +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
      `Hi ${candidateName}, your offer for ${position} is currently under internal approval. We will update you soon. - ${recruiterName}`,
    smsMessage:
      `Your offer for ${position} is under approval. We will update you soon. - ${recruiterName}`
  }),

  'Documents Required': ({
    candidateName,
    candidatePhone,
    position,
    recruiterName,
    jobDescription,
    companyProfile,
    additionalNotes
  }) => ({
    candidatePhone,
    emailSubject: `Documents Required for ${position}`,
    emailBody:
      `Dear ${candidateName},\n\n` +
      `As part of the recruitment process for the ${position} position, we request you to share the required documents for verification.\n\n` +
      `Please send the documents at your earliest convenience so we can proceed with the next steps.\n\n` +
      `The job description and company profile are included below for your reference.` +
      jdAndCompanyDetails(jobDescription, companyProfile) +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
      `Hi ${candidateName}, please share the required documents for the ${position} recruitment process at your earliest convenience. - ${recruiterName}`,
    smsMessage:
      `Please share required documents for ${position} recruitment process. - ${recruiterName}`
  }),

  Rejected: ({ candidateName, candidatePhone, position, recruiterName, additionalNotes }) => ({
    candidatePhone,
    emailSubject: `Application Update for ${position}`,
    emailBody:
      `Dear ${candidateName},\n\n` +
      `Thank you for your interest in the ${position} position and for the time you invested in our recruitment process.\n\n` +
      `After careful consideration, we regret to inform you that we will not be moving forward with your application for this role at this time. We appreciate your interest and wish you the best in your career search.` +
      optionalNotes(additionalNotes) +
      signOff(recruiterName),
    whatsappMessage:
      `Hi ${candidateName}, thank you for your interest in ${position}. We regret that we will not move forward at this time. Best wishes. - ${recruiterName}`,
    smsMessage:
      `Application update for ${position}: we will not move forward at this time. Best wishes. - ${recruiterName}`
  })
};

export const generateRecruitmentMessages = (formData) => {
  if (formData.currentStage === 'HR Interview') {
    const template = templates['Interview Scheduled'];
    return {
      ...template({
        ...formData,
        interviewMode: formData.interviewMode || 'HR Interview'
      }),
      emailSubject: `HR Interview Scheduled for ${formData.position}`
    };
  }

  const template = templates[formData.currentStage];
  return template(formData);
};
