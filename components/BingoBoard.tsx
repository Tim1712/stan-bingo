"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Item = {
  id: string;
  text: string;
  checked: boolean;
};

const LOCAL_KEY = "stanBingoCardIds";

// Fisher–Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BingoBoard() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) Fetch initial items & subscribe to real-time updates
  useEffect(() => {
    // a) Load existing data
    async function loadItems() {
      const { data, error } = await supabase.from("bingo_items").select("*");
      if (error) {
        console.error("Error loading items:", error);
      } else {
        setAllItems((data as Item[]) || []);
        setLoading(false);
      }
    }
    loadItems();

    // b) Subscribe to updates
    const channel = supabase
      .channel("bingo-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_items" },
        (payload) => {
          const updated = payload.new as Item;
          setAllItems((prev) =>
            prev.map((it) => (it.id === updated.id ? updated : it))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2) Pick or restore your 16-item card
  useEffect(() => {
    if (loading || allItems.length === 0) return;

    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      setCardIds(JSON.parse(stored));
    } else {
      const ids = shuffle(allItems.map((it) => it.id)).slice(0, 16);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
      setCardIds(ids);
    }
  }, [loading, allItems]);

  // 3) Toggle checked state (optimistic + rollback)
  const toggle = async (id: string, wasChecked: boolean) => {
    // Optimistically update UI
    setAllItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !wasChecked } : it))
    );

    // Persist change
    const { error } = await supabase
      .from("bingo_items")
      .update({ checked: !wasChecked })
      .eq("id", id);

    if (error) {
      console.error("Update failed:", error);
      // Roll back on error
      setAllItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, checked: wasChecked } : it))
      );
    }
  };

  // 4) Prepare the 16 cells for rendering
  const cardItems = cardIds
    .map((id) => allItems.find((it) => it.id === id))
    .filter((it): it is Item => !!it);

  if (loading || cardItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        📦 Kaart wordt geladen…
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🍻 Stan Bingo</h1>
      <div className="grid grid-cols-4 gap-2">
        {cardItems.map((cell) => (
          <button
            key={cell.id}
            onClick={() => toggle(cell.id, cell.checked)}
            className={`p-2 text-xs text-center rounded border transition ${
              cell.checked
                ? "bg-green-300 line-through border-green-600"
                : "bg-gray-100 hover:bg-blue-100 border-gray-300"
            }`}
          >
            {cell.text}
          </button>
        ))}
      </div>
    </main>
  );
}
