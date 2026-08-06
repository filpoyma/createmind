export function getApiUrl(): string {
	const configured = import.meta.env.PUBLIC_API_URL;
	if (configured) return configured.replace(/\/$/, '');
	return 'http://localhost:5000/api';
}
