import { createApiClient } from "@repro-v2/api-client";
import { env } from "@repro-v2/env/docs";

export const apiClient = createApiClient(env.NEXT_PUBLIC_API_URL);
