import type { ClubAuthor } from "@/types/club";

export function authorName(author: ClubAuthor) {
  return author.fullName ?? "Member";
}

export function Avatar({ author }: { author: ClubAuthor }) {
  const name = authorName(author);

  if (author.avatarUrl) {
    // Avatar URLs come from Supabase Storage's public bucket — a plain <img>
    // avoids needing that domain allow-listed for next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={author.avatarUrl} alt="" className="h-8 w-8 flex-none rounded-full object-cover" />;
  }

  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-secondary">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
