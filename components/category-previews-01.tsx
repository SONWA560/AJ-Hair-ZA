import { getCollectionsWithImages, CollectionWithImage } from "@/lib/index";
import Link from "next/link";

export default async function CategoryPreviews() {
  let collections: CollectionWithImage[] = [];
  
  try {
    collections = await getCollectionsWithImages();
  } catch (error) {
    console.error("Error fetching collections:", error);
    // Return empty state if fetch fails
    return (
      <section className="py-10 lg:py-20">
        <div className="container mx-auto px-4">
          <header>
            <h2 className="font-heading text-3xl">Collections</h2>
          </header>
          <p className="mt-4 text-muted-foreground">
            Unable to load collections. Please refresh the page.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 lg:py-20">
      <div className="container mx-auto px-4">
        <header>
          <h2 className="font-heading text-3xl">Collections</h2>
        </header>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.handle} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionCard({ collection }: { collection: CollectionWithImage }) {
  return (
    <Link href={collection.path} className="group relative block">
      <img
        alt={collection.title}
        src={collection.image || "/images/placeholder-collection.jpg"}
        className="w-full object-cover transition-opacity group-hover:opacity-75 aspect-[4/3] rounded-lg"
      />
      <h3 className="text-muted-foreground mt-4 text-sm">
        <span className="absolute inset-0" />
        {collection.title}
      </h3>
      <p className="text-base font-semibold text-gray-900">{collection.description}</p>
    </Link>
  );
}
