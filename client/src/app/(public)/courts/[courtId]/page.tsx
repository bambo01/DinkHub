import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { Court } from "@/types/court";
import { CourtDetail } from "@/components/courts/CourtDetail";

export default async function CourtPage(
  props: PageProps<"/courts/[courtId]">,
) {
  const { courtId } = await props.params;

  let court: Court;
  try {
    court = await apiFetch<Court>(`/courts/${courtId}`, null);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const searchParams = await props.searchParams;
  const date =
    typeof searchParams.date === "string" ? searchParams.date : undefined;
  const start =
    typeof searchParams.start === "string"
      ? Number(searchParams.start)
      : undefined;
  const end =
    typeof searchParams.end === "string"
      ? Number(searchParams.end)
      : undefined;

  return (
    <CourtDetail
      court={court}
      initialDate={date}
      initialStart={Number.isFinite(start) ? start : undefined}
      initialEnd={Number.isFinite(end) ? end : undefined}
    />
  );
}
