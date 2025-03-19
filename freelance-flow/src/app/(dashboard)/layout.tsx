import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
