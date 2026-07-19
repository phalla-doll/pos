import type { Metadata } from "next"
import { Roboto, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { APP_NAME, titleTemplate } from "@/lib/title"
import { cn } from "@/lib/utils"

/**
 * `template` applies to titles set by route segments below this one. The
 * dashboard workspace can't use it — its active screen changes without a
 * navigation — so it composes the same template client-side via
 * `documentTitle`. Both read it from `@/lib/title`.
 */
export const metadata: Metadata = {
  title: { default: APP_NAME, template: titleTemplate },
  description:
    "Point-of-sale dashboard for sales, inventory, customers, and reporting.",
  applicationName: APP_NAME,
}

const fontSans = Roboto({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
