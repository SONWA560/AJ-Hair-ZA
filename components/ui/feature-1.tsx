import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface Feature1Props {
  title: string
  description?: string
  imageSrc?: string
  imageAlt?: string
  buttonPrimary?: {
    label: string
    href: string
  }
  buttonSecondary?: {
    label: string
    href: string
  }
}

export function Feature1({
  title = "Premium Quality Wigs",
  description = "Discover our collection of premium quality wigs, crafted with the finest materials for a natural look and comfortable fit.",
  imageSrc,
  imageAlt = "Feature image",
  buttonPrimary = {
    label: "Shop Now",
    href: "/search/straight-hair",
  },
  buttonSecondary = {
    label: "Learn More",
    href: "/search",
  },
}: Feature1Props) {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              {title}
            </h1>
            <p className="mb-8 max-w-xl text-muted-foreground lg:text-lg">
              {description}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href={buttonPrimary.href}>
                  {buttonPrimary.label}
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href={buttonSecondary.href}>
                  {buttonSecondary.label}
                </Link>
              </Button>
            </div>
          </div>
          {imageSrc && (
            <div className="relative aspect-square w-full max-w-md mx-auto lg:max-w-full">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
