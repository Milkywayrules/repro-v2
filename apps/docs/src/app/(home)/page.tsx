import { env } from "@repro-v2/env/docs";
import Link from "next/link";

import { ApiRootWidget } from "@/components/api-root-widget";

export default function HomePage() {
  const showInternalApiLink = env.NEXT_PUBLIC_SHOW_INTERNAL_API_LINK;
  const openApiUrl = `${env.NEXT_PUBLIC_API_URL}/openapi/`;

  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 font-bold text-2xl">Hello World</h1>
      <p>
        You can open{" "}
        <Link className="font-medium underline" href={"/docs/" as const}>
          /docs
        </Link>{" "}
        and see the documentation.
      </p>
      <ApiRootWidget />
      {showInternalApiLink ? (
        <p className="mt-4 text-muted-foreground text-sm">
          Internal:{" "}
          <a
            className="font-medium underline"
            href={openApiUrl}
            rel="noopener"
            target="_blank"
          >
            OpenAPI spec
          </a>
        </p>
      ) : null}
    </div>
  );
}
