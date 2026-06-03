import { env } from "../../config/env";

type EvolutionRequestOptions = {
  path: string;
  body?: unknown;
};

function resolveEvolutionApiKey() {
  return (
    env.evolutionApiKey ||
    env.evolutionInstanceKey ||
    ""
  );
}

export async function evolutionGet<T = unknown>(
  path: string
): Promise<T | null> {

  const apikey =
    resolveEvolutionApiKey();

  const response = await fetch(
    `${env.evolutionApiUrl}${path}`,
    {
      method: "GET",
      headers: {
        apikey,
      },
    }
  );

  if (!response.ok) {
    console.error(
      "Evolution API erro:",
      path,
      response.status
    );

    return null;
  }

  return response.json() as Promise<T>;
}

export async function evolutionRequest<T = unknown>(
  options: EvolutionRequestOptions
): Promise<T | null> {

  const apikey =
    resolveEvolutionApiKey();

  const response = await fetch(
    `${env.evolutionApiUrl}${options.path}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        apikey,
      },

      body: JSON.stringify(
        options.body ?? {}
      ),
    }
  );

  if (!response.ok) {
    console.error(
      "Evolution API erro:",
      options.path,
      response.status
    );

    return null;
  }

  return response.json() as Promise<T>;
}

export async function evolutionDelete<T = unknown>(
  path: string
): Promise<T | null> {

  const apikey =
    resolveEvolutionApiKey();

  const response = await fetch(
    `${env.evolutionApiUrl}${path}`,
    {
      method: "DELETE",
      headers: {
        apikey,
      },
    }
  );

  if (!response.ok) {
    console.error(
      "Evolution API erro:",
      path,
      response.status
    );

    return null;
  }

  return response.json() as Promise<T>;
}

export function getEvolutionApiKey() {

  return resolveEvolutionApiKey();
}

export function getEvolutionInstance() {

  return env.evolutionInstance;
}
