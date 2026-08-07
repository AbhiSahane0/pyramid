import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { COLOR_MODE_STORAGE_KEY } from "@/components/providers/color-mode-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pyramid — Task Management",
  description:
    "Plan, track and ship work with boards, lists, projects and themes.",
};

/** Applies the stored accent color before hydration to avoid a theme flash. */
const colorModeScript = `try{var m=localStorage.getItem(${JSON.stringify(COLOR_MODE_STORAGE_KEY)});if(m&&m!=="black")document.documentElement.dataset.colorMode=m;}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
