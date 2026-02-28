import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need to be a member of the{" "}
            <span className="font-semibold text-foreground">AJ Hair ZA</span>{" "}
            organisation to access the admin area.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you believe this is a mistake, contact your administrator.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in with a different account</Link>
          </Button>
          <Button asChild>
            <Link href="/">Go to store</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
