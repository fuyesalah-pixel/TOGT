import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class PaymentService {
  PaymentService._();
  static final instance = PaymentService._();

  /// Opens the Chapa hosted checkout in the browser. Returns the transaction
  /// reference so the caller can verify it when the customer comes back, or
  /// null when the checkout could not be created/opened.
  Future<String?> payNow({required String requestId, required double amount, String? email}) async {
    // Release a previously-abandoned checkout first: the backend blocks a
    // second initialize while paymentId is set, which would dead-end every
    // retry with "A payment is already in progress".
    try {
      final state = await status(requestId: requestId);
      final pendingTx = state?['paymentId']?.toString();
      if (pendingTx != null && pendingTx.isNotEmpty) {
        await ApiService.instance.post('/payment/cancel/$pendingTx');
      }
    } catch (_) {
      // Cancel is best-effort; initialize below reports real problems.
    }
    final data = await ApiService.instance.post('/payment/initialize', body: {'requestId': requestId, 'amount': amount, 'currency': 'ETB'});
    final url = data is Map ? (data['checkout_url'] ?? data['checkoutUrl'])?.toString() : null;
    final tx = data is Map ? (data['transactionId'] ?? data['transaction_id'])?.toString() : null;
    if (url == null) return null;
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    return ok ? tx : null;
  }

  /// Asks the backend to re-verify the transaction against Chapa. A successful
  /// verify marks the request PAID server-side, so polling this after the
  /// customer returns from the browser is enough — no app restart needed.
  Future<String> verify({required String transactionId}) async {
    final data = await ApiService.instance.get('/payment/verify/$transactionId');
    return (data is Map ? data['status'] : null)?.toString() ?? 'pending';
  }

  /// Current payment state of a service request (paymentStatus, paymentId, …).
  Future<Map<String, dynamic>?> status({required String requestId}) async {
    final data = await ApiService.instance.get('/service-requests/$requestId/payment');
    return data is Map<String, dynamic> ? data : (data is Map ? Map<String, dynamic>.from(data) : null);
  }
}
