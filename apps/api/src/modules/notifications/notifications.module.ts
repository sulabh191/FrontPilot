import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../config/env.schema";
import { NotificationsService } from "./notifications.service";
import { ConsoleSmsProvider } from "./providers/console-sms.provider";
import { TwilioSmsProvider } from "./providers/twilio-sms.provider";
import { SMS_PROVIDER } from "./sms-provider";

@Module({
  providers: [
    NotificationsService,
    {
      // Configuration decides the implementation, once, at startup.
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.get("SMS_PROVIDER", { infer: true }) === "twilio"
          ? new TwilioSmsProvider({
              accountSid: config.get("TWILIO_ACCOUNT_SID", { infer: true })!,
              authToken: config.get("TWILIO_AUTH_TOKEN", { infer: true })!,
              fromNumber: config.get("TWILIO_FROM_NUMBER", { infer: true })!,
            })
          : new ConsoleSmsProvider(),
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
