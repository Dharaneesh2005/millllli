import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import LanguageSelector from "./LanguageSelector";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <LanguageSelector />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
