import { ConversationsTable, getConversations } from "@/features/conversations";
import { PageHeader } from "@/shared/components/page-header";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function ConversationsPage() {
  const tenant = await getCurrentTenant();
  const conversations = await getConversations(tenant.id);

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
