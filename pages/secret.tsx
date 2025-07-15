// pages/admin.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Simple Pencil icon
const PencilIcon = () => <span className="ml-2">✏️</span>;

type Item = {
  id: string;
  text: string;
  checked: boolean;
};

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // Load all items & subscribe to changes
  useEffect(() => {
    // initial load
    supabase
      .from("bingo_items")
      .select("*")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Load error:", error);
        else setItems(data as Item[]);
      });

    // realtime subscription
    const channel = supabase
      .channel("admin-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bingo_items" },
        ({ new: rec }) => setItems((prev) => [...prev, rec as Item])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_items" },
        ({ new: rec }) => {
          const u = rec as Item;
          setItems((prev) => prev.map((it) => (it.id === u.id ? u : it)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bingo_items" },
        ({ old: rec }) => {
          const d = rec as Item;
          setItems((prev) => prev.filter((it) => it.id !== d.id));
        }
      );
    channel.subscribe();

    // cleanup without returning a promise
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Toggle checked state
  const toggleChecked = async (id: string, was: boolean) => {
    const { error } = await supabase
      .from("bingo_items")
      .update({ checked: !was })
      .eq("id", id);
    if (error) console.error("Toggle error:", error);
  };

  // Add a new item
  const addItem = async () => {
    const text = newText.trim();
    if (!text) return;
    const { error } = await supabase
      .from("bingo_items")
      .insert({ text, checked: false });
    if (error) console.error("Insert error:", error);
    else setNewText("");
  };

  // Start editing mode
  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  // Save edited text
  const saveEdit = async (id: string) => {
    const text = editingText.trim();
    if (!text || !editingId) return;
    const { error } = await supabase
      .from("bingo_items")
      .update({ text })
      .eq("id", id);
    if (error) console.error("Update error:", error);
    setEditingId(null);
    setEditingText("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-2 text-center">
        🍻 Stan Bingo Admin
      </h1>
      {/* Total count */}
      <p className="text-center mb-4">Total items: {items.length}</p>

      {/* Add new item */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="New item text…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* List all items vertically */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer
              ${
                item.checked
                  ? "bg-green-100 border-green-400"
                  : "bg-white border-gray-300 hover:bg-blue-50"
              }
            `}
          >
            {editingId === item.id ? (
              <>
                <input
                  className="flex-1 border rounded px-2 py-1 mr-2"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <button
                  onClick={() => saveEdit(item.id)}
                  className="text-green-600 mr-2"
                >
                  Save
                </button>
                <button onClick={cancelEdit} className="text-red-600">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className="flex-1"
                  onClick={() => toggleChecked(item.id, item.checked)}
                >
                  {item.text}
                </span>
                <button onClick={() => startEditing(item.id, item.text)}>
                  <PencilIcon />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
