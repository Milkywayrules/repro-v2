"use client";

import {
  formatTreatyError,
  rootQueryOptions,
} from "@repro-v2/api-client/queries";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function ApiRootWidget() {
  const { data, isPending, isError, error } = useQuery(
    rootQueryOptions(apiClient),
  );

  return (
    <section className="mx-auto mt-6 max-w-lg rounded-lg border p-4 text-left text-sm">
      <h2 className="mb-2 font-medium">Live API — GET /</h2>
      {isPending ? <p className="text-muted-foreground">Fetching…</p> : null}
      {isError ? (
        <p className="text-destructive">
          {formatTreatyError(error, "Request failed")}
        </p>
      ) : null}
      {data && !isError ? (
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
