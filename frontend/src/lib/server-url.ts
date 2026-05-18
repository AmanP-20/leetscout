import { headers } from "next/headers";

export async function getBaseUrl() {
  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
