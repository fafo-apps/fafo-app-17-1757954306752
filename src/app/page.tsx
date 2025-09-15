"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todos:v1";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch (e) {
    console.warn("Failed to load todos", e);
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.warn("Failed to save todos", e);
  }
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>(() => (typeof window !== "undefined" ? loadTodos() : []));
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    // focus the input on mount
    inputRef.current?.focus();
  }, []);

  function addTodo(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTodo: Todo = {
      id: uuidv4(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((s) => [newTodo, ...s]);
    setText("");
  }

  function toggleTodo(id: string) {
    setTodos((s) => s.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function removeTodo(id: string) {
    setTodos((s) => s.filter((t) => t.id !== id));
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function saveEdit(id: string) {
    const trimmed = editingText.trim();
    if (!trimmed) {
      // if empty after edit, remove
      removeTodo(id);
      cancelEdit();
      return;
    }
    setTodos((s) => s.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
    cancelEdit();
  }

  function clearCompleted() {
    setTodos((s) => s.filter((t) => !t.completed));
  }

  const visible = todos.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return !t.completed;
    return t.completed;
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app-gradient">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-2">Beautiful Todos</h1>
          <p className="text-muted">A small, elegant todo app — persists locally in your browser.</p>
        </header>

        <section className="todo-card">
          <form onSubmit={addTodo} className="flex gap-3 items-center mb-4">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What would you like to do today?"
              className="flex-1 input-base"
              aria-label="New todo"
            />
            <button type="submit" className="btn-primary" aria-label="Add todo">
              Add
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
              <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>Active</FilterButton>
              <FilterButton active={filter === "completed"} onClick={() => setFilter("completed")}>Completed</FilterButton>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{todos.filter((t) => !t.completed).length} left</span>
              <button className="link" onClick={clearCompleted} disabled={!todos.some((t) => t.completed)}>
                Clear completed
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {visible.length === 0 ? (
              <li className="text-center text-muted py-6">No todos here — add something to get started ✨</li>
            ) : (
              visible.map((todo) => (
                <li key={todo.id} className="todo-row">
                  <label className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="checkbox"
                      aria-label={`Mark ${todo.text} as ${todo.completed ? "active" : "completed"}`}
                    />
                    {editingId === todo.id ? (
                      <input
                        className="flex-1 input-edit"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(todo.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div
                        onDoubleClick={() => startEdit(todo)}
                        className={`flex-1 truncate ${todo.completed ? "line-through text-muted" : ""}`}
                        title={todo.text}
                      >
                        {todo.text}
                      </div>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    {editingId === todo.id ? (
                      <>
                        <button className="btn-ghost" onClick={() => saveEdit(todo.id)} aria-label="Save">
                          Save
                        </button>
                        <button className="btn-ghost" onClick={cancelEdit} aria-label="Cancel">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-ghost" onClick={() => startEdit(todo)} aria-label="Edit">
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => removeTodo(todo.id)} aria-label="Delete">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>

          <footer className="mt-6 text-xs text-muted">Tip: double-click a todo to edit it. Press Enter to save.</footer>
        </section>

        <footer className="mt-8 text-center text-sm text-muted">Built with ❤️ — client-side, simple and pretty.</footer>
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
        active ? "bg-foreground text-background shadow-sm" : "bg-transparent text-muted hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}
