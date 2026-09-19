import { createFileRoute } from "@tanstack/react-router";
import { InboxList } from "@/components/os/inbox";

export const Route = createFileRoute("/messages/")({ component: MessagesIndex });

function MessagesIndex() {
  return <InboxList />;
}
