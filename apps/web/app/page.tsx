import { Suspense } from "react";
import OpsConsole from "@/components/OpsConsole";
import { Skeleton } from "@/components/ui";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-4">
          <Skeleton className="h-32 w-full max-w-md" />
        </div>
      }
    >
      <div className="h-full">
        <OpsConsole />
      </div>
    </Suspense>
  );
}
