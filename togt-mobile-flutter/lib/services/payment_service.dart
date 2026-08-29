import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class PaymentService {
  PaymentService._();
  static final instance = PaymentService._();

  Future<bool> payNow({required String requestId, required double amount, required String email}) async {
    final data = await ApiService.instance.post('/payment/initialize', body: {'requestId': requestId, 'amount': amount, 'currency': 'ETB'});
    final url = data is Map ? (data['checkout_url'] ?? data['checkoutUrl'])?.toString() : null;
    return url != null && await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}
