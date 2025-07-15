import Script from "next/script";
import type { AppProps } from "next/app";
import "../styles/globals.css"; // you can keep your base resets here

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* this loads Tailwind’s entire library before your app renders */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Component {...pageProps} />
    </>
  );
}
