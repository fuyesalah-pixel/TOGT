import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/payment_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../chat_screen.dart';

class RequestDetailScreen extends StatefulWidget {
  const RequestDetailScreen({super.key, required this.id});
  final String id;
  @override State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  Map<String, dynamic>? request;
  List<dynamic> history = [];
  String? error;
  String? _paymentError;
  bool _paying = false;

  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final results = await Future.wait([ApiService.instance.get('/service-requests'), ApiService.instance.get('/service-requests/${widget.id}/history')]);
      final raw = results[0] is Map ? (results[0]['data'] ?? []) : results[0];
      final items = raw is List ? raw : <dynamic>[];
      Map<String, dynamic>? found;
      for (final item in items.whereType<Map>()) { if (item['id']?.toString() == widget.id) { found = Map<String, dynamic>.from(item); break; } }
      if (found == null) throw Exception('Request not found');
      if (mounted) setState(() { request = found; history = results[1] is List ? results[1] as List : []; });
    } catch (e) { if (mounted) setState(() => error = e.toString()); }
  }

  /// Turns a raw backend/payment exception into text a customer can act on.
  /// The backend's "already in progress" message already carries retry
  /// guidance; everything else gets a friendly wrapper.
  String _paymentErrorMessage(Object e) {
    final raw = e.toString();
    final message = raw.startsWith('ApiException: ') ? raw.substring(15) : raw;
    if (message.contains('already in progress')) {
      return 'Your previous payment is still being processed.\n\nFinish that payment, or wait a few minutes and tap Pay Now again — the app will release it automatically. If you already paid, your request updates as soon as the bank confirms.';
    }
    if (message.contains('already paid')) return message;
    if (message.contains('Connection timed out') || message.contains('Network error')) {
      return 'We could not reach the payment service. Check your internet connection and try again.';
    }
    return 'Payment could not be started: $message\n\nYou can try again. If it keeps failing, contact TOGT support — we are happy to help.';
  }
  @override Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (error != null && request == null) return Scaffold(appBar: AppBar(title: Text(l10n.requestDetails)), body: Center(child: Text(l10n.failedLoad(l10n.requestDetails, error!), textAlign: TextAlign.center)));
    if (request == null) return Scaffold(appBar: AppBar(title: Text(l10n.requestDetails)), body: const Center(child: CircularProgressIndicator()));
    final r = request!; final type = (r['serviceType'] ?? 'Request').toString(); final status = (r['status'] ?? 'PENDING').toString(); final payment = (r['paymentStatus'] ?? 'UNPAID').toString().toUpperCase(); final details = (r['formData'] is Map ? Map<String, dynamic>.from(r['formData']) : <String, dynamic>{});
    // Only the staff-set amount is shown — never a guessed price.
    final amount = double.tryParse((r['amount'] ?? details['amount'] ?? details['price'] ?? '').toString());
    return Scaffold(appBar: AppBar(title: Text(l10n.requestDetails)), body: RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(18), children: [
      _card(Row(children: [CircleAvatar(backgroundColor: TOGTColors.blue, child: Icon(_icon(type), color: Colors.white)), const SizedBox(width: 12), Expanded(child: Text(type, style: Theme.of(context).textTheme.headlineSmall)), _badge(status)])),
      const SizedBox(height: 12),
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Package & request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), const SizedBox(height: 10), ...details.entries.where((e) => e.key != 'packageId').take(8).map((e) => Padding(padding: const EdgeInsets.only(bottom: 5), child: Text('${e.key}: ${e.value}')))])),
      const SizedBox(height: 12),
      _paymentCard(r, payment, amount),
      const SizedBox(height: 12),
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Progress timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), const SizedBox(height: 10), if (history.isEmpty) const Text('No progress updates yet.') else ...history.map((item) { final h = item as Map; return ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.check_circle, color: TOGTColors.green), title: Text('${h['statusFrom'] ?? 'Created'} → ${h['statusTo'] ?? 'Updated'}'), subtitle: Text('${h['changedBy']?['fullName'] ?? h['changedByName'] ?? ''}\n${h['notes'] ?? h['note'] ?? ''}\n${h['createdAt'] ?? ''}')); })])),
      const SizedBox(height: 12),
      FilledButton.icon(onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen(human: true))), icon: const Icon(Icons.support_agent), label: const Text('Contact support')),
    ])));
  }
  Widget _card(Widget child) => Card(color: TOGTColors.white, elevation: 2, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)), child: Padding(padding: const EdgeInsets.all(16), child: child));

  /// Customer view of payment: the price is set by our team only. Until then
  /// the customer sees a clear "please wait" state — no amount entry.
  Widget _paymentCard(Map<String, dynamic> r, String payment, double? amount) => _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
    const SizedBox(height: 10),
    if (_paymentError != null) ...[
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: TOGTColors.red.withValues(alpha: .07), borderRadius: BorderRadius.circular(14), border: Border.all(color: TOGTColors.red.withValues(alpha: .35))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [Icon(Icons.error_outline_rounded, color: TOGTColors.red, size: 20), SizedBox(width: 8), Text('Payment problem', style: TextStyle(fontWeight: FontWeight.bold, color: TOGTColors.red))]),
          const SizedBox(height: 6),
          Text(_paymentError!, style: TOGTTypography.small.copyWith(color: TOGTColors.navy, height: 1.5)),
        ]),
      ),
      const SizedBox(height: 12),
    ],
    if (amount != null) Text('Amount: ${amount.toStringAsFixed(0)} ${r['currency'] ?? 'ETB'}'),
    const SizedBox(height: 6),
    _badge(payment),
    if (payment == 'UNPAID' && amount == null) ...[
      const SizedBox(height: 10),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: TOGTColors.orange.withOpacity(.07), borderRadius: BorderRadius.circular(14), border: Border.all(color: TOGTColors.orange.withOpacity(.3))),
        child: Row(children: [
          const Icon(Icons.hourglass_top_rounded, color: TOGTColors.orange),
          const SizedBox(width: 12),
          Expanded(child: Text(AppLocalizations.of(context).paymentNotSetYet, style: TOGTTypography.body.copyWith(color: TOGTColors.navy))),
        ]),
      ),
    ],
    if (payment == 'PAID' && r['paymentId'] != null) Text('Transaction: ${r['paymentId']}\n${r['paidAt'] ?? ''}'),
    if (payment == 'UNPAID' && amount != null && amount > 0) Padding(padding: const EdgeInsets.only(top: 12), child: SizedBox(width: double.infinity, child: FilledButton.icon(
      style: FilledButton.styleFrom(backgroundColor: TOGTColors.orange, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 15)),
      onPressed: _paying ? null : () async {
        setState(() { _paying = true; _paymentError = null; });
        try {
          final tx = await PaymentService.instance.payNow(requestId: widget.id, amount: amount);
          if (tx == null) { if (mounted) setState(() => _paymentError = 'We could not open the payment page. Check your internet connection and tap Pay Now again. If it keeps failing, contact TOGT support.'); return; }
          // The customer pays in the browser; the backend confirms through
          // Chapa's callback/webhook. Poll the verify endpoint briefly so the
          // card flips to PAID by itself when they return after paying —
          // no app restart, no manual refresh.
          for (var attempt = 0; attempt < 5; attempt++) {
            await Future.delayed(const Duration(seconds: 3));
            final result = await PaymentService.instance.verify(transactionId: tx);
            if (result.toLowerCase() == 'success') break;
          }
          await _load();
        } catch (e) {
          if (mounted) setState(() => _paymentError = _paymentErrorMessage(e));
        } finally {
          if (mounted) setState(() => _paying = false);
        }
      },
      icon: _paying ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.payment),
      label: Text('Pay Now - ${amount.toStringAsFixed(0)} ${r['currency'] ?? 'ETB'}'),
    ))),
  ]));
  Widget _badge(String value) => Chip(label: Text(value), backgroundColor: value == 'PAID' || value == 'COMPLETED' ? Colors.green.withOpacity(.15) : TOGTColors.orange.withOpacity(.15));
  IconData _icon(String type) => type == 'UMRAH' ? Icons.mosque : type == 'TICKET' ? Icons.flight : type == 'VISA' ? Icons.badge : Icons.travel_explore;
}
