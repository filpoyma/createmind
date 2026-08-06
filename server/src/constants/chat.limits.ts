export const MAX_PROJECTS_PER_USER = 3;

export class ProjectLimitReachedError extends Error {
	readonly code = 'PROJECT_LIMIT_REACHED' as const;

	constructor() {
		super('Достигнут лимит: не более 3 проектов на одного пользователя');
		this.name = 'ProjectLimitReachedError';
	}
}
