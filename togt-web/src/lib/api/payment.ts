import { apiGet, apiPost } from "./client";
export function initializePayment(requestId: string, amount: number, currency = "ETB") { return apiPost<{ checkoutUrl: string; transactionId: string }>("/payment/initialize", { requestId, amount, currency }); }
export function verifyPayment(transactionId: string) { return apiGet<{ status: string }>(`/payment/verify/${encodeURIComponent(transactionId)}`); }
