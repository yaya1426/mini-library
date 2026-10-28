import { BookCard } from "@/components/book-card";
import { cn } from "@/lib/utils";
import type { CatalogBookItem } from "@/services/catalog.service";

export interface BookGridProps {
  books: CatalogBookItem[];
  className?: string;
}

export function BookGrid({ books, className }: BookGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-2 pe-2",
        className,
      )}
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
