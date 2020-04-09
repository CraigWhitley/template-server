import './env';
import winston from 'winston';
import { MongoDB, MongoDBTransportInstance } from 'winston-mongodb';

const MONGO_URI = process.env.MONGO_URI;

export class Logging {
  transporter: MongoDBTransportInstance;
  logger: winston.Logger;
  logLevel: string = 'info';

  constructor() {
    if (MONGO_URI) {
      // Wire up winston logging
      this.transporter = new MongoDB({
        db: MONGO_URI,
        level: this.logLevel,
        metaKey: 'meta',
        options: {
          useUnifiedTopology: true,
          useNewUrlParser: true,
        },
      });

      winston.add(this.transporter);

      this.logger = winston.createLogger({
        level: this.logLevel,
        format: winston.format.json(),
        transports: [this.transporter],
      });

      if (process.env.NODE_ENV !== 'production') {
        this.logger.add(
          new winston.transports.Console({
            format: winston.format.simple(),
          })
        );
      }
    }
  }
}
