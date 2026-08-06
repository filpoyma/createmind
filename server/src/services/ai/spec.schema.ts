export const specResponseSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		summary: { type: 'string' },
		goals: {
			type: 'array',
			items: { type: 'string' },
		},
		scope: {
			type: 'array',
			items: { type: 'string' },
		},
		deliverables: {
			type: 'array',
			items: { type: 'string' },
		},
		open_questions: {
			type: 'array',
			items: { type: 'string' },
		},
		contact: { type: 'string' },
	},
	required: ['title', 'summary', 'goals', 'scope', 'deliverables', 'open_questions', 'contact'],
	additionalProperties: false,
} as const;
