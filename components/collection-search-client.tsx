"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { SlidersHorizontal, X } from "lucide-react"

import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { filterProducts } from "@/lib/actions"
import type { Product, ProductFilters } from "@/lib/types"
import { cn } from "@/lib/utils"
import Grid from "components/grid"
import ProductGridItems from "components/layout/product-grid-items"

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
  const [filtersOpen, setFiltersOpen] = useState(false)

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

      await fetchFilteredProducts()
    })
  }

  // Initial load from URL params
  useEffect(() => {
    const hasFilters = searchParams.toString().length > 0
    if (hasFilters) {
      fetchFilteredProducts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // suppress unused warning — sortBy setter kept for future sort UI
  void setSortBy
  void isPending

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

        {/* Mobile filter toggle button — hidden on md+ */}
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Mobile backdrop */}
        {filtersOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setFiltersOpen(false)}
          />
        )}

        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-8">
          {/* Filters — slide-in drawer on mobile, static sidebar on md+ */}
          <div
            className={cn(
              // Mobile: fixed drawer sliding in from the left
              "fixed left-0 top-0 z-50 h-full w-72 overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out dark:bg-neutral-900",
              filtersOpen ? "translate-x-0" : "-translate-x-full",
              // Desktop: reset to normal document flow
              "md:relative md:top-auto md:z-auto md:h-auto md:w-auto md:translate-x-0 md:overflow-visible md:bg-transparent md:p-0 md:shadow-none md:dark:bg-transparent",
              "space-y-8"
            )}
          >
            {/* Drawer header with close button — mobile only */}
            <div className="flex items-center justify-between md:hidden">
              <span className="text-sm font-semibold">Filters</span>
              <button
                onClick={() => setFiltersOpen(false)}
                className="rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
              <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <ProductGridItems products={products} />
              </Grid>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
