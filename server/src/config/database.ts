import mongoose from 'mongoose';
import logger from './logger';
import { isProduction } from '../constants/system.constants';

const resolveMongoUri = (): string => {
  if (!isProduction) {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    return mongoUri;
  }

  const { DB_USER, DB_PASSWORD, DB_AUTH_SOURSE } = process.env;

  if (!DB_USER || !DB_PASSWORD || !DB_AUTH_SOURSE) {
    throw new Error('DB_USER, DB_PASSWORD and DB_AUTH_SOURSE must be defined in production');
  }

  return `mongodb://${DB_USER}:${DB_PASSWORD}@127.0.0.1:27017/createmind?authSource=${DB_AUTH_SOURSE}`;
};

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = resolveMongoUri();

    await mongoose.connect(mongoUri);

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDatabase;
