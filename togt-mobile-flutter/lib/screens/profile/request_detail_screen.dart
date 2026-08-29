import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class RequestDetailScreen extends StatefulWidget {
  const RequestDetailScreen({super.key, required this.id});
  final String id;
  @override State<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends State<RequestDetailScreen> {
  dynamic request;
  List<dynamic> history = [];
  String? error;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final results = await Future.wait([ApiService.instance.get('/service-requests/${widget.id}'), ApiService.instance.get('/service-requests/${widget.id}/history')]);
      if (mounted) setState(() { request = results[0]; history = results[1] is List ? results[1] as List : []; });
    } catch (e) { if (mounted) setState(() => error = e.toString()); }
  }
  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Request Progress')), body: error != null ? Center(child: Text('Unable to load request\n$error', textAlign: TextAlign.center)) : request == null ? const Center(child: CircularProgressIndicator()) : RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(20), children: [Text((request['serviceType'] ?? request['type'] ?? 'Request').toString(), style: Theme.of(context).textTheme.headlineSmall), const SizedBox(height: 8), Chip(label: Text((request['status'] ?? 'PENDING').toString())), const SizedBox(height: 24), const Text('Progress timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)), const SizedBox(height: 12), if (history.isEmpty) const Text('No progress updates yet.') else ...history.map((item) { final map = item as Map; return ListTile(isThreeLine: true, leading: const Icon(Icons.check_circle_outline), title: Text((map['statusTo'] ?? map['status'] ?? 'Updated').toString()), subtitle: Text('${map['note'] ?? map['reason'] ?? ''}\n${map['createdAt'] ?? ''}')); })])));
}
