import type {
  NotificationRecipient,
  NotificationSender,
  NotificationSenderFactory,
} from "@ministrosfc/shared";
import { logger } from "../utils/logger";

export class NoOpNotificationSender implements NotificationSender {
  constructor(private readonly recipient: NotificationRecipient) {}

  async send(message: string, data: Record<string, string>): Promise<void> {
    logger.info(
      {
        recipient: this.recipient,
        message,
        data,
      },
      "NoOp notification send",
    );
  }

  async sendCC(message: string, data: Record<string, string>): Promise<void> {
    logger.info(
      {
        recipient: this.recipient,
        message,
        data,
      },
      "NoOp notification sendCC",
    );
  }

  async sendCCO(message: string, data: Record<string, string>): Promise<void> {
    logger.info(
      {
        recipient: this.recipient,
        message,
        data,
      },
      "NoOp notification sendCCO",
    );
  }

  async sendSafe(message: string, data: Record<string, string>): Promise<void> {
    try {
      await this.send(message, data);
    } catch (error) {
      logger.warn(
        {
          error,
          recipient: this.recipient,
          message,
          data,
        },
        "Notification sendSafe swallowed error",
      );
    }
  }
}

export const noOpNotificationSenderFactory: NotificationSenderFactory = {
  create(recipient: NotificationRecipient): NotificationSender {
    return new NoOpNotificationSender(recipient);
  },
};
