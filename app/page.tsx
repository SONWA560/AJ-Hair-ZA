import Footer from "components/layout/footer";
import { PromoBannerThree } from "components/commercn/promo-banners/promo-banner-03";
import CategoryPreviews from "components/category-previews-01";
import { Feature1 } from "@/components/ui/feature-1";

export const metadata = {
  description:
    "AJ Hair ZA - Premium quality wigs in South Africa. Discover our collection of natural-looking wigs.",
  openGraph: {
    type: "website",
  },
};

// Error boundary for the homepage
export default function HomePage() {
  return (
    <>
      <PromoBannerThree />
      <Feature1 
        title="AJ Hair ZA"
        description="Discover our premium collection of natural-looking wigs. Quality hair products crafted for confidence and comfort."
        imageSrc="/images/AJ.png"
        imageAlt="AJ Hair ZA - Premium Wigs South Africa"
      />
      <CategoryPreviews />
      <Footer />
    </>
  );
}
