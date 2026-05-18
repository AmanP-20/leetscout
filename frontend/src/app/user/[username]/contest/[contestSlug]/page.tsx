import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/server-url";
import ContestClient from "@/components/contest-client";

interface ContestProblem {
  title: string;
  titleSlug: string;
  credit: number;
}

interface ContestDetailResponse {
  success: boolean;
  data?: {
    title: string;
    titleSlug: string;
    startTime: number;
    duration: number;
    questions: ContestProblem[];
  };
  error?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; contestSlug: string }>;
}): Promise<Metadata> {
  const { username, contestSlug } = await params;
  const decodedUsername = decodeURIComponent(username);
  const decodedContest = decodeURIComponent(contestSlug);
  return {
    title: `${decodedContest} — ${decodedUsername}`,
    description: `Contest problems and keystroke replay for ${decodedUsername} in ${decodedContest}. Analyze LeetCode cheating patterns.`,
    keywords: ["leetcode cheat detector", "leetcode cheating", "contest replay", decodedContest, decodedUsername],
  };
}

export default async function ContestPage({
  params,
}: {
  params: Promise<{ username: string; contestSlug: string }>;
}) {
  const { username, contestSlug } = await params;
  const decodedUsername = decodeURIComponent(username);
  const decodedContest = decodeURIComponent(contestSlug);

  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/contests/${decodedContest}/problems`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();

  const payload = (await res.json()) as ContestDetailResponse;
  if (!payload.success || !payload.data) notFound();

  return (
    <ContestClient
      username={decodedUsername}
      contest={payload.data}
    />
  );
}
