import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Defective Gene Club — Share Your Adventure",
    template: "%s | Defective Gene Club",
  },
  description:
    "Defective Gene Club is the social platform for hunters and anglers to share adventures, track records, and connect with the outdoors community.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950">
        {/* Background texture */}
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />

        <Navigation username={currentUser?.username ?? null} />

        {/* Page content — offset for sidebar on desktop, bottom bar on mobile */}
        <div className="md:pl-60 pb-16 md:pb-0 relative">
          {children}
        </div>
      </body>
    </html>
  );
}
