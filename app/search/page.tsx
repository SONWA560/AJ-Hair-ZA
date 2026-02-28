import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getProducts } from "lib/firebase/firestore";
import { aiSearch } from "lib/search";

export const metadata = {
  title: "Search",
  description: "Search for products in the store.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { q: searchValue } = searchParams as { [key: string]: string };

  let products;
  let aiInterpretation: string | undefined;

  if (searchValue && searchValue.trim()) {
    const result = await aiSearch(searchValue.trim());
    products = result.products;
    aiInterpretation = result.aiInterpretation;
  } else {
    products = await getProducts();
  }

  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0 ? (
            <>
              There are no products that match{" "}
              <span className="font-bold">&quot;{searchValue}&quot;</span>
            </>
          ) : aiInterpretation ? (
            <span className="text-muted-foreground">{aiInterpretation}</span>
          ) : (
            <>
              {`Showing ${products.length} ${resultsText} for `}
              <span className="font-bold">&quot;{searchValue}&quot;</span>
            </>
          )}
        </p>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
    </>
  );
}
