import { Suspense } from "react";
import { ExecutionView } from "@/src/features/execution/ExecutionView";

export default function ExecutionPage() {
  return (
    <Suspense fallback={null}>
      <ExecutionView />
    </Suspense>
  );
}
