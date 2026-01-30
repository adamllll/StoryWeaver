import "./globals.css";
import { Caveat, Patrick_Hand } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
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
