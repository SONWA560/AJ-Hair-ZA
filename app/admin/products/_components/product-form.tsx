"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct, type ProductFormData } from "@/lib/product-actions";
import { Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const HAIR_TYPES = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "body_wave", label: "Body Wave" },
  { value: "deep_wave", label: "Deep Wave" },
  { value: "water_wave", label: "Water Wave" },
  { value: "kinky_curly", label: "Kinky Curly" },
  { value: "coily", label: "Coily" },
];

const LACE_TYPES = [
  "13x4 Lace Front",
  "13x6 Lace Front",
  "4x4 Lace Closure",
  "5x5 Lace Closure",
  "360 Lace",
  "Full Lace",
  "None",
];

const DENSITIES = ["130%", "150%", "180%", "200%", "250%"];

interface Props {
  mode: "create" | "edit";
  productId?: string;
  defaultValues?: Partial<ProductFormData>;
}

const empty: ProductFormData = {
  title: "",
  description: "",
  price: 0,
  cost: 0,
  imageUrls: [""],
  hair_type: "",
  lace_type: "",
  density: "",
  hair_grade: "",
  length: "",
  color: "",
  texture: "",
  quantity: 0,
  inStock: true,
  featured: false,
  new_arrival: false,
  trending_score: 0,
  tags: [],
  seo_handle: "",
  seo_title: "",
  seo_description: "",
};

export function ProductForm({ mode, productId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProductFormData>({
    ...empty,
    ...defaultValues,
  });
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setImageUrl(index: number, value: string) {
    const updated = [...form.imageUrls];
    updated[index] = value;
    set("imageUrls", updated);
  }

  function addImageRow() {
    set("imageUrls", [...form.imageUrls, ""]);
  }

  function removeImageRow(index: number) {
    set(
      "imageUrls",
      form.imageUrls.filter((_, i) => i !== index),
    );
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const existing = form.tags ?? [];
    if (existing.includes(tag)) {
      setTagInput("");
      return;
    }
    set("tags", [...existing, tag]);
    setTagInput("");
  }

  function removeTag(index: number) {
    set("tags", (form.tags ?? []).filter((_, i) => i !== index));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.price || form.price <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(form)
          : await updateProduct(productId!, form);

      if (result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. The Solange Deep Wave Wig"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Product description..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (rands, e.g. 2999 = R2,999) *</Label>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              placeholder="2999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost Price (rands) *</Label>
            <Input
              id="cost"
              type="number"
              value={form.cost}
              onChange={(e) => set("cost", Number(e.target.value))}
              placeholder="1500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setImageUrl(i, e.target.value)}
                placeholder="https://..."
              />
              {form.imageUrls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImageRow(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImageRow}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add image URL
          </Button>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Hair Type</Label>
            <Select
              value={form.hair_type}
              onValueChange={(v) => set("hair_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hair type" />
              </SelectTrigger>
              <SelectContent>
                {HAIR_TYPES.map((ht) => (
                  <SelectItem key={ht.value} value={ht.value}>
                    {ht.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lace Type</Label>
            <Select
              value={form.lace_type}
              onValueChange={(v) => set("lace_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lace type" />
              </SelectTrigger>
              <SelectContent>
                {LACE_TYPES.map((lt) => (
                  <SelectItem key={lt} value={lt}>
                    {lt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Density</Label>
            <Select
              value={form.density}
              onValueChange={(v) => set("density", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                {DENSITIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="length">Length</Label>
            <Input
              id="length"
              value={form.length}
              onChange={(e) => set("length", e.target.value)}
              placeholder="e.g. 18inch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="e.g. Natural Black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hair_grade">Hair Grade</Label>
            <Input
              id="hair_grade"
              value={form.hair_grade}
              onChange={(e) => set("hair_grade", e.target.value)}
              placeholder="e.g. 10A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="texture">Texture</Label>
            <Input
              id="texture"
              value={form.texture}
              onChange={(e) => set("texture", e.target.value)}
              placeholder="e.g. Silky Smooth"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="inStock">In Stock</Label>
            <Switch
              id="inStock"
              checked={form.inStock}
              onCheckedChange={(v) => {
                set("inStock", v);
                if (!v) set("quantity", 0);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => {
                const qty = Number(e.target.value);
                set("quantity", qty);
                set("inStock", qty > 0);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={form.featured}
              onCheckedChange={(v) => set("featured", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="new_arrival">New Arrival</Label>
            <Switch
              id="new_arrival"
              checked={form.new_arrival}
              onCheckedChange={(v) => set("new_arrival", v)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="trending_score">Trending Score (0–100)</Label>
            <Input
              id="trending_score"
              type="number"
              min={0}
              max={100}
              value={form.trending_score}
              onChange={(e) => set("trending_score", Number(e.target.value))}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Search Tags</Label>
            <p className="text-xs text-muted-foreground">
              Add custom tags to improve search discoverability. Press Enter or comma to add.
            </p>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(form.tags ?? []).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="ml-1 rounded-full hover:bg-blue-200"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g. wedding, protective style, 613…"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo_handle">URL Handle</Label>
            <Input
              id="seo_handle"
              value={form.seo_handle}
              onChange={(e) => set("seo_handle", e.target.value)}
              placeholder="auto-generated from title if left blank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input
              id="seo_title"
              value={form.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              placeholder="Defaults to product title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Textarea
              id="seo_description"
              value={form.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              placeholder="Brief description for search engines..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
