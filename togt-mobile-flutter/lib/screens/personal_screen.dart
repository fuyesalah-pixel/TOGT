import 'dart:math' as math;
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:adhan/adhan.dart';
import '../l10n/app_localizations.dart';
import '../services/prayer_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class PersonalScreen extends StatefulWidget {
  const PersonalScreen({super.key});
  @override
  State<PersonalScreen> createState() => _PersonalScreenState();
}

class _PersonalScreenState extends State<PersonalScreen> {
  int _section = 0;
  int _tasbih = 0;
  bool _azan = true;
  PrayerTimes? _times;
  double? _heading;
  double? _qiblaBearing;
  double? _distance;
  String? _locationError;
  StreamSubscription<CompassEvent>? _compass;

  AppLocalizations get l10n => AppLocalizations.of(context);

  @override
  void initState() {
    super.initState();
    final events = FlutterCompass.events;
    if (events != null) {
      _compass = events.listen((event) {
        if (mounted) setState(() => _heading = event.heading);
      });
    }
    _loadLocation();
  }

  Future<void> _loadLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('Location services are disabled.');
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) throw Exception('Location permission is required.');
      final p = await Geolocator.getCurrentPosition();
      final qibla = _bearing(p.latitude, p.longitude);
      final distance = Geolocator.distanceBetween(p.latitude, p.longitude, 21.4225, 39.8262) / 1000;
      final times = PrayerService.instance.calculate(p.latitude, p.longitude);
       try { await PrayerService.instance.schedule(times, enabled: _azan); } catch (_) {}
      if (mounted) setState(() { _qiblaBearing = qibla; _distance = distance; _times = times; _locationError = null; });
    } catch (e) {
      if (mounted) setState(() => _locationError = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  double _bearing(double lat, double lng) {
    final dLng = (39.8262 - lng) * math.pi / 180;
    final latRad = lat * math.pi / 180;
    final kaabaLat = 21.4225 * math.pi / 180;
    final y = math.sin(dLng);
    final x = math.cos(latRad) * math.tan(kaabaLat) - math.sin(latRad) * math.cos(dLng);
    return (math.atan2(y, x) * 180 / math.pi + 360) % 360;
  }

  @override
  void dispose() {
    _compass?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SafeArea(
        bottom: false,
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 14, 20, 32), children: [
          Text(l10n.personalTitle, style: TOGTTypography.h1),
          const SizedBox(height: 5),
          Text(l10n.personalTools, style: TOGTTypography.body),
          const SizedBox(height: 20),
           SizedBox(height: 42, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: 4, separatorBuilder: (_, __) => const SizedBox(width: 8), itemBuilder: (_, i) => ChoiceChip(label: Text([l10n.prayerTimes, l10n.qibla, l10n.azkar, l10n.personalTitle][i]), selected: _section == i, selectedColor: TOGTColors.orange, labelStyle: TextStyle(color: _section == i ? TOGTColors.white : TOGTColors.navy, fontWeight: FontWeight.w700), onSelected: (_) => setState(() => _section = i)))),
          const SizedBox(height: 18),
          AnimatedSwitcher(duration: const Duration(milliseconds: 350), child: _content()),
        ]),
      );

  Widget _content() {
    switch (_section) {
      case 1: return _qibla();
      case 2: return _azkar();
      case 3: return _tasbihView();
      default: return _prayerTimes();
    }
  }

  Widget _prayerTimes() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _hero(Icons.access_time_rounded, l10n.prayerTimes, l10n.azanAlarm),
        const SizedBox(height: 18),
        ..._prayerRows(),
         SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(l10n.azanAlarm), subtitle: Text(l10n.notifyBeforePrayer), value: _azan, activeThumbColor: TOGTColors.orange, onChanged: (v) async { setState(() => _azan = v); if (_times != null) await PrayerService.instance.schedule(_times!, enabled: v); }),
      ]);

  List<Widget> _prayerRows() {
    if (_times == null) return [Padding(padding: const EdgeInsets.all(20), child: Text(l10n.allowLocationPrayer))];
    final values = [('Fajr', _format(_times!.fajr)), ('Dhuhr', _format(_times!.dhuhr)), ('Asr', _format(_times!.asr)), ('Maghrib', _format(_times!.maghrib)), ('Isha', _format(_times!.isha))];
    return values.map((p) => Card(child: ListTile(leading: Icon(Icons.circle, size: 10, color: p.$1 == 'Dhuhr' ? TOGTColors.orange : TOGTColors.blue), title: Text(p.$1, style: TOGTTypography.h3), trailing: Text(p.$2, style: TOGTTypography.h3.copyWith(color: TOGTColors.blue))))).toList();
  }

  String _format(DateTime time) => TimeOfDay.fromDateTime(time).format(context);

  Widget _qibla() => Column(children: [
         _hero(Icons.explore_rounded, l10n.qibla, l10n.findingQibla),
        const SizedBox(height: 24),
        Container(width: 230, height: 230, decoration: BoxDecoration(shape: BoxShape.circle, color: TOGTColors.white, border: Border.all(color: TOGTColors.blue.withOpacity(.18), width: 8), boxShadow: [BoxShadow(color: TOGTColors.blue.withOpacity(.12), blurRadius: 24)]), child: _qiblaBearing == null ? const Center(child: CircularProgressIndicator(color: TOGTColors.orange)) : Transform.rotate(angle: (((_qiblaBearing! - (_heading ?? 0)) * math.pi / 180)), child: const Icon(Icons.navigation_rounded, size: 130, color: TOGTColors.orange))),
         const SizedBox(height: 18), Text(_qiblaBearing == null ? l10n.findingQibla : l10n.direction(_qiblaBearing!.toStringAsFixed(0)), style: TOGTTypography.h3),
         Text(_distance == null ? (_locationError ?? l10n.compassUnavailable) : l10n.distanceMakkah(_distance!.toStringAsFixed(0)), style: TOGTTypography.small),
         TextButton.icon(onPressed: _loadLocation, icon: const Icon(Icons.refresh_rounded), label: Text(l10n.refreshLocation)),
      ]);

  Widget _azkar() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
         _hero(Icons.auto_awesome_rounded, l10n.azkar, l10n.commonDuas),
        const SizedBox(height: 18),
         ...[l10n.azkarMorning, l10n.azkarEvening, l10n.beforeTravel, l10n.commonDuas].map((title) => Card(child: ExpansionTile(title: Text(title, style: TOGTTypography.h3), children: [Padding(padding: const EdgeInsets.fromLTRB(18, 0, 18, 18), child: Text(l10n.gloryAllah))]))),
      ]);

  Widget _tasbihView() => Column(children: [
         _hero(Icons.fingerprint_rounded, l10n.azkar, l10n.tapToCount),
        const SizedBox(height: 30),
        GestureDetector(onTap: () => setState(() => _tasbih++), child: Container(width: 210, height: 210, alignment: Alignment.center, decoration: BoxDecoration(shape: BoxShape.circle, gradient: TOGTColors.blueGradient, boxShadow: [BoxShadow(color: TOGTColors.blue.withOpacity(.3), blurRadius: 24)]), child: Text('$_tasbih', style: const TextStyle(fontSize: 52, color: TOGTColors.white, fontWeight: FontWeight.w800)))),
         const SizedBox(height: 20), Text(l10n.tapToCount, style: TOGTTypography.h3),
         TextButton(onPressed: () => setState(() => _tasbih = 0), child: Text(l10n.reset)),
      ]);

  Widget _hero(IconData icon, String title, String subtitle) => Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(24)), child: Row(children: [Icon(icon, color: TOGTColors.orange, size: 38), const SizedBox(width: 15), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TOGTTypography.h2.copyWith(color: TOGTColors.white)), const SizedBox(height: 4), Text(subtitle, style: TextStyle(color: TOGTColors.white.withOpacity(.75)))]))]));
}
