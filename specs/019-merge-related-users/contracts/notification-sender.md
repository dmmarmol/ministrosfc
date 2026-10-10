# Contract - Notification Sender (Spec 019)

Purpose: Define the notification abstraction consumed by pending-approval workflows, without coupling to an email provider implementation.

## TypeScript Interface

```ts
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
```

## Behavioral Guarantees

- `send`, `sendCC`, and `sendCCO` may throw and are intended for explicit error handling call sites.
- `sendSafe` must never throw to caller; it catches internal failures and logs a warning.
- Approval and denial persistence must not be blocked by notification failures (`sendSafe` expected in approval-flow orchestration).

## Extensibility Rules

- Future template-based methods must be additive and non-breaking.
- Current method signatures are stable for spec 019 consumers.
- Concrete providers (SMTP, SES, API-based) are out of scope for this feature.
