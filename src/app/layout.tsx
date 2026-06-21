import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { UserProvider } from "@/context/UserContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { StoreProvider } from "@/components/StoreProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MamaGreen | AI Carbon Footprint Tracker & Reduction Platform",
  description:
    "Track, calculate, and reduce your daily environmental footprint. Powered by AI — personalised for India. Save money, improve health, and build green habits.",
  keywords: [
    "carbon footprint tracker",
    "eco commute India",
    "sustainability app",
    "green mobility",
    "carbon calculator",
    "MamaGreen",
  ],
  openGraph: {
    title: "MamaGreen — India's AI Eco-Fitness Companion",
    description: "Track your environmental footprint, reduce emissions, save money, and build sustainable habits.",
    type: "website",
  },
  icons: {
    icon: "/assets/MamaGreen-logo.png",
    shortcut: "/assets/MamaGreen-logo.png",
    apple: "/assets/MamaGreen-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-brand-cream text-brand-brown">
        {/* Skip Navigation — Accessibility (WCAG 2.4.1) */}
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>

        <StoreProvider>
          <UserProvider>
            <SidebarProvider>
              {/* Sidebar navigation — role=navigation provided inside Navbar */}
              <Navbar />
              <LayoutWrapper>
                <main
                  id="main-content"
                  role="main"
                  className="flex-1 flex flex-col"
                  aria-label="Main content"
                >
                  {children}
                </main>
              </LayoutWrapper>
            </SidebarProvider>
          </UserProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
