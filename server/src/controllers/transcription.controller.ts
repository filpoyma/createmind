import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/status.constants';
import { groqConfig, isGroqConfigured } from '../config/groq';

interface ITranscriptionBody {
	language?: string;
	prompt?: string;
}

interface IRequestWithAudioFile extends Request {
	file?: Express.Multer.File;
	body: ITranscriptionBody;
}

interface ITranscriptionSuccessResponse {
	text?: string;
}

interface ITranscriptionErrorResponse {
	error?: {
		message?: string;
	};
}

const SUPPORTED_MIME_TYPES = new Set([
	'audio/flac',
	'audio/mpeg',
	'audio/mp3',
	'audio/mp4',
	'audio/mpga',
	'audio/ogg',
	'audio/wav',
	'audio/webm',
	'audio/x-m4a',
	'audio/x-wav',
	'video/mp4',
]);

export const transcribeAudio = asyncHandler(
	async (req: IRequestWithAudioFile, res: Response): Promise<void> => {
		if (!isGroqConfigured) {
			res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
				success: false,
				message: 'Сервис транскрибации не настроен',
			});
			return;
		}

		const audioFile = req.file;
		const { language, prompt } = req.body;

		if (!audioFile) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Аудиофайл обязателен (поле audio)',
			});
			return;
		}

		if (!SUPPORTED_MIME_TYPES.has(audioFile.mimetype)) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Неподдерживаемый формат аудио',
			});
			return;
		}

		const formData = new FormData();
		const fileBlob = new Blob([audioFile.buffer], { type: audioFile.mimetype });

		formData.append('file', fileBlob, audioFile.originalname);
		formData.append('model', groqConfig.transcriptionModel);
		formData.append('response_format', 'json');
		formData.append('temperature', '0');

		if (language) {
			formData.append('language', language);
		}

		if (prompt) {
			formData.append('prompt', prompt);
		}

		const groqResponse = await fetch(`${groqConfig.baseUrl}/audio/transcriptions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${groqConfig.apiKey}`,
			},
			body: formData,
		});

		if (!groqResponse.ok) {
			let errorPayload: ITranscriptionErrorResponse | null;
			try {
				errorPayload = (await groqResponse.json()) as ITranscriptionErrorResponse;
			} catch {
				errorPayload = null;
			}

			res.status(HTTP_STATUS.BAD_GATEWAY).json({
				success: false,
				message: errorPayload?.error?.message || 'Ошибка при обращении к сервису транскрибации',
			});
			return;
		}

		const transcription = (await groqResponse.json()) as ITranscriptionSuccessResponse;

		if (!transcription.text) {
			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: 'Сервис транскрибации вернул пустой ответ',
			});
			return;
		}

		res.status(HTTP_STATUS.OK).json({
			success: true,
			data: {
				text: transcription.text,
			},
		});
	},
);
