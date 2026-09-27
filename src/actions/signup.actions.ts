"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/db";

const bcrypt = require("bcryptjs");

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function signupUser(input: unknown) {
  const parsed = SignupSchema.safeParse(input);
  if (!parsed.success) return "Please enter valid signup details.";

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  try {
    await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 12) },
    });
    return null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "An account with that email already exists.";
    }
    throw error;
  }
}
