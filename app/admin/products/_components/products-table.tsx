"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "@/lib/product-actions";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Product {
  id: string;
  title: string;
  price: number;
  hairType: string;
  inStock: boolean;
  quantity: number;
  image: string;
  handle: string;
}

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDeleteClick(id: string, title: string) {
    setDeleteId(id);
    setDeleteTitle(title);
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteProduct(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Hair Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {search ? "No products match your search." : "No products yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {product.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.hairType || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(product.price)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.inStock ? "default" : "destructive"}
                    >
                      {product.inStock ? `${product.quantity} in stock` : "Out of stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteClick(product.id, product.title)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTitle}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
