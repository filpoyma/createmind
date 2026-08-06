const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM ?? 'CreateMind <onboarding@resend.dev>';
const resendSpecTo = process.env.RESEND_SPEC_TO ?? 'request@createmind.org';

export const resendConfig = {
	apiKey: resendApiKey ?? '',
	from: resendFrom,
	specTo: resendSpecTo,
} as const;

export const isResendConfigured = Boolean(resendApiKey);
