"use server";

import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function syncUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // ✅ Ensure Clerk user is in Prisma User table
  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },
    update: {
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName || "",
      imageUrl: user.imageUrl || "",
    },
    create: {
      clerkUserId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.firstName || "",
      imageUrl: user.imageUrl || "",
    },
  });

  return dbUser;
}
