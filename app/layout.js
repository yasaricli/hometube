import { Roboto } from "next/font/google";

// Styles
import "@/styles/main.scss";

const sans = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });

export const metadata = {
  title: "HomeTube",
  description: "Your own video library, downloaded to your homelab",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
