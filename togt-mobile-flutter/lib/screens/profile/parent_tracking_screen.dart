import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../services/api_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Customer-side live tracking with a real in-app map (OpenStreetMap tiles via
/// flutter_map — no external maps app, no API key). Shows the traveler's
/// status (SAFE / WARNING / DANGER / OFFLINE), live distance to the guide and
/// both positions as markers on the map, refreshed automatically every 20s.
/// Data comes from GET /tracking/search (the API tracks the signed-in
/// customer's own group), identical to the web dashboard.
class ParentTrackingScreen extends StatefulWidget {
  const ParentTrackingScreen({super.key});

  @override
  State<ParentTrackingScreen> createState() => _ParentTrackingScreenState();
}

class _ParentTrackingScreenState extends State<ParentTrackingScreen> {
  Map<String, dynamic>? tracking;
  String? message;
  bool loading = true;
  bool _following = true;
  Timer? _poll;
  final MapController _map = MapController();

  LatLng? _memberPoint;
  LatLng? _guidePoint;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 20), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  LatLng? _toPoint(dynamic location) {
    if (location is! Map) return null;
    final lat = (location['latitude'] as num?)?.toDouble();
    final lng = (location['longitude'] as num?)?.toDouble();
    if (lat == null || lng == null) return null;
    return LatLng(lat, lng);
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) setState(() { loading = true; message = null; });
    try {
      final data = await ApiService.instance.get('/tracking/search', query: {'query': ''});
      if (!mounted) return;
      final map = data is Map ? Map<String, dynamic>.from(data) : null;
      final member = _toPoint(map?['memberLocation']);
      final guide = _toPoint(map?['guideLocation']);
      setState(() {
        tracking = map;
        _memberPoint = member;
        _guidePoint = guide;
        message = null;
        loading = false;
      });
      // Keep the camera on the traveler until the user pans manually.
      if (member != null && _following) {
        _map.move(member, _map.camera.zoom);
      }
    } catch (e) {
      final notActive = e.toString().contains('Member not found') || e.toString().contains('not found');
      if (!mounted) return;
      setState(() {
        tracking = null;
        _memberPoint = null;
        _guidePoint = null;
        message = notActive
            ? 'Tracking is not active yet. It turns on automatically once your team\u2019s trip starts (team A-number must be marked in progress).'
            : e.toString();
        loading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'SAFE': return TOGTColors.green;
      case 'WARNING': return const Color(0xFFF59E0B);
      case 'DANGER': return const Color(0xFFDC2626);
      default: return TOGTColors.grey;
    }
  }

  String _statusText(String status) {
    switch (status.toUpperCase()) {
      case 'SAFE': return 'With guide';
      case 'WARNING': return 'Drifting from guide';
      case 'DANGER': return 'Separated from guide';
      default: return 'Signal offline';
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'SAFE': return Icons.verified_user_rounded;
      case 'WARNING': return Icons.warning_amber_rounded;
      case 'DANGER': return Icons.error_rounded;
      default: return Icons.wifi_off_rounded;
    }
  }

  String _formatDistance(num? meters) {
    if (meters == null) return '—';
    return meters > 1000 ? '${(meters / 1000).toStringAsFixed(1)} km' : '${meters.round()} m';
  }

  @override
  Widget build(BuildContext context) {
    final status = (tracking?['status'] ?? '').toString();
    final distance = tracking?['distance'] is num ? tracking!['distance'] as num : null;
    final lastUpdated = tracking?['lastUpdated']?.toString();
    final hasMap = _memberPoint != null || _guidePoint != null;
    final initialCenter = _memberPoint ?? _guidePoint ?? const LatLng(21.4225, 39.8262);
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Tracking')),
      body: loading && tracking == null && message == null
          ? const Center(child: CircularProgressIndicator(color: TOGTColors.orange))
          : RefreshIndicator(
              color: TOGTColors.orange,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
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
                    // Status banner.
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withOpacity(.08),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: _statusColor(status).withOpacity(.35)),
                      ),
                      child: Row(children: [
                        Icon(_statusIcon(status), color: _statusColor(status), size: 30),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text((tracking!['memberName'] ?? 'Traveler').toString(), style: TOGTTypography.h2),
                            const SizedBox(height: 2),
                            Text(
                              '${_statusText(status)} · ${_formatDistance(distance)} from guide',
                              style: TOGTTypography.small.copyWith(color: _statusColor(status), fontWeight: FontWeight.w700),
                            ),
                            if ((tracking!['groupName'] ?? '').toString().isNotEmpty)
                              Text('Group: ${tracking!['groupName']}', style: TOGTTypography.small),
                          ]),
                        ),
                      ]),
                    ),
                    const SizedBox(height: 12),
                    // In-app live map.
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: SizedBox(
                        height: 340,
                        child: hasMap
                            ? Stack(children: [
                                FlutterMap(
                                  mapController: _map,
                                  options: MapOptions(
                                    initialCenter: initialCenter,
                                    initialZoom: 14,
                                    // Any user-driven camera change stops follow mode.
                                    onMapEvent: (event) {
                                      if (event.source != MapEventSource.mapController && _following) {
                                        _following = false;
                                      }
                                    },
                                  ),
                                  children: [
                                    TileLayer(
                                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                      userAgentPackageName: 'com.togt.travel',
                                    ),
                                    MarkerLayer(markers: [
                                      if (_guidePoint != null)
                                        Marker(
                                          point: _guidePoint!,
                                          width: 56,
                                          height: 56,
                                          alignment: Alignment.topCenter,
                                          child: _pin(icon: Icons.route_rounded, color: TOGTColors.blue, label: 'Guide'),
                                        ),
                                      if (_memberPoint != null)
                                        Marker(
                                          point: _memberPoint!,
                                          width: 56,
                                          height: 56,
                                          alignment: Alignment.topCenter,
                                          child: _pin(
                                            icon: Icons.person_pin_circle_rounded,
                                            color: _statusColor(status),
                                            label: (tracking?['memberName'] ?? 'Traveler').toString().split(' ').first,
                                          ),
                                        ),
                                    ]),
                                  ],
                                ),
                                Positioned(
                                  right: 10,
                                  top: 10,
                                  child: Column(children: [
                                    _mapButton(
                                      icon: _following ? Icons.my_location_rounded : Icons.location_searching_rounded,
                                      onTap: () {
                                        final target = _memberPoint ?? _guidePoint;
                                        if (target == null) return;
                                        setState(() => _following = true);
                                        _map.move(target, 14);
                                      },
                                    ),
                                    const SizedBox(height: 8),
                                    _mapButton(icon: Icons.refresh_rounded, onTap: () => _load(silent: true)),
                                  ]),
                                ),
                                if (lastUpdated != null)
                                  Positioned(
                                    left: 10,
                                    bottom: 10,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(color: Colors.white.withOpacity(.92), borderRadius: BorderRadius.circular(20)),
                                      child: Text(
                                        'Updated ${lastUpdated.replaceFirst('T', ' · ').split('.').first}',
                                        style: TOGTTypography.small.copyWith(color: TOGTColors.navy),
                                      ),
                                    ),
                                  ),
                              ])
                            : Container(
                                color: TOGTColors.grey.withOpacity(.12),
                                child: Center(
                                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                                    const Icon(Icons.location_off_rounded, color: TOGTColors.grey, size: 40),
                                    const SizedBox(height: 8),
                                    Text('Waiting for the first location…', style: TOGTTypography.body),
                                  ]),
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Latest readings under the map.
                    _readingTile(
                      icon: Icons.person_pin_circle_rounded,
                      color: _statusColor(status),
                      title: 'Traveler location',
                      location: tracking?['memberLocation'],
                    ),
                    const SizedBox(height: 8),
                    _readingTile(
                      icon: Icons.route_rounded,
                      color: TOGTColors.blue,
                      title: 'Guide location',
                      location: tracking?['guideLocation'],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Live every 20 seconds while this screen is open — the map works fully inside the app.',
                      textAlign: TextAlign.center,
                      style: TOGTTypography.small.copyWith(color: TOGTColors.grey),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _pin({required IconData icon, required Color color, required String label}) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withOpacity(.4), blurRadius: 8)]),
            child: Icon(icon, color: TOGTColors.white, size: 22),
          ),
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: Colors.white.withOpacity(.95), borderRadius: BorderRadius.circular(8)),
            child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: TOGTColors.navy)),
          ),
        ],
      );

  Widget _mapButton({required IconData icon, required VoidCallback onTap}) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(color: Colors.white.withOpacity(.95), borderRadius: BorderRadius.circular(12), boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)]),
          child: Icon(icon, size: 20, color: TOGTColors.navy),
        ),
      );

  Widget _readingTile({required IconData icon, required Color color, required String title, required dynamic location}) {
    final lat = location is Map ? (location['latitude'] as num?)?.toDouble() : null;
    final lng = location is Map ? (location['longitude'] as num?)?.toDouble() : null;
    final name = location is Map ? location['name']?.toString() ?? '' : '';
    return Card(
      color: TOGTColors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(lat == null ? Icons.location_off_rounded : icon, color: lat == null ? TOGTColors.grey : color),
        title: Text(title, style: TOGTTypography.h3),
        subtitle: Text(
          lat == null
              ? 'No location shared yet'
              : (name.isNotEmpty ? '$name · ${lat.toStringAsFixed(5)}, ${lng?.toStringAsFixed(5) ?? '—'}' : '${lat.toStringAsFixed(5)}, ${lng?.toStringAsFixed(5) ?? '—'}'),
          style: TOGTTypography.small,
        ),
      ),
    );
  }
}
