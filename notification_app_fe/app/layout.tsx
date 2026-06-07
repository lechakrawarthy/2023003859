import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import MuiProvider from "@/components/MuiProvider";

export const metadata: Metadata = {
  title: "Campus Notifications",
  description: "Campus notification platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <MuiProvider>{children}</MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
