import { createHash } from "node:crypto";
import { rateLimit } from "./lib/rate-limit";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
var bcrypt = require("bcryptjs");
import { authConfig } from "./auth.config";
import { User } from "./models/user.model";
import prisma from "./lib/db";

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user || undefined;
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_database_error" }));
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6).max(128) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { password } = parsedCredentials.data;
          const email = parsedCredentials.data.email.toLowerCase();
          try { await rateLimit(`signin:${createHash("sha256").update(email).digest("hex")}`, 10); } catch { return null; }
          const user = await getUser(email);
          if (!user) {
            await bcrypt.compare(password, "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
            return null;
          }
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return { id: user.id, name: user.name, email: user.email };
        }
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
