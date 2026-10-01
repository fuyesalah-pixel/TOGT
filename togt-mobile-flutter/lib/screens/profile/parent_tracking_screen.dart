import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Customer-side live tracking: shows the traveler's status inside their
/// active team (SAFE / WARNING / DANGER / OFFLINE), distance to the guide and
/// the guide's latest position, with a map hand-off. Data comes from
/// GET /tracking/search (the API tracks the signed-in customer's own group).
class ParentTrackingScreen extends StatefulWidget {
  const ParentTrackingScreen({super.key});

  @override
  State<ParentTrackingScreen> createState() => _ParentTrackingScreenState();
}

class _ParentTrackingScreenState extends State<ParentTrackingScreen> {
  Map<String, dynamic>? tracking;
  String? message;
  bool loading = true;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) setState(() { loading = true; message = null; });
    try {
      final data = await ApiService.instance.get('/tracking/search', query: {'query': ''});
      if (mounted) setState(() { tracking = data is Map ? Map<String, dynamic>.from(data) : null; message = null; loading = false; });
    } catch (e) {
      final notActive = e.toString().contains('Member not found') || e.toString().contains('not found');
      if (mounted) {
        setState(() {
          tracking = null;
          message = notActive
              ? 'Tracking is not active yet. It turns on automatically once your team\u2019s trip starts (team A-number must be marked in progress).'
              : e.toString();
          loading = false;
        });
      }
    }
  }

  Future<void> _openInMaps(double? lat, double? lng) async {
    if (lat == null || lng == null) return;
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    try { await launchUrl(uri, mode: LaunchMode.externalApplication); } catch (_) {}
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'SAFE': return TOGTColors.green;
      case 'WARNING': return const Color(0xFFF59E0B);
      case 'DANGER': return const Color(0xFFDC2626);
      default: return TOGTColors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Tracking')),
      body: RefreshIndicator(
        color: TOGTColors.orange,
        onRefresh: _load,
        child: loading && tracking == null && message == null
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(18),
                children: [
                  if (message != null)
                    Card(
                      color: TOGTColors.orange.withOpacity(.06),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(children: [
                          const Icon(Icons.radar_rounded, color: TOGTColors.orange),
                          const SizedBox(width: 12),
                          Expanded(child: Text(message!, style: TOGTTypography.body)),
                        ]),
                      ),
                    )
                  else if (tracking != null) ...[
                    Card(
                      color: TOGTColors.white,
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text((tracking!['memberName'] ?? 'Traveler').toString(), style: TOGTTypography.h2)),
                            Chip(
                              label: Text((tracking!['status'] ?? 'UNKNOWN').toString(), style: TOGTTypography.small.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                              backgroundColor: _statusColor((tracking!['status'] ?? '').toString()),
                            ),
                          ]),
                          const SizedBox(height: 6),
                          Text('Group: ${tracking!['groupName'] ?? '—'}', style: TOGTTypography.small),
                          if (tracking!['distance'] is num)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text('Distance to guide: ${(tracking!['distance'] as num).toStringAsFixed(0)} m', style: TOGTTypography.small),
                            ),
                          if (tracking!['lastUpdated'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text('Last update: ${tracking!['lastUpdated']}'.replaceFirst('T', ' · ').split('.').first, style: TOGTTypography.small),
                            ),
                        ]),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _locationCard('Guide location', tracking!['guideLocation'] is Map ? Map<String, dynamic>.from(tracking!['guideLocation'] as Map) : null),
                    const SizedBox(height: 12),
                    _locationCard('Traveler location', tracking!['memberLocation'] is Map ? Map<String, dynamic>.from(tracking!['memberLocation'] as Map) : null),
                    const SizedBox(height: 16),
                    Text('Live updates every 30 seconds — keep this screen open during the trip.', style: TOGTTypography.small.copyWith(color: TOGTColors.grey)),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _locationCard(String title, Map<String, dynamic>? location) {
    final lat = (location?['latitude'] as num?)?.toDouble();
    final lng = (location?['longitude'] as num?)?.toDouble();
    final name = location?['name']?.toString();
    return Card(
      color: TOGTColors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Icon(lat == null ? Icons.location_off_rounded : Icons.location_on_rounded, color: lat == null ? TOGTColors.grey : TOGTColors.orange),
        title: Text(title, style: TOGTTypography.h3),
        subtitle: Text(lat == null ? 'No location shared yet' : (name != null && name.isNotEmpty ? '$name · ${lat.toStringAsFixed(5)}, ${lng?.toStringAsFixed(5) ?? '—'}' : '${lat.toStringAsFixed(5)}, ${lng?.toStringAsFixed(5) ?? '—'}'), style: TOGTTypography.small),
        trailing: lat == null
            ? null
            : TextButton(
                onPressed: () => _openInMaps(lat, lng),
                child: const Text('Open in Maps', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
      ),
    );
  }
}
