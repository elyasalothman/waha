import { createFileRoute } from "@tanstack/react-router";
import { InboxThread } from "@/components/os/inbox";

export const Route = createFileRoute("/messages/$threadId")({ component: ThreadPage });

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <InboxThread threadId={threadId} />;
}
