import type { Metadata, Viewport } from "next";
import { CompanionApp } from "@/components/minipay/CompanionApp";

export const metadata: Metadata = {
  title: "CVault · Convert to dollars",
  description:
    "Your CVault agent in MiniPay. See your balance and convert local money to dollars at the best rate — network fee paid for you.",
};

// MiniPay renders inside a 360×640 WebView. Lock the viewport so the layout
// never zooms or horizontally scrolls on budget Android devices.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function MiniPayCompanionPage() {
  return <CompanionApp />;
}
