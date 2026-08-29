import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.instance.get('/notifications');
      if (mounted) setState(() => _items = data is List ? data : (data is Map ? (data['data'] ?? data['items'] ?? []) as List : []));
    } catch (e) { if (mounted) setState(() => _error = e.toString()); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _read(String id, int index) async {
    try {
      await ApiService.instance.patch('/notifications/$id/read');
      if (mounted) setState(() { final item = Map<String, dynamic>.from(_items[index] as Map); item['isRead'] = true; _items[index] = item; });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Notifications'), actions: [TextButton(onPressed: _items.isEmpty ? null : () async { await ApiService.instance.patch('/notifications/read-all'); _load(); }, child: const Text('Read all'))]),
    body: RefreshIndicator(
      color: TOGTColors.orange,
      onRefresh: _load,
      child: _loading ? const Center(child: CircularProgressIndicator()) : _error != null ? ListView(children: [Padding(padding: const EdgeInsets.all(28), child: Text('Unable to load notifications\n$_error', textAlign: TextAlign.center))]) : _items.isEmpty ? ListView(children: [Padding(padding: const EdgeInsets.all(40), child: Center(child: Text('No notifications yet.', style: TOGTTypography.body)))]) : ListView.separated(
        padding: const EdgeInsets.all(18),
        itemCount: _items.length,
        separatorBuilder: (_, index) => const SizedBox(height: 8),
        itemBuilder: (_, index) {
          final item = Map<String, dynamic>.from(_items[index] as Map);
          final read = item['isRead'] == true;
          return Card(color: read ? TOGTColors.white : TOGTColors.blue.withOpacity(.06), child: ListTile(onTap: read ? null : () => _read(item['id'].toString(), index), leading: Icon(read ? Icons.notifications_none : Icons.notifications_active, color: read ? TOGTColors.grey : TOGTColors.orange), title: Text((item['title'] ?? 'TOGT update').toString(), style: TOGTTypography.h3), subtitle: Text((item['message'] ?? '').toString()), trailing: read ? null : const Icon(Icons.circle, size: 9, color: TOGTColors.orange)));
        },
      ),
    ),
  );
}
