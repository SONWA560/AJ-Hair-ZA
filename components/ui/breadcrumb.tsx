"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode
  items?: {
    title: string
    href?: string
  }[]
}

function Breadcrumb({
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  items,
  ...props
}: BreadcrumbProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || pathname.split("/").filter(Boolean).map((path, index) => {
    const href = "/" + pathname.split("/").filter(Boolean).slice(0, index + 1).join("/")
    const title = path
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    
    return {
      title: title,
      href: index < pathname.split("/").filter(Boolean).length - 1 ? href : undefined
    }
  })

  return (
    <nav
      className={cn("flex", className)}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="inline-flex items-center gap-1.5">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Link>
        </li>
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            <span className="mx-1.5 text-muted-foreground">{separator}</span>
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
