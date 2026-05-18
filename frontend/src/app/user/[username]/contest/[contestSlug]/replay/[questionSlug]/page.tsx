import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/server-url";
import ReplayPlayer from "@/components/replay-player";

interface ReplayEvent {
  eventType: string;
  eventData: string;
  timestamp: number;
}

interface ReplayResponse {
  success: boolean;
  data?: {
    events: ReplayEvent[];
    finalCode: string;
    totalEvents: number;
  };
  error?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; contestSlug: string; questionSlug: string }>;
}): Promise<Metadata> {
  const { username, questionSlug } = await params;
  const decodedUsername = decodeURIComponent(username);
  const decodedQuestion = decodeURIComponent(questionSlug);
  return {
    title: `${decodedQuestion} replay`,
    description: `Keystroke replay for ${decodedUsername} on ${decodedQuestion}. Analyze coding speed and LeetCode cheating signals.`,
    keywords: [
      "leetcode cheating",
      "leetcode cheat detector",
      "keystroke replay",
      decodedQuestion,
      decodedUsername,
    ],
  };
}

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ username: string; contestSlug: string; questionSlug: string }>;
}) {
  const { username, contestSlug, questionSlug } = await params;
  const decodedUsername = decodeURIComponent(username);
  const decodedContest = decodeURIComponent(contestSlug);
  const decodedQuestion = decodeURIComponent(questionSlug);

  const baseUrl = await getBaseUrl();
  const res = await fetch(
    `${baseUrl}/api/replay/${decodedContest}/${decodedQuestion}/${decodedUsername}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const payload = (await res.json()) as ReplayResponse;

  if (!payload.success || !payload.data) {
    notFound();
  }

  return (
    <ReplayPlayer
      username={decodedUsername}
      contestSlug={decodedContest}
      questionSlug={decodedQuestion}
      replay={payload.data}
    />
  );
}
