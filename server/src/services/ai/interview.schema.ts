export const interviewResponseSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' },
		message_type: {
			type: 'string',
			enum: ['question', 'confirmation', 'clarification', 'closing'],
		},
		stage: {
			type: 'string',
			enum: ['discovery', 'confirmation', 'contact', 'completed'],
		},
		task_summary: { type: ['string', 'null'] },
		expected_result: { type: ['string', 'null'] },
		understanding_confirmed: { type: 'boolean' },
		contact: { type: ['string', 'null'] },
		lead_complete: { type: 'boolean' },
		brief_updates: {
			type: 'object',
			properties: {
				project_type: { type: ['string', 'null'] },
			},
			required: ['project_type'],
			additionalProperties: false,
		},
	},
	required: [
		'message',
		'message_type',
		'stage',
		'task_summary',
		'expected_result',
		'understanding_confirmed',
		'contact',
		'lead_complete',
		'brief_updates',
	],
	additionalProperties: false,
} as const;
