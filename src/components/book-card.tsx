import { BookOpen } from "lucide-react";
import { AvailabilityBadge } from "@/components/availability-badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { CatalogBookItem } from "@/services/catalog.service";

export interface BookCardProps {
  book: CatalogBookItem;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const isAvailable = book.availableCopies > 0;

  return (
    <Link
      href={`/books/${book.id}`}
      className={cn(
        "group flex flex-col border-3 border-black shadow-sm motion-safe:transition-[translate,box-shadow] motion-safe:duration-100 ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black",
        isAvailable ? "bg-white text-black" : "bg-stripes text-gray-600",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-full border-b-3 border-black flex flex-col items-center justify-center p-6 overflow-hidden",
          isAvailable ? "bg-gray-50" : "bg-stripes",
        )}
      >
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt=""
            className="h-full w-full object-cover border-2 border-black bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="inline-flex size-16 items-center justify-center border-3 border-black bg-white text-black shadow-xs">
              <BookOpen
                className="size-8"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </div>
            {book.isbn ? (
              <span
                dir="ltr"
                className="font-mono text-xs font-bold text-gray-600 bg-white px-2 py-0.5 border-2 border-black"
              >
                {book.isbn}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col justify-between gap-4 p-5 text-start",
          isAvailable ? "bg-white" : "bg-white/95",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold text-black leading-snug ltr:tracking-tight line-clamp-2">
            <bdi>{book.title}</bdi>
          </h2>
          <p className="text-sm font-medium text-gray-600 line-clamp-1">
            <bdi>{book.author}</bdi>
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between gap-2">
          <AvailabilityBadge availableCopies={book.availableCopies} />
        </div>
      </div>
    </Link>
  );
}
