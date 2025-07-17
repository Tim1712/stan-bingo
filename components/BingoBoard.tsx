// components/BingoBoard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Item = { id: string; text: string; checked: boolean };
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

  // 1) Load, subscribe, refresh on focus/visibility
  useEffect(() => {
    async function loadItems() {
      const { data, error } = await supabase.from("bingo_items").select("*");
      if (error) console.error("Error loading items:", error);
      else {
        setAllItems(data as Item[]);
        setLoading(false);
      }
    }
    loadItems();

    const channel = supabase
      .channel("bingo-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_items" },
        ({ new: updated }) => {
          const u = updated as Item;
          setAllItems((prev) => prev.map((it) => (it.id === u.id ? u : it)));
        }
      );
    channel.subscribe();

    const refresh = () => loadItems();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", () => {});
    };
  }, []);

  // 2) Restore or generate 16 IDs
  useEffect(() => {
    if (loading || allItems.length === 0) return;
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) setCardIds(JSON.parse(stored));
    else {
      const ids = shuffle(allItems.map((it) => it.id)).slice(0, 16);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
      setCardIds(ids);
    }
  }, [loading, allItems]);

  // 3) Toggle with optimistic UI
  const toggle = async (id: string, was: boolean) => {
    setAllItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !was } : it))
    );
    const { error } = await supabase
      .from("bingo_items")
      .update({ checked: !was })
      .eq("id", id);
    if (error) {
      console.error("Update failed:", error);
      setAllItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, checked: was } : it))
      );
    }
  };

  // 4) Prepare 16 cells
  const cardItems = cardIds
    .map((id) => allItems.find((it) => it.id === id))
    .filter((it): it is Item => !!it);

  if (loading || cardItems.length === 0) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        📦 Kaart wordt geladen…
      </div>
    );
  }

  return (
    <div className="w-full px-0">
      <div className="grid grid-cols-4 gap-1">
        {cardItems.map((cell) => (
          <button
            key={cell.id}
            onClick={() => toggle(cell.id, cell.checked)}
            className={`text-[10px] leading-snug text-center p-1 rounded border transition ${
              cell.checked
                ? "bg-green-300 line-through border-green-600"
                : "bg-gray-100 hover:bg-blue-100 border-gray-300"
            }`}
          >
            {cell.text}
          </button>
        ))}
      </div>
    </div>
  );
}
