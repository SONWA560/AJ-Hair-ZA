"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import type { Product, ProductFilters } from "@/lib/types"
import { filterProducts } from "@/lib/actions"

const hairTypes = [
  { value: "kinky_curly", label: "Kinky Curly" },
  { value: "straight", label: "Straight" },
  { value: "coily", label: "Coily" },
  { value: "wavy", label: "Wavy" },
  { value: "body_wave", label: "Body Wave" },
  { value: "deep_wave", label: "Deep Wave" },
  { value: "water_wave", label: "Water Wave" }
]

const lengths = ["4in", "5in", "8in", "9in", "10in", "10\"", "12in", "13in", "14in", "16in", "18in", "18\"", "20inch", "24inch", "26inch"]

const colors = [
  "Natural Black",
  "Natural",
  "Brown",
  "Ombré",
  "Balayage",
  "Blonde",
  "Chestnut",
  "Honey Blonde"
]

const densities = ["150%", "180%", "200%", "250%"]

const laceTypes = [
  "4x4",
  "5x5",
  "13x4",
  "13x6 HD",
  "9x6",
  "Full Frontal",
  "Frontal",
  "360 Lace",
  "4x4 Closure"
]

const sortFilters = [
  { key: "featured", name: "Featured" },
  { key: "best_selling", name: "Best Selling" },
  { key: "price_low_high", name: "Price: Low to High" },
  { key: "price_high_low", name: "Price: High to Low" },
  { key: "newest", name: "Newest Arrivals" }
]

const minPrice = 0
const maxPrice = 10000

interface CollectionSearchClientProps {
  initialProducts: Product[]
  collection: string
}

export function CollectionSearchClient({
  initialProducts,
  collection
}: CollectionSearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  
  const [search, setSearch] = useState(searchParams.get("q") || "")
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>(
    searchParams.get("hair_type")?.split(",").filter(Boolean) || []
  )
  const [selectedLengths, setSelectedLengths] = useState<string[]>(
    searchParams.get("length")?.split(",").filter(Boolean) || []
  )
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get("color")?.split(",").filter(Boolean) || []
  )
  const [selectedDensities, setSelectedDensities] = useState<string[]>(
    searchParams.get("density")?.split(",").filter(Boolean) || []
  )
  const [selectedLaceTypes, setSelectedLaceTypes] = useState<string[]>(
    searchParams.get("lace_type")?.split(",").filter(Boolean) || []
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("price_min")) || minPrice,
    Number(searchParams.get("price_max")) || maxPrice
  ])
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured")

  const formatPrice = (price: number) => {
    return price === maxPrice ? `R${price.toLocaleString()}+` : `R${price.toLocaleString()}`
  }

  const fetchFilteredProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: ProductFilters = {}
      
      if (search) filters.search = search
      if (selectedHairTypes.length > 0) filters.hair_type = selectedHairTypes
      if (selectedLengths.length > 0) filters.length = selectedLengths
      if (selectedColors.length > 0) filters.color = selectedColors
      if (selectedDensities.length > 0) filters.density = selectedDensities
      if (selectedLaceTypes.length > 0) filters.lace_type = selectedLaceTypes
      if (priceRange[0] > minPrice) filters.price_min = priceRange[0]
      if (priceRange[1] < maxPrice) filters.price_max = priceRange[1]
      filters.sortBy = sortBy as ProductFilters["sortBy"]
      
      const result = await filterProducts(collection, filters)
      setProducts(result.products)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [collection, search, selectedHairTypes, selectedLengths, selectedColors, selectedDensities, selectedLaceTypes, priceRange, sortBy])

  const handleFilterChange = () => {
    startTransition(async () => {
      // Update URL params
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (selectedHairTypes.length) params.set("hair_type", selectedHairTypes.join(","))
      if (selectedLengths.length) params.set("length", selectedLengths.join(","))
      if (selectedColors.length) params.set("color", selectedColors.join(","))
      if (selectedDensities.length) params.set("density", selectedDensities.join(","))
      if (selectedLaceTypes.length) params.set("lace_type", selectedLaceTypes.join(","))
      if (priceRange[0] > minPrice) params.set("price_min", priceRange[0].toString())
      if (priceRange[1] < maxPrice) params.set("price_max", priceRange[1].toString())
      if (sortBy !== "featured") params.set("sort", sortBy)
      
      router.push(`/search/${collection}?${params}`, { scroll: false })
      
      // Fetch filtered products from server
      await fetchFilteredProducts()
    })
  }

  // Initial load from URL params
  useEffect(() => {
    const hasFilters = searchParams.toString().length > 0
    if (hasFilters) {
      fetchFilteredProducts()
    }
  }, [])

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const collectionTitle = collection
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <section className="py-10 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { title: "Home", href: "/" },
              { title: collectionTitle }
            ]} 
          />
        </div>

        <div className="mb-6">
          <h2 className="font-heading text-2xl lg:text-3xl">{collectionTitle}</h2>
        </div>
        
        <div className="grid grid-cols-[240px_1fr] gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-8">
            {/* Keywords Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Keywords
              </div>
              <Input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
              />
            </div>

            {/* Price Filter */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                  Price
                </span>
                <Label className="text-xs">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </Label>
              </div>
              <div className="*:not-first:mt-3">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  aria-label="Price range slider"
                />
              </div>
            </div>

            {/* Hair Type Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Hair Type
              </div>
              <div className="space-y-3">
                {hairTypes.map((item) => (
                  <div key={item.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`hair-${item.value}`}
                      checked={selectedHairTypes.includes(item.value)}
                      onCheckedChange={() =>
                        toggleFilter(item.value, selectedHairTypes, setSelectedHairTypes)
                      }
                    />
                    <Label htmlFor={`hair-${item.value}`} className="text-muted-foreground cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Length Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Length
              </div>
              <div className="space-y-3">
                {lengths.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox
                      id={`length-${item}`}
                      checked={selectedLengths.includes(item)}
                      onCheckedChange={() => toggleFilter(item, selectedLengths, setSelectedLengths)}
                    />
                    <Label htmlFor={`length-${item}`} className="text-muted-foreground cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Color
              </div>
              <div className="space-y-3">
                {colors.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox
                      id={`color-${item}`}
                      checked={selectedColors.includes(item)}
                      onCheckedChange={() => toggleFilter(item, selectedColors, setSelectedColors)}
                    />
                    <Label htmlFor={`color-${item}`} className="text-muted-foreground cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Density Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Density
              </div>
              <div className="space-y-3">
                {densities.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox
                      id={`density-${item}`}
                      checked={selectedDensities.includes(item)}
                      onCheckedChange={() => toggleFilter(item, selectedDensities, setSelectedDensities)}
                    />
                    <Label htmlFor={`density-${item}`} className="text-muted-foreground cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Lace Type Filter */}
            <div className="space-y-4">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                Lace Type
              </div>
              <div className="space-y-3">
                {laceTypes.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox
                      id={`lace-${item}`}
                      checked={selectedLaceTypes.includes(item)}
                      onCheckedChange={() => toggleFilter(item, selectedLaceTypes, setSelectedLaceTypes)}
                    />
                    <Label htmlFor={`lace-${item}`} className="text-muted-foreground cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Filters Button */}
            <Button onClick={handleFilterChange} disabled={isLoading} className="w-full">
              {isLoading ? "Applying..." : "Apply Filters"}
            </Button>
          </div>

          {/* Products Grid */}
          <div>
            <div className="mb-6">
              <p className="text-muted-foreground text-sm">
                {products.length} product{products.length !== 1 ? "s" : ""}
              </p>
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(price)
  }

  return (
    <Link href={`/product/${product.seo.handle}`} className="group">
      <figure className="relative aspect-9/16 w-full overflow-hidden object-cover">
        <Image
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          src={product.images[0]?.url || "/images/placeholder-product.jpg"}
          alt={product.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        {product.metadata?.new_arrival && (
          <Badge className="absolute left-2 top-2" variant="secondary">
            New
          </Badge>
        )}
      </figure>
      <div className="mt-3 space-y-1">
        <p className="font-medium truncate">{product.title}</p>
        <p className="text-muted-foreground">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
