import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "../components/auth-context";
import PwaInstallPrompt from "../components/pwa-install";
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
  title: "MindSpark | AI-Powered Study Reviewer & Interactive Assessment Platform",
  description: "Transform PDFs, DOCX, PPTX, and TXT files into study guides, summary notes, and 7 interactive games: Multiple Choice, True/False, Fill in the Blanks, Matching, Flashcards, Identification, and Timed Quizzes.",
  keywords: ["AI reviewer", "educational games", "study platform", "assessment tool", "gamified learning", "exam reviewer"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindSpark",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white text-zinc-900 transition-colors duration-300 dark:bg-[#07070a] dark:text-zinc-50">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    // Service worker registered
                  }).catch(function(err) {
                    console.warn('PWA ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <AuthProvider>
          <ThemeProvider>
            {children}
            <PwaInstallPrompt />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
