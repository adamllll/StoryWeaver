import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const caveat = localFont({
  src: "../public/fonts/Caveat-latin.woff2",
  weight: "400 700",
  variable: "--font-caveat",
  display: "swap",
});

const patrickHand = localFont({
  src: "../public/fonts/PatrickHand-latin.woff2",
  weight: "400",
  variable: "--font-patrick",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${caveat.variable} ${patrickHand.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        {/* Hidden SVG for sketch-roughen filter */}
        <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="sketch-roughen">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={2} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
