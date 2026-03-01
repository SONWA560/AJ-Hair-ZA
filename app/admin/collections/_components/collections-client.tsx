"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    CollectionData,
    createCollection,
    deleteCollection,
    updateCollection,
} from "@/lib/collection-actions";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const HAIR_TYPE_OPTIONS = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "body_wave", label: "Body Wave" },
  { value: "deep_wave", label: "Deep Wave" },
  { value: "water_wave", label: "Water Wave" },
  { value: "kinky_curly", label: "Kinky Curly" },
  { value: "coily", label: "Coily" },
];

interface Collection extends CollectionData {
  id: string;
}

interface Props {
  collections: Collection[];
}

const emptyForm: CollectionData = {
  handle: "",
  title: "",
  description: "",
  hairTypes: [],
  image: "",
};

export function CollectionsClient({ collections: initial }: Props) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionData>(emptyForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(col: Collection) {
    setForm({
      handle: col.handle,
      title: col.title,
      description: col.description,
      hairTypes: col.hairTypes,
      image: col.image,
    });
    setEditingId(col.id);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function toggleHairType(value: string) {
    setForm((prev) => ({
      ...prev,
      hairTypes: prev.hairTypes.includes(value)
        ? prev.hairTypes.filter((h) => h !== value)
        : [...prev.hairTypes, value],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateCollection(editingId, form)
        : await createCollection(form);

      if (result.success) {
        closeForm();
        router.refresh();
      } else {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCollection(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500">
            Manage product collections and categories
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingId ? "Edit Collection" : "New Collection"}
              </CardTitle>
              <button
                onClick={closeForm}
                className="rounded-md p-1 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="col-title">Title *</Label>
                  <Input
                    id="col-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. Straight Hair"
                  />
                </div>

                {!editingId && (
                  <div className="space-y-2">
                    <Label htmlFor="col-handle">
                      URL Handle{" "}
                      <span className="text-xs text-muted-foreground">
                        (auto-generated if blank)
                      </span>
                    </Label>
                    <Input
                      id="col-handle"
                      value={form.handle}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, handle: e.target.value }))
                      }
                      placeholder="e.g. straight-hair"
                    />
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="col-description">Description</Label>
                  <Textarea
                    id="col-description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Short description of this collection"
                    rows={2}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="col-image">Image URL</Label>
                  <Input
                    id="col-image"
                    value={form.image}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, image: e.target.value }))
                    }
                    placeholder="/images/collection.jpg or https://..."
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Hair Types (used to filter products)</Label>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_TYPE_OPTIONS.map((opt) => {
                      const selected = form.hairTypes.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleHairType(opt.value)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {form.hairTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hair types selected — this collection will show all
                      products (e.g. &quot;New Arrivals&quot;).
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? editingId
                      ? "Saving..."
                      : "Creating..."
                    : editingId
                      ? "Save Changes"
                      : "Create Collection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Collections list */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No collections yet.</p>
            <Button onClick={openCreate} className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add your first collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card key={col.id} className="overflow-hidden">
              {col.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={col.image}
                  alt={col.title}
                  className="h-36 w-full object-cover"
                />
              )}
              {!col.image && (
                <div className="flex h-36 items-center justify-center bg-gray-100 text-4xl text-gray-300">
                  🖼
                </div>
              )}
              <CardContent className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold">{col.title}</h3>
                  {col.description && (
                    <p className="text-xs text-muted-foreground">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {col.hairTypes.length > 0 ? (
                    col.hairTypes.map((ht) => (
                      <span
                        key={ht}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {ht.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No hair type filter (shows all)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(col)}
                    className="flex-1"
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(col.id, col.title)}
                    className="text-destructive hover:bg-red-50 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
