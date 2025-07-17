"use client";

import { useEffect, useState } from "react";
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
  const RULES_KEY = "hasSeenRules";
  const [showModal, setShowModal] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(RULES_KEY);
    if (!seen) {
      setShowModal(true);
    } else {
      setRulesAccepted(true);
    }
  }, []);

  const acceptRules = () => {
    localStorage.setItem(RULES_KEY, "true");
    setRulesAccepted(true);
    setShowModal(false);
  };

  // compact inline rules above board
  const rulesInline = (
    <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600">
      <strong className="block mb-1">Korte Regels</strong>
      <ul className="list-disc list-inside space-y-0">
        <li>Eerste die een kaart vol heeft wint.</li>
        <li>
          Stan mag niet doorhebben dat we bingo spelen, anders straf (shotje/
          atje).
        </li>
        <li>Ontdekt hij manipulatie, dan straf (shotje/atje).</li>
        <li>Minimaal 2 getuigen vereist.</li>
      </ul>
    </div>
  );

  return (
    <>
      <Head>
        <title>🍻 Stan Bingo</title>
      </Head>

      {/* Rules Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-md text-left">
            <h2 className="text-xl font-bold mb-4">Spelregels</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6 text-sm">
              <li>Eerste die een kaart vol heeft wint.</li>
              <li>
                Komt Stan er door jou achter dat we bingo spelen, straf atje of
                shotje.
              </li>
              <li>
                Je mag hem proberen iets te laten doen/zeggen. MAAR: komt Stan
                erachter dat je hem manipuleert, straf atje of shotje.
              </li>
              <li>Minstens 2 getuigen.</li>
            </ul>
            <button
              onClick={acceptRules}
              className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              Ik begrijp het, laten we beginnen!
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen p-2 w-full">
        {/* Title */}
        {!showModal && (
          <h1 className="text-3xl font-bold mb-4 text-center">🍻 Stan Bingo</h1>
        )}

        {/* Inline small rules above the board */}
        {!showModal && rulesAccepted && rulesInline}

        {/* The board fills full width */}
        {!showModal && <BingoBoard />}
      </main>
    </>
  );
}
