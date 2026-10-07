import { ServiceUnavailableException, type Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../../../config/env.schema";
import { LLM_CLIENT, LLM_MODEL } from "./llm.constants";

export const llmProviders: Provider[] = [
  {
    provide: LLM_CLIENT,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) => {
      const apiKey = config.get("ANTHROPIC_API_KEY", { infer: true });
      if (!apiKey) {
        // Start the API anyway; only agent calls fail, with a clear message.
        return new Proxy({} as Anthropic, {
          get() {
            throw new ServiceUnavailableException("The AI assistant is not configured (ANTHROPIC_API_KEY missing)");
          },
        });
      }
      return new Anthropic({ apiKey });
    },
  },
  {
    provide: LLM_MODEL,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) => config.get("ANTHROPIC_MODEL", { infer: true }),
  },
];
