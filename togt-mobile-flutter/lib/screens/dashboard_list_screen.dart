import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'profile/request_detail_screen.dart';

class DashboardListScreen extends StatefulWidget {
  const DashboardListScreen({super.key, required this.title, required this.endpoint});
  final String title;
  final String endpoint;
  @override
  State<DashboardListScreen> createState() => _DashboardListScreenState();
}

class _DashboardListScreenState extends State<DashboardListScreen> {
  dynamic _data;
  String? _error;
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try { final data = await ApiService.instance.get(widget.endpoint); if (mounted) setState(() => _data = data); }
    catch (e) { if (mounted) setState(() => _error = e.toString()); }
  }
  @override
  Widget build(BuildContext context) { final l10n = AppLocalizations.of(context); return Scaffold(appBar: AppBar(title: Text(widget.title)), body: RefreshIndicator(color: TOGTColors.orange, onRefresh: _load, child: _error != null ? ListView(children: [Padding(padding: const EdgeInsets.all(28), child: Text(l10n.failedLoad(widget.title.toLowerCase(), _error!), textAlign: TextAlign.center))]) : _data == null ? const Center(child: CircularProgressIndicator()) : _body())); }
  Widget _body() {
    final items = _data is List ? _data as List : (_data is Map ? ((_data['data'] ?? _data['items'] ?? []) as List) : <dynamic>[]);
    final l10n = AppLocalizations.of(context); if (items.isEmpty) return ListView(children: [Padding(padding: const EdgeInsets.all(40), child: Center(child: Text(l10n.noItems(widget.title.toLowerCase()), style: TOGTTypography.body))) ]);
    return ListView.separated(padding: const EdgeInsets.all(18), itemCount: items.length, separatorBuilder: (_, __) => const SizedBox(height: 10), itemBuilder: (_, i) { final item = items[i] is Map ? items[i] as Map : <dynamic, dynamic>{}; final title = item['title'] ?? item['serviceType'] ?? item['type'] ?? l10n.toctItem; final status = item['status'] ?? item['paymentStatus'] ?? l10n.active; return Card(child: ListTile(onTap: item['id'] == null ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => RequestDetailScreen(id: item['id'].toString()))), leading: const CircleAvatar(backgroundColor: TOGTColors.blue, child: Icon(Icons.receipt_long_rounded, color: TOGTColors.white)), title: Text(title.toString(), style: TOGTTypography.h3), subtitle: Text(item['createdAt']?.toString().split('T').first ?? l10n.statusDetails), trailing: Chip(label: Text(status.toString()), backgroundColor: TOGTColors.orange.withOpacity(.15)))); });
  }
}
