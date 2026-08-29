import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../services/document_service.dart';
import '../../services/payment_service.dart';
import '../../theme/colors.dart';
import '../chat_screen.dart';

class RequestDetailScreen extends StatefulWidget {
  const RequestDetailScreen({super.key, required this.id});
  final String id;
  @override State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  Map<String, dynamic>? request;
  List<dynamic> history = [];
  List<String> uploads = [];
  String? error;
  bool uploading = false;

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
  Future<void> _upload() async {
    if (uploads.length >= 5) return;
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image == null) return;
    if (await File(image.path).length() > 10 * 1024 * 1024) { if (mounted) setState(() => error = 'Each file must be smaller than 10MB.'); return; }
    setState(() { uploading = true; error = null; });
    try { final url = await DocumentService.instance.uploadPath(image.path, folder: 'service-requests'); if (url != null && mounted) setState(() => uploads.add(url)); } catch (e) { if (mounted) setState(() => error = 'Upload failed: $e'); } finally { if (mounted) setState(() => uploading = false); }
  }
  @override Widget build(BuildContext context) {
    if (error != null && request == null) return Scaffold(appBar: AppBar(title: const Text('Request Details')), body: Center(child: Text('Unable to load request\n$error', textAlign: TextAlign.center)));
    if (request == null) return Scaffold(appBar: AppBar(title: const Text('Request Details')), body: const Center(child: CircularProgressIndicator()));
    final r = request!; final type = (r['serviceType'] ?? 'Request').toString(); final status = (r['status'] ?? 'PENDING').toString(); final payment = (r['paymentStatus'] ?? 'UNPAID').toString(); final details = (r['formData'] is Map ? Map<String, dynamic>.from(r['formData']) : <String, dynamic>{});
    return Scaffold(appBar: AppBar(title: const Text('Request Details')), body: RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(18), children: [
      _card(Row(children: [CircleAvatar(backgroundColor: TOGTColors.blue, child: Icon(_icon(type), color: Colors.white)), const SizedBox(width: 12), Expanded(child: Text(type, style: Theme.of(context).textTheme.headlineSmall)), _badge(status)])),
      const SizedBox(height: 12),
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Package & request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), const SizedBox(height: 10), ...details.entries.where((e) => e.key != 'packageId').take(8).map((e) => Padding(padding: const EdgeInsets.only(bottom: 5), child: Text('${e.key}: ${e.value}')))])),
      const SizedBox(height: 12),
      _paymentCard(r, payment, details),
      const SizedBox(height: 12),
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Progress timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), const SizedBox(height: 10), if (history.isEmpty) const Text('No progress updates yet.') else ...history.map((item) { final h = item as Map; return ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.check_circle, color: TOGTColors.green), title: Text('${h['statusFrom'] ?? 'Created'} → ${h['statusTo'] ?? 'Updated'}'), subtitle: Text('${h['changedBy']?['fullName'] ?? h['changedByName'] ?? ''}\n${h['notes'] ?? h['note'] ?? ''}\n${h['createdAt'] ?? ''}')); })])),
      const SizedBox(height: 12),
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Documents', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        ...uploads.map((url) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.insert_drive_file),
          title: Text(url.split('/').last, maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: IconButton(onPressed: () => setState(() => uploads.remove(url)), icon: const Icon(Icons.delete_outline)),
        )),
        OutlinedButton.icon(onPressed: uploading ? null : _upload, icon: const Icon(Icons.upload_file), label: Text(uploading ? 'Uploading...' : 'Upload document')),
      ])),
      const SizedBox(height: 12),
      FilledButton.icon(onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen(human: true))), icon: const Icon(Icons.support_agent), label: const Text('Contact support')),
    ])));
  }
  Widget _card(Widget child) => Card(color: TOGTColors.white, elevation: 2, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)), child: Padding(padding: const EdgeInsets.all(16), child: child));
  Widget _paymentCard(Map<String, dynamic> r, String payment, Map<String, dynamic> details) => _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
    const SizedBox(height: 10),
    Text('Amount: ${r['amount'] ?? details['amount'] ?? 'Not set'} ${r['currency'] ?? 'ETB'}'),
    const SizedBox(height: 6),
    _badge(payment),
    if (payment == 'PAID' && r['paymentId'] != null) Text('Transaction: ${r['paymentId']}\n${r['paidAt'] ?? ''}'),
    if (payment == 'UNPAID' && r['amount'] is num) Padding(padding: const EdgeInsets.only(top: 12), child: SizedBox(width: double.infinity, child: FilledButton.icon(
      style: FilledButton.styleFrom(backgroundColor: TOGTColors.orange, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 15)),
      onPressed: () async { final opened = await PaymentService.instance.payNow(requestId: widget.id, amount: (r['amount'] as num).toDouble()); if (!opened && mounted) setState(() => error = 'Could not open Chapa checkout.'); },
      icon: const Icon(Icons.payment), label: Text('Pay Now - ${(r['amount'] as num).toStringAsFixed(0)} ${r['currency'] ?? 'ETB'}'),
    ))),
  ]));
  Widget _badge(String value) => Chip(label: Text(value), backgroundColor: value == 'PAID' || value == 'COMPLETED' ? Colors.green.withOpacity(.15) : TOGTColors.orange.withOpacity(.15));
  IconData _icon(String type) => type == 'UMRAH' ? Icons.mosque : type == 'TICKET' ? Icons.flight : type == 'VISA' ? Icons.badge : Icons.travel_explore;
}
