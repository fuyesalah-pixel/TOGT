import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Customer-side tracking, rebuilt around consent:
///  1. "Requests" section — incoming tracking requests to accept or decline,
///     and sent requests shown as in-progress / accepted / declined.
///  2. "Live now" — everyone who accepted and is on an active trip, on a real
///     in-app map (OpenStreetMap via flutter_map), refreshed every 20s.
///  3. "People you can track" — search any customer and send a request.
/// No same-group requirement anymore: consent + an active trip is enough.
class ParentTrackingScreen extends StatefulWidget {
  const ParentTrackingScreen({super.key});

  @override
  State<ParentTrackingScreen> createState() => _ParentTrackingScreenState();
}

class _ParentTrackingScreenState extends State<ParentTrackingScreen> {
  List<dynamic> _people = [];
  List<dynamic> _live = [];
  Map<String, dynamic>? _requests;
  String? _message;
  bool _loading = true;
  bool _following = true;
  String? _focusedId;
  Timer? _poll;
  final MapController _map = MapController();

  AppLocalizations get l10n => AppLocalizations.of(context);

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

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) setState(() { _loading = true; _message = null; });
    try {
      final results = await Future.wait([
        ApiService.instance.get('/tracking/people', query: {'query': ''}),
        ApiService.instance.get('/tracking/search', query: {'query': ''}),
        ApiService.instance.get('/tracking/requests'),
      ]);
      if (!mounted) return;
      setState(() {
        _people = (results[0] as List).toList();
        _live = (results[1] as List).toList();
        _requests = results[2] is Map ? Map<String, dynamic>.from(results[2] as Map) : null;
        _loading = false;
        _message = null;
      });
      _followFocused();
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; if (!silent) _message = e.toString(); });
    }
  }

  void _followFocused() {
    final focused = _focusedMember();
    final point = focused == null ? null : _toPoint(focused['memberLocation']);
    if (point != null && _following) _map.move(point, _map.camera.zoom);
  }

  Map<String, dynamic>? _focusedMember() {
    if (_live.isEmpty) return null;
    for (final entry in _live) {
      final member = Map<String, dynamic>.from(entry as Map);
      if (member['memberId']?.toString() == _focusedId) return member;
    }
    return Map<String, dynamic>.from(_live.first as Map);
  }

  LatLng? _toPoint(dynamic location) {
    if (location is! Map) return null;
    final lat = (location['latitude'] as num?)?.toDouble();
    final lng = (location['longitude'] as num?)?.toDouble();
    if (lat == null || lng == null) return null;
    return LatLng(lat, lng);
  }

  Future<void> _sendRequest(String targetId) async {
    try {
      await ApiService.instance.post('/tracking/requests', body: {'targetId': targetId});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.trackingPendingStatus)));
      await _load(silent: true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _respond(String requestId, bool accept) async {
    try {
      await ApiService.instance.post('/tracking/requests/$requestId/${accept ? 'accept' : 'decline'}');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(accept ? l10n.trackingAccepted : l10n.trackingDeclined)));
      await _load(silent: true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
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
      case 'SAFE': return l10n.trackingWithGuide;
      case 'WARNING': return l10n.trackingDrifting;
      case 'DANGER': return l10n.trackingSeparated;
      default: return l10n.trackingOffline;
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
    final incoming = ((_requests?['received'] as List?) ?? []).map((entry) => Map<String, dynamic>.from(entry as Map)).where((row) => row['status']?.toString() == 'PENDING').toList();
    final sent = ((_requests?['sent'] as List?) ?? []).map((entry) => Map<String, dynamic>.from(entry as Map)).toList();
    final focused = _focusedMember();
    final status = (focused?['status'] ?? '').toString();
    final distance = focused?['distance'] is num ? focused!['distance'] as num : null;
    final lastUpdated = focused?['lastUpdated']?.toString();
    final memberPoint = focused == null ? null : _toPoint(focused['memberLocation']);
    final guidePoint = focused == null ? null : _toPoint(focused['guideLocation']);
    final hasMap = memberPoint != null || guidePoint != null;
    final initialCenter = memberPoint ?? guidePoint ?? const LatLng(21.4225, 39.8262);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.parentTracking)),
      body: _loading && _people.isEmpty && _live.isEmpty
          ? const Center(child: CircularProgressIndicator(color: TOGTColors.orange))
          : RefreshIndicator(
              color: TOGTColors.orange,
              onRefresh: () => _load(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_message != null)
                    Card(
                      color: TOGTColors.orange.withOpacity(.06),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(children: [
                          const Icon(Icons.radar_rounded, color: TOGTColors.orange),
                          const SizedBox(width: 12),
                          Expanded(child: Text(l10n.trackingIntro, style: TOGTTypography.body)),
                        ]),
                      ),
                    ),

                  // ── Incoming requests: B decides (rows come from real
                  //    tracking-request records — the people search only
                  //    reflects requests the VIEWER sent) ────────────────────
                  if (incoming.isNotEmpty) ...[
                    _sectionHeader(l10n.trackingIncomingTitle, Icons.pending_actions_rounded),
                    for (final request in incoming)
                      Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        color: TOGTColors.orange.withOpacity(.05),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: TOGTColors.orange.withOpacity(.35))),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: CircleAvatar(
                            backgroundColor: TOGTColors.blue.withOpacity(.12),
                            child: Text((((request['user'] as Map?)?['fullName']) ?? '?').toString().substring(0, 1).toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w800, color: TOGTColors.blue)),
                          ),
                          title: Text(((request['user'] as Map?)?['fullName'])?.toString() ?? '', style: TOGTTypography.h3),
                          subtitle: Text(((request['user'] as Map?)?['email'])?.toString() ?? '', style: TOGTTypography.small),
                          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                            IconButton(
                              tooltip: l10n.trackingAccepted,
                              onPressed: () => _respond(request['id'].toString(), true),
                              icon: const Icon(Icons.check_circle_rounded, color: TOGTColors.green, size: 30),
                            ),
                            IconButton(
                              tooltip: l10n.trackingDeclined,
                              onPressed: () => _respond(request['id'].toString(), false),
                              icon: const Icon(Icons.cancel_rounded, color: TOGTColors.red, size: 30),
                            ),
                          ]),
                        ),
                      ),
                    const SizedBox(height: 6),
                  ],

                  // ── Live now ────────────────────────────────────────────────
                  _sectionHeader(l10n.trackingLiveTitle, Icons.radar_rounded),
                  if (_live.isEmpty)
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(children: [
                          const Icon(Icons.travel_explore_rounded, color: TOGTColors.grey),
                          const SizedBox(width: 12),
                          Expanded(child: Text(l10n.trackingStartsWhenActive, style: TOGTTypography.body.copyWith(color: TOGTColors.grey))),
                        ]),
                      ),
                    )
                  else ...[
                    if (_live.length > 1)
                      SizedBox(
                        height: 42,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _live.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, i) {
                            final member = Map<String, dynamic>.from(_live[i] as Map);
                            final id = member['memberId']?.toString();
                            final selected = (focused?['memberId']?.toString() == id) || (_focusedId == null && i == 0);
                            return ChoiceChip(
                              label: Text(member['memberName']?.toString() ?? ''),
                              selected: selected,
                              selectedColor: TOGTColors.orange,
                              labelStyle: TextStyle(color: selected ? TOGTColors.white : TOGTColors.navy, fontWeight: FontWeight.w700),
                              onSelected: (_) { setState(() { _focusedId = id; _following = true; }); _followFocused(); },
                            );
                          },
                        ),
                      ),
                    if (focused != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: _statusColor(status).withOpacity(.08),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: _statusColor(status).withOpacity(.35)),
                        ),
                        child: Row(children: [
                          Icon(_statusIcon(status), color: _statusColor(status), size: 28),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(focused['memberName']?.toString() ?? '', style: TOGTTypography.h2),
                            const SizedBox(height: 2),
                            Text('${_statusText(status)} · ${_formatDistance(distance)}', style: TOGTTypography.small.copyWith(color: _statusColor(status), fontWeight: FontWeight.w700)),
                          ])),
                        ]),
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: SizedBox(
                          height: 320,
                          child: hasMap
                              ? Stack(children: [
                                  FlutterMap(
                                    mapController: _map,
                                    options: MapOptions(
                                      initialCenter: initialCenter,
                                      initialZoom: 14,
                                      onMapEvent: (event) {
                                        if (event.source != MapEventSource.mapController && _following) _following = false;
                                      },
                                    ),
                                    children: [
                                      TileLayer(
                                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                        userAgentPackageName: 'com.togt.travel',
                                      ),
                                      MarkerLayer(markers: [
                                        if (guidePoint != null)
                                          Marker(
                                            point: guidePoint,
                                            width: 56,
                                            height: 56,
                                            alignment: Alignment.topCenter,
                                            child: _pin(icon: Icons.route_rounded, color: TOGTColors.blue, label: 'Guide'),
                                          ),
                                        if (memberPoint != null)
                                          Marker(
                                            point: memberPoint,
                                            width: 56,
                                            height: 56,
                                            alignment: Alignment.topCenter,
                                            child: _pin(icon: Icons.person_pin_circle_rounded, color: _statusColor(status), label: (focused['memberName'] ?? '').toString().split(' ').first),
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
                                          final target = memberPoint ?? guidePoint;
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
                                        child: Text('Updated ${lastUpdated.replaceFirst('T', ' · ').split('.').first}', style: TOGTTypography.small.copyWith(color: TOGTColors.navy)),
                                      ),
                                    ),
                                ])
                              : Container(
                                  color: TOGTColors.grey.withOpacity(.12),
                                  child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                    const Icon(Icons.location_off_rounded, color: TOGTColors.grey, size: 40),
                                    const SizedBox(height: 8),
                                    Text(l10n.trackingWaitingSignal, style: TOGTTypography.body),
                                  ])),
                                ),
                        ),
                      ),
                      if (status == 'DANGER')
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: TOGTColors.red.withOpacity(.08), borderRadius: BorderRadius.circular(14)),
                          child: Row(children: [
                            const Icon(Icons.emergency_rounded, color: TOGTColors.red),
                            const SizedBox(width: 10),
                            Expanded(child: Text(l10n.trackingSeparated, style: TOGTTypography.small.copyWith(color: TOGTColors.red, fontWeight: FontWeight.w700))),
                          ]),
                        ),
                    ],
                  ],

                  // ── People: send requests ──────────────────────────────────
                  const SizedBox(height: 8),
                  _sectionHeader(l10n.trackingPeopleTitle, Icons.person_search_rounded),
                  if (_people.isEmpty && !_loading)
                    Padding(
                      padding: const EdgeInsets.all(6),
                      child: Text(l10n.trackingSearchHint, style: TOGTTypography.small.copyWith(color: TOGTColors.grey)),
                    ),
                  for (final entry in _people) ...[
                    // Outgoing PENDING people render here too — the subtitle
                    // already shows "Request in progress".
                    _personRow(entry as Map),
                  ],

                  // ── Sent requests with their state ─────────────────────────
                  if (sent.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    for (final request in sent)
                      if (request['status']?.toString() != 'ACCEPTED')
                        ListTile(
                          dense: true,
                          leading: Icon(
                            request['status']?.toString() == 'DECLINED' ? Icons.cancel_outlined : Icons.hourglass_top_rounded,
                            color: request['status']?.toString() == 'DECLINED' ? TOGTColors.red : const Color(0xFFF59E0B),
                          ),
                          title: Text(request['user'] is Map ? request['user']['fullName']?.toString() ?? '' : '', style: TOGTTypography.small.copyWith(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            request['status']?.toString() == 'DECLINED' ? l10n.trackingDeclined : l10n.trackingPendingStatus,
                            style: TOGTTypography.small.copyWith(color: TOGTColors.grey),
                          ),
                        ),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _sectionHeader(String title, IconData icon) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 10),
        child: Row(children: [
          Icon(icon, size: 18, color: TOGTColors.orange),
          const SizedBox(width: 8),
          Text(title.toUpperCase(), style: TOGTTypography.small.copyWith(fontWeight: FontWeight.w800, color: TOGTColors.grey, letterSpacing: .8)),
        ]),
      );

  Widget _personRow(Map entry) {
    final consent = entry['consent']?.toString() ?? 'NONE';
    final traveling = entry['travelingNow'] == true;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: TOGTColors.blue.withOpacity(.1),
          child: Text((entry['fullName'] ?? '?').toString().substring(0, 1).toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w800, color: TOGTColors.blue)),
        ),
        title: Row(children: [
          Flexible(child: Text(entry['fullName']?.toString() ?? '', style: TOGTTypography.h3, overflow: TextOverflow.ellipsis)),
          if (traveling) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(color: TOGTColors.green.withOpacity(.12), borderRadius: BorderRadius.circular(20)),
              child: Text(l10n.trackingTravelingNow, style: TOGTTypography.small.copyWith(fontSize: 9.5, color: TOGTColors.green, fontWeight: FontWeight.w800)),
            ),
          ],
        ]),
        subtitle: Text(
          consent == 'ACCEPTED' ? l10n.trackingLinked : consent == 'DECLINED' ? l10n.trackingDeclined : consent == 'PENDING' ? l10n.trackingPendingStatus : l10n.trackingNotLinked,
          style: TOGTTypography.small.copyWith(color: consent == 'ACCEPTED' ? TOGTColors.green : TOGTColors.grey),
        ),
        trailing: consent == 'NONE'
            ? ElevatedButton(
                onPressed: () => _sendRequest(entry['id'].toString()),
                style: ElevatedButton.styleFrom(backgroundColor: TOGTColors.blue, foregroundColor: TOGTColors.white, padding: const EdgeInsets.symmetric(horizontal: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: Text(l10n.trackingSendRequest, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              )
            : null,
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
}
