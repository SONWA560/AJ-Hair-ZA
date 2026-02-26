"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  hair_type: string;
  lace_type: string;
  density: string;
  length: string;
  color: string;
  inStock: boolean;
  quantity: string;
  imageUrl: string;
  handle: string;
}

const initialFormData: ProductFormData = {
  title: "",
  description: "",
  price: "",
  hair_type: "straight",
  lace_type: "lace_front",
  density: "150%",
  length: "14",
  color: "Natural Black",
  inStock: true,
  quantity: "10",
  imageUrl: "",
  handle: "",
};

export function ProductForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-generate handle from title
    if (field === "title" && typeof value === "string") {
      const handle = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, handle }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Premium Brazilian Straight Wig"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">URL Handle *</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => handleChange("handle", e.target.value)}
                placeholder="e.g., premium-brazilian-straight"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the product..."
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price (ZAR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="999.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inStock">Status</Label>
              <Select
                value={formData.inStock ? "true" : "false"}
                onValueChange={(value) => handleChange("inStock", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Stock</SelectItem>
                  <SelectItem value="false">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold">Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Hair Type</Label>
              <Select
                value={formData.hair_type}
                onValueChange={(value) => handleChange("hair_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="wavy">Wavy</SelectItem>
                  <SelectItem value="curly">Curly</SelectItem>
                  <SelectItem value="kinky_curly">Kinky Curly</SelectItem>
                  <SelectItem value="coily">Coily</SelectItem>
                  <SelectItem value="body_wave">Body Wave</SelectItem>
                  <SelectItem value="deep_wave">Deep Wave</SelectItem>
                  <SelectItem value="water_wave">Water Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lace Type</Label>
              <Select
                value={formData.lace_type}
                onValueChange={(value) => handleChange("lace_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lace_front">Lace Front</SelectItem>
                  <SelectItem value="full_lace">Full Lace</SelectItem>
                  <SelectItem value="lace_part">Lace Part</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Density</Label>
              <Select
                value={formData.density}
                onValueChange={(value) => handleChange("density", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120%">120% - Natural</SelectItem>
                  <SelectItem value="150%">150% - Medium</SelectItem>
                  <SelectItem value="180%">180% - Heavy</SelectItem>
                  <SelectItem value="200%">200% - Extra Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Length (inches)</Label>
              <Select
                value={formData.length}
                onValueChange={(value) => handleChange("length", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8"</SelectItem>
                  <SelectItem value="10">10"</SelectItem>
                  <SelectItem value="12">12"</SelectItem>
                  <SelectItem value="14">14"</SelectItem>
                  <SelectItem value="16">16"</SelectItem>
                  <SelectItem value="18">18"</SelectItem>
                  <SelectItem value="20">20"</SelectItem>
                  <SelectItem value="22">22"</SelectItem>
                  <SelectItem value="24">24"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => handleChange("color", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Natural Black">Natural Black</SelectItem>
                  <SelectItem value="Jet Black">Jet Black</SelectItem>
                  <SelectItem value="Dark Brown">Dark Brown</SelectItem>
                  <SelectItem value="Medium Brown">Medium Brown</SelectItem>
                  <SelectItem value="Light Brown">Light Brown</SelectItem>
                  <SelectItem value="Blonde">Blonde</SelectItem>
                  <SelectItem value="Colored">Colored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
