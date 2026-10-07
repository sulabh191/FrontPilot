import { Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { AgentSettingsModule } from "../agent-settings/agent-settings.module";
import { ConversationsModule } from "../conversations/conversations.module";
import { TenantsModule } from "../tenants/tenants.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  imports: [AgentModule, AgentSettingsModule, ConversationsModule, TenantsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
