export type NotificationRecipient = {
  to: string | string[];
};

export interface NotificationSender {
  send(message: string, data: Record<string, string>): Promise<void>;
  sendCC(message: string, data: Record<string, string>): Promise<void>;
  sendCCO(message: string, data: Record<string, string>): Promise<void>;
  sendSafe(message: string, data: Record<string, string>): Promise<void>;
}

export interface NotificationSenderFactory {
  create(recipient: NotificationRecipient): NotificationSender;
}
