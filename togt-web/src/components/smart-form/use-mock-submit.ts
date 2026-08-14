"use client";

import { useState } from "react";

/**
 * Mock submit handler for the Smart Form (Phase 1).
 * Simulates a network request. Will be replaced with a real call to
 * `POST /api/service-requests` (or the service-specific endpoint) once the
 * NestJS backend is wired up (Phase 2). See docs/api-endpoints.md.
 */
export function useMockSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function submit(serviceType: string, payload: Record<string, unknown>) {
    setIsSubmitting(true);
    setIsSuccess(false);
    // eslint-disable-next-line no-console
    console.log(`[SmartForm mock submit] service_type=${serviceType}`, payload);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);
    setIsSuccess(true);
  }

  function reset() {
    setIsSuccess(false);
  }

  return { submit, isSubmitting, isSuccess, reset };
}
