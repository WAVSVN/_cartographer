import { Suspense } from "react";
import OpsConsole from "@/components/OpsConsole";
import { Skeleton } from "@/components/ui";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <OpsConsole />
    </Suspense>
  );
}
