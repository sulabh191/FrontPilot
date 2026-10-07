import { Body, Controller, Get, HttpCode, Logger, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiProduces, ApiTags, ApiTooManyRequestsResponse } from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Response } from "express";
import { Public } from "../../common/auth/public.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  chatRequestSchema,
  widgetConfigSchema,
  widgetSlugParamSchema,
  type ChatEvent,
  type ChatRequest,
} from "./chat.schemas";
import { ChatService } from "./chat.service";

// Public endpoints used by the chat widget on a business's website.
// No login: the business is identified by its slug. Rate-limited per visitor.
@ApiTags("chat (public)")
@Public()
@UseGuards(ThrottlerGuard)
@Controller("v1")
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chat: ChatService) {}

  @Get("widget/:slug")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: "Public widget settings for a business (name, greeting, starter questions)" })
  @ApiOkResponse({ schema: openApiSchema(widgetConfigSchema, "output") })
  widget(@Param("slug", new ZodValidationPipe(widgetSlugParamSchema)) slug: string) {
    return this.chat.widgetConfig(slug);
  }

  @Post("chat")
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // 20 messages per minute per visitor
  @ApiOperation({
    summary: "Send a customer message; the reply streams back as NDJSON events",
    description:
      'One JSON object per line: {"type":"conversation"} first, then {"type":"text"} chunks, optionally {"type":"suggestions"}, or {"type":"error"}.',
  })
  @ApiBody({
    schema: openApiSchema(chatRequestSchema),
    examples: { start: { value: { tenantSlug: "rapid-plumbing", message: "Do you work weekends?" } } },
  })
  @ApiProduces("application/x-ndjson")
  @ApiTooManyRequestsResponse({ description: "Too many messages; slow down" })
  async send(@Body(new ZodValidationPipe(chatRequestSchema)) body: ChatRequest, @Res() res: Response) {
    // 1. Validation, tenant and conversation checks: normal HTTP errors if anything is wrong.
    const turn = await this.chat.prepareTurn(body);

    // 2. From here on we stream. The status (200) is sent now, so later problems become an "error" event.
    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Accel-Buffering", "no"); // tell proxies not to buffer the stream
    res.flushHeaders();

    const send = (event: ChatEvent) => res.write(JSON.stringify(event) + "\n");
    send({ type: "conversation", conversationId: turn.conversationId });

    // 3. Visitor closed the chat → stop generating (and stop paying for tokens).
    const abort = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) abort.abort();
    });

    try {
      await this.chat.reply(turn, send, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) {
        this.logger.error(`Chat failed for conversation ${turn.conversationId}`, error as Error);
        send({ type: "error", message: "The assistant is unavailable right now." });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}
