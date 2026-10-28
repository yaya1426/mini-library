import "dotenv/config";

import { scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";
import { calculateDueDate } from "../src/lib/dates";
import { parseEnv } from "../src/schemas/env.schema";

const env = parseEnv(process.env);

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function hashSeedPassword(password: string, saltHex: string): string {
  const derivedKey = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return `scrypt$${saltHex}$${derivedKey.toString("hex")}`;
}

const SEED_BOOKS = [
  {
    isbn: "978-977-09-1673-5",
    title: "أولاد حارتنا",
    author: "نجيب محفوظ",
    description:
      "رواية رمزية فلسفية تستعرض تاريخ الإنسانية وصراعها الدائم بين القوة والعدل والمعرفة في حارة مصرية متخيلة.",
    copies: [
      { barcode: "ML-BK01-C01", withdrawnAt: null },
      { barcode: "ML-BK01-C02", withdrawnAt: null },
      { barcode: "ML-BK01-C03", withdrawnAt: null },
    ],
  },
  {
    isbn: "978-977-416-404-0",
    title: "ثلاثية غرناطة",
    author: "رضوى عاشور",
    description:
      "ملحمة روائية تروي حكاية عائلة أندلسية على مدى ثلاثة أجيال بعد سقوط غرناطة.",
    copies: [
      { barcode: "ML-BK02-C01", withdrawnAt: null },
      { barcode: "ML-BK02-C02", withdrawnAt: null },
    ],
  },
  {
    isbn: "978-977-09-3211-7",
    title: "الأيام",
    author: "طه حسين",
    description:
      "السيرة الذاتية لعميد الأدب العربي منذ طفولته في صعيد مصر إلى دراسته في الأزهر والسوربون.",
    copies: [
      { barcode: "ML-BK03-C01", withdrawnAt: null },
      {
        barcode: "ML-BK03-C02",
        withdrawnAt: new Date("2026-01-15T10:00:00.000Z"),
      },
    ],
  },
  {
    isbn: "978-0-13-235088-4",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    description:
      "Practical principles, patterns, and heuristics for writing readable, maintainable, and testable software.",
    copies: [
      { barcode: "ML-BK04-C01", withdrawnAt: null },
      { barcode: "ML-BK04-C02", withdrawnAt: null },
      { barcode: "ML-BK04-C03", withdrawnAt: null },
    ],
  },
  {
    isbn: "978-1-4493-7332-0",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    description:
      "Deep dive into the big ideas behind reliable, scalable, and maintainable distributed data systems.",
    copies: [
      { barcode: "ML-BK05-C01", withdrawnAt: null },
      { barcode: "ML-BK05-C02", withdrawnAt: null },
    ],
  },
  {
    isbn: "978-0-201-61622-4",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    description:
      "From journeyman to master: timeless practices for software craftsmanship and pragmatic engineering.",
    copies: [{ barcode: "ML-BK06-C01", withdrawnAt: null }],
  },
] as const;

async function main() {
  const librarian = await prisma.user.upsert({
    where: { email: "librarian@minilibrary.local" },
    update: {
      fullName: "أمين المكتبة",
      role: UserRole.LIBRARIAN,
    },
    create: {
      fullName: "أمين المكتبة",
      email: "librarian@minilibrary.local",
      passwordHash: hashSeedPassword(
        "Librarian123!",
        "0102030405060708090a0b0c0d0e0f10",
      ),
      role: UserRole.LIBRARIAN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@minilibrary.local" },
    update: {
      fullName: "سارة أحمد",
      role: UserRole.MEMBER,
    },
    create: {
      fullName: "سارة أحمد",
      email: "member@minilibrary.local",
      passwordHash: hashSeedPassword(
        "Member123!",
        "1112131415161718191a1b1c1d1e1f20",
      ),
      role: UserRole.MEMBER,
    },
  });

  for (const bookSeed of SEED_BOOKS) {
    const book = await prisma.book.upsert({
      where: { isbn: bookSeed.isbn },
      update: {
        title: bookSeed.title,
        author: bookSeed.author,
        description: bookSeed.description,
      },
      create: {
        isbn: bookSeed.isbn,
        title: bookSeed.title,
        author: bookSeed.author,
        description: bookSeed.description,
      },
    });

    for (const copySeed of bookSeed.copies) {
      await prisma.copy.upsert({
        where: { barcode: copySeed.barcode },
        update: {
          bookId: book.id,
          withdrawnAt: copySeed.withdrawnAt,
        },
        create: {
          bookId: book.id,
          barcode: copySeed.barcode,
          withdrawnAt: copySeed.withdrawnAt,
        },
      });
    }
  }

  // Ensure "The Pragmatic Programmer" (ML-BK06-C01) has an active loan so that
  // the catalog always includes a book with 0 available copies (P004, P005).
  const unavailableCopy = await prisma.copy.findUniqueOrThrow({
    where: { barcode: "ML-BK06-C01" },
  });

  const existingActiveLoan = await prisma.loan.findFirst({
    where: {
      copyId: unavailableCopy.id,
      returnedAt: null,
    },
  });

  if (!existingActiveLoan) {
    const borrowedAt = new Date();
    const dueDate = calculateDueDate(borrowedAt);

    await prisma.loan.create({
      data: {
        memberId: member.id,
        bookId: unavailableCopy.bookId,
        copyId: unavailableCopy.id,
        borrowedAt,
        dueDate,
      },
    });
  }

  console.log(
    `Seeded librarian (${librarian.email}), member (${member.email}), and ${SEED_BOOKS.length} books.`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
