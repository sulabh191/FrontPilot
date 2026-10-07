import { ConversationsTable, getConversations } from "@/features/conversations";
import { PageHeader } from "@/shared/components/page-header";

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Every chat your agent has had, with anything that needs you at the top."
      />
      <ConversationsTable conversations={conversations} />
    </>
  );
}
