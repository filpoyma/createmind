import express, { Express } from 'express';
import cors from 'cors';

import routes from './src/routes';
import requestLogger from './src/middleware/requestLogger';
import errorHandler from './src/middleware/errors/errorHandler';
import notFoundErrorHandler from './src/middleware/errors/notFoundErrorHandler';
import helmetMiddleware from './src/middleware/security/helmetSecurity';
import { generalRateLimiter } from './src/middleware/security/rateLimiter';
import mongoSanitizeMiddleware from './src/middleware/security/mongoSanitize';
import requestId from './src/middleware/security/requestId';
import compressionMiddleware from './src/middleware/compression';
import corsOptions from './src/config/cors';

const app: Express = express();

helmetMiddleware(app);
compressionMiddleware(app);
app.use(requestId);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
mongoSanitizeMiddleware(app);
app.use(generalRateLimiter);
app.use(requestLogger);

app.use('/api', routes);

app.use(notFoundErrorHandler);
app.use(errorHandler);

export default app;
