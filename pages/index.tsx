import dynamic from "next/dynamic";
import Head from "next/head";

const BingoBoard = dynamic(() => import("../components/BingoBoard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      📦 Kaart wordt laden…
    </div>
  ),
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Stan Bingo</title>
      </Head>
      <BingoBoard />
    </>
  );
}
