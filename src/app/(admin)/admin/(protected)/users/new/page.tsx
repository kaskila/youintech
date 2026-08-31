import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { UserCreateForm } from "../user-create-form";

// ADMIN only — same gate as the list page. createUser also re-checks
// requireAdmin server-side.
export default async function NewUserPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/admin/login");

  const me = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true },
  });
  if (!me || me.role !== Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/users" className="text-sm">
        ← Back to users
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">New user</h1>
      <UserCreateForm />
    </div>
  );
}
