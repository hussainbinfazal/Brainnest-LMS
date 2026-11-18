import axios, { type AxiosResponse } from "axios";
import { logger } from "../logger/logger";

type WorkerJobOptions = {
  baseUrl?: string;
  method?: "post" | "delete";
  timeout?: number;
};

export async function passJobToWorker(
  path: string,
  body: Record<string, unknown>,
  options: WorkerJobOptions = {}
): Promise<AxiosResponse<unknown>> {
  const workerUrl = options.baseUrl ?? process.env.WORKER_URL;
  const internalSecret = process.env.INTERNAL_AUTH_SECRET;
  if (!workerUrl || !internalSecret) {
    throw new Error(
      "WORKER_URL and INTERNAL_AUTH_SECRET must be configured"
    );
  }

  const endpoint = `${workerUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  const config = {
    headers: { "x-internal-secret": internalSecret },
    timeout: options.timeout ?? 10_000,
  };
  const response =
    options.method === "delete"
      ? await axios.delete(endpoint, { ...config, data: body })
      : await axios.post(endpoint, body, config);

  logger.info("Worker job queued", {
    path,
    status: response.status,
  });
  return response;
}