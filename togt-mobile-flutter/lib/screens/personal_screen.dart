import 'dart:math' as math;
import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:adhan/adhan.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_localizations.dart';
import '../services/prayer_service.dart';
import '../services/permission_service.dart';
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
  int _dhikr = 0;
  bool _azan = true;
  bool _exactAlarmHintShown = false;
  PrayerTimes? _times;
  double? _heading;
  double? _qiblaBearing;
  double? _distance;
  String? _locationError;
  StreamSubscription<CompassEvent>? _compass;
  List<CustomAlarm> _customAlarms = [];
  final ScrollController _scrollController = ScrollController();

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
    _loadTasbih();
    _loadDhikr();
    _loadCustomAlarms();
    // The azan pref must be known BEFORE the first schedule() below — the
    // startup re-arm in main.dart uses the same persisted key.
    () async {
      await _loadAzanPref();
      _loadLocation();
    }();
  }

  Future<void> _loadAzanPref() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getBool('togt_azan_enabled');
    if (mounted && stored != null) setState(() => _azan = stored);
  }

  Future<void> _loadTasbih() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _tasbih = prefs.getInt('togt_tasbih_count') ?? 0);
  }

  Future<void> _loadCustomAlarms() async {
    final alarms = await CustomAlarm.loadAll();
    if (mounted) setState(() => _customAlarms = alarms);
  }

  Future<void> _persistAlarmsAndReschedule(List<CustomAlarm> alarms) async {
    await CustomAlarm.saveAll(alarms);
    if (mounted) setState(() => _customAlarms = alarms);
    if (_times != null) {
      try {
        await PrayerService.instance.schedule(_times!, enabled: _azan, customAlarms: alarms);
      } catch (_) {}
    }
  }

  Future<void> _addCustomAlarm() async {
    final picked = await showTimePicker(context: context, initialTime: TimeOfDay.now());
    if (picked == null || !mounted) return;
    final label = await _askAlarmLabel(picked);
    final alarm = CustomAlarm(
      id: '${DateTime.now().millisecondsSinceEpoch}',
      hour: picked.hour,
      minute: picked.minute,
      label: label ?? '',
    );
    await _persistAlarmsAndReschedule([..._customAlarms, alarm]);
  }

  Future<String?> _askAlarmLabel(TimeOfDay time) async {
    final controller = TextEditingController();
    final label = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Alarm at ${time.format(ctx)}'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Optional label (e.g. Wake up, Ihram)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.cancel)),
          TextButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: Text(l10n.saveChanges)),
        ],
      ),
    );
    return label;
  }

  Future<void> _saveTasbih() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('togt_tasbih_count', _tasbih);
  }

  Future<void> _loadDhikr() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _dhikr = (prefs.getInt('togt_tasbih_dhikr') ?? 0).clamp(0, _dhikrOptions.length - 1));
  }

  Future<void> _saveDhikr() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('togt_tasbih_dhikr', _dhikr);
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
      // Re-arm all alarms with the fresh prayer times (custom alarms included
      // — schedule() cancels everything first, so they must be re-passed).
      final alarms = _customAlarms.isNotEmpty ? _customAlarms : await CustomAlarm.loadAll();
       try { await PrayerService.instance.schedule(times, enabled: _azan, customAlarms: alarms); } catch (_) {}
      if (mounted && _customAlarms.isEmpty) setState(() => _customAlarms = alarms);
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
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SafeArea(
        bottom: false,
        child: ListView(controller: _scrollController, padding: const EdgeInsets.fromLTRB(20, 14, 20, 32), children: [
          Text(l10n.personalTitle, style: TOGTTypography.h1),
          const SizedBox(height: 5),
          Text(l10n.personalTools, style: TOGTTypography.body),
          const SizedBox(height: 20),
          Wrap(spacing: 8, runSpacing: 8, children: [for (var i = 0; i < 4; i++) ChoiceChip(label: Text([l10n.prayerTimes, l10n.qibla, l10n.azkar, l10n.tasbih][i]), selected: _section == i, selectedColor: TOGTColors.orange, labelStyle: TextStyle(color: _section == i ? TOGTColors.white : TOGTColors.navy, fontWeight: FontWeight.w700), onSelected: (_) => setState(() { _section = i; if (_scrollController.hasClients) _scrollController.jumpTo(0); }))]),
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
         SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(l10n.azanAlarm), subtitle: Text(l10n.notifyBeforePrayer), value: _azan, activeThumbColor: TOGTColors.orange, onChanged: (v) async {
           setState(() => _azan = v);
           // Persist the choice: main.dart re-arms the alarm pool at every app
           // start and reads this same key, so the toggle must survive restarts.
           final prefs = await SharedPreferences.getInstance();
           await prefs.setBool('togt_azan_enabled', v);
           if (_times != null) await PrayerService.instance.schedule(_times!, enabled: v, customAlarms: _customAlarms);
         }),
        if (_azan && !_exactAlarmHintShown && _times != null) _exactAlarmBanner(),
        const _NotificationsOffBanner(),
        _customAlarmsCard(),
        _permissionsCard(),
      ]);

  /// Custom alarms live directly under the azan alarm switch.
  Widget _customAlarmsCard() => Card(
        margin: const EdgeInsets.only(top: 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            leading: const Icon(Icons.alarm_add_rounded, color: TOGTColors.orange),
            title: Text('Custom alarms', style: TOGTTypography.h3),
            subtitle: Text('Pick any time — it rings with the azan sound, every day', style: TOGTTypography.small),
            trailing: IconButton(
              icon: const Icon(Icons.add_circle_rounded, color: TOGTColors.orange, size: 30),
              onPressed: _addCustomAlarm,
            ),
          ),
          for (final alarm in _customAlarms)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
              leading: const Icon(Icons.alarm_rounded, color: TOGTColors.blue),
              title: Text(
                alarm.label.isEmpty ? 'Alarm' : alarm.label,
                style: TOGTTypography.h3.copyWith(
                  decoration: alarm.enabled ? null : TextDecoration.lineThrough,
                  color: alarm.enabled ? null : TOGTColors.grey,
                ),
              ),
              subtitle: Text(MaterialLocalizations.of(context).formatTimeOfDay(TimeOfDay(hour: alarm.hour, minute: alarm.minute)), style: TOGTTypography.small),
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                Switch(value: alarm.enabled, activeThumbColor: TOGTColors.orange, onChanged: (v) async {
                  alarm.enabled = v;
                  await _persistAlarmsAndReschedule(_customAlarms);
                }),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, color: TOGTColors.red, size: 22),
                  onPressed: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete alarm?'),
                        content: Text('"${alarm.label.isEmpty ? 'Alarm' : alarm.label}" will stop ringing.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
                        ],
                      ),
                    );
                    if (confirmed == true) await _persistAlarmsAndReschedule(_customAlarms.where((a) => a.id != alarm.id).toList());
                  },
                ),
              ]),
            ),
        ]),
      );

  /// Re-enable (or turn back on) the app permission flow: "don't ask again
  /// unless the user asks for it" — this tile is that ask-again entry point.
  Widget _permissionsCard() => Card(
        margin: const EdgeInsets.only(top: 10),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: const Icon(Icons.verified_user_rounded, color: TOGTColors.blue),
          title: Text(l10n.permissionTitle, style: TOGTTypography.h3),
          subtitle: Text('Location & notifications — tap to review or grant again', style: TOGTTypography.small),
          trailing: const Icon(Icons.chevron_right_rounded, color: TOGTColors.grey),
          onTap: () async {
            await PermissionService.instance.resetFlow();
            if (!mounted) return;
            await PermissionService.instance.runAfterLogin(context);
          },
        ),
      );

  /// Android 12+ requires the exact-alarm special access for on-time azan.
  Widget _exactAlarmBanner() {
    return FutureBuilder<bool>(
      future: PermissionService.instance.canScheduleExactAlarms(),
      builder: (context, snapshot) {
        if (snapshot.data != false) return const SizedBox.shrink();
        return Container(
          margin: const EdgeInsets.only(top: 6),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: TOGTColors.orange.withOpacity(.08), borderRadius: BorderRadius.circular(16), border: Border.all(color: TOGTColors.orange.withOpacity(.3))),
          child: Row(children: [
            const Icon(Icons.alarm_rounded, color: TOGTColors.orange),
            const SizedBox(width: 12),
            Expanded(child: Text(l10n.azanExactHint, style: TOGTTypography.small.copyWith(color: TOGTColors.navy))),
            TextButton(
              onPressed: () async {
                setState(() => _exactAlarmHintShown = true);
                await PermissionService.instance.openExactAlarmSettings();
              },
              child: Text(l10n.permissionOpenSettings, style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ]),
        );
      },
    );
  }

  List<Widget> _prayerRows() {
    if (_times == null) return [Padding(padding: const EdgeInsets.all(20), child: Text(l10n.allowLocationPrayer))];
    // Highlight the prayer that is actually up next (domain-correct), not a
    // hardcoded one.
    final entries = <String, DateTime>{'Fajr': _times!.fajr, 'Dhuhr': _times!.dhuhr, 'Asr': _times!.asr, 'Maghrib': _times!.maghrib, 'Isha': _times!.isha};
    final now = DateTime.now();
    String nextName = 'Fajr'; // after Isha the next prayer is tomorrow's Fajr
    for (final entry in entries.entries) {
      if (entry.value.isAfter(now)) {
        nextName = entry.key;
        break;
      }
    }
    return entries.entries.map((entry) {
      final isNext = entry.key == nextName;
      return Card(child: ListTile(
        leading: Icon(Icons.circle, size: 10, color: isNext ? TOGTColors.orange : TOGTColors.blue),
        title: Text(entry.key, style: TOGTTypography.h3),
        subtitle: isNext ? Text('Up next', style: TOGTTypography.small.copyWith(color: TOGTColors.orange, fontWeight: FontWeight.w800)) : null,
        trailing: Text(_format(entry.value), style: TOGTTypography.h3.copyWith(color: isNext ? TOGTColors.blue : TOGTColors.grey)),
      ));
    }).toList();
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
        ..._azkarCategories().map((category) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              clipBehavior: Clip.antiAlias,
              child: ExpansionTile(
                initiallyExpanded: false,
                title: Text(category.title(l10n), style: TOGTTypography.h3),
                subtitle: Text('${category.items.length}', style: TOGTTypography.small),
                childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                children: category.items.map((item) => _azkarCard(item)).toList(),
              ),
            )),
      ]);

  Widget _azkarCard(_Azkar z) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: TOGTColors.navy.withOpacity(.06))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Text(z.arabic, textDirection: TextDirection.rtl, style: const TextStyle(fontSize: 19, height: 1.9, fontWeight: FontWeight.w600, color: Color(0xFF12394F)))),
            const SizedBox(width: 8),
            Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4), decoration: BoxDecoration(color: TOGTColors.orange.withOpacity(.12), borderRadius: BorderRadius.circular(20)), child: Text('×${z.count}', style: TOGTTypography.small.copyWith(color: TOGTColors.orange, fontWeight: FontWeight.w800))),
          ]),
          if (z.transliteration.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(z.transliteration, style: TOGTTypography.small.copyWith(fontStyle: FontStyle.italic, color: TOGTColors.grey))),
          if (z.meaning.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(z.meaning, style: TOGTTypography.small.copyWith(color: TOGTColors.navy))),
        ]),
      );

  Widget _tasbihView() => Column(children: [
         _hero(Icons.fingerprint_rounded, l10n.tasbih, l10n.tapToCount),
        const SizedBox(height: 14),
        Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
          for (var i = 0; i < _dhikrOptions.length; i++)
            ChoiceChip(
              label: Text(_dhikrOptions[i].transliteration, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _dhikr == i ? TOGTColors.white : TOGTColors.navy)),
              selected: _dhikr == i,
              selectedColor: TOGTColors.blue,
              onSelected: (_) { HapticFeedback.selectionClick(); setState(() => _dhikr = i); _saveDhikr(); },
            ),
        ]),
        const SizedBox(height: 16),
        Text(_dhikrOptions[_dhikr].arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, height: 1.7, fontWeight: FontWeight.w600, color: Color(0xFF12394F))),
        const SizedBox(height: 16),
        _TasbihDial(
          count: _tasbih,
          onTap: () {
            HapticFeedback.mediumImpact();
            setState(() => _tasbih += 1);
            if (_tasbih % 33 == 0) HapticFeedback.heavyImpact();
            _saveTasbih();
          },
        ),
         const SizedBox(height: 20), Text(l10n.tapToCount, style: TOGTTypography.h3),
         Text('${_tasbih ~/ 33} ${_tasbih ~/ 33 == 1 ? 'round' : 'rounds'} of 33 completed', style: TOGTTypography.small.copyWith(color: TOGTColors.grey)),
         Row(mainAxisSize: MainAxisSize.min, children: [
           TextButton(onPressed: () { HapticFeedback.selectionClick(); setState(() => _tasbih = 0); _saveTasbih(); }, child: Text(l10n.reset)),
           TextButton(onPressed: () { HapticFeedback.selectionClick(); setState(() => _tasbih = (_tasbih - 1).clamp(0, 1 << 30)); _saveTasbih(); }, child: const Text('−1')),
         ]),
      ]);

  Widget _hero(IconData icon, String title, String subtitle) => Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(24)), child: Row(children: [Icon(icon, color: TOGTColors.orange, size: 38), const SizedBox(width: 15), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TOGTTypography.h2.copyWith(color: TOGTColors.white)), const SizedBox(height: 4), Text(subtitle, style: TextStyle(color: TOGTColors.white.withOpacity(.75)))]))]));

  List<_AzkarCategory> _azkarCategories() => [
        _AzkarCategory(title: (l10n) => l10n.azkarMorning, items: _morningAzkar),
        _AzkarCategory(title: (l10n) => l10n.azkarEvening, items: _eveningAzkar),
        _AzkarCategory(title: (l10n) => l10n.azkarAfterPrayer, items: _afterPrayerAzkar),
        _AzkarCategory(title: (l10n) => l10n.beforeTravel, items: _travelAzkar),
        _AzkarCategory(title: (l10n) => l10n.azkarSleep, items: _sleepAzkar),
        _AzkarCategory(title: (l10n) => l10n.azkarDistress, items: _distressAzkar),
        _AzkarCategory(title: (l10n) => l10n.commonDuas, items: _commonAzkar),
      ];
}

/// Android 13+ silently swallows every scheduled alarm when notifications
/// are denied — surface that right where the alarms live, with a one-tap
/// fix that re-checks when the user comes back from Settings.
class _NotificationsOffBanner extends StatefulWidget {
  const _NotificationsOffBanner();

  @override
  State<_NotificationsOffBanner> createState() => _NotificationsOffBannerState();
}

class _NotificationsOffBannerState extends State<_NotificationsOffBanner> {
  late Future<bool> _check;

  @override
  void initState() {
    super.initState();
    _check = PermissionService.instance.notificationsEnabled();
  }

  void _recheck() => setState(() => _check = PermissionService.instance.notificationsEnabled());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _check,
      builder: (context, snapshot) {
        if (snapshot.data != false) return const SizedBox.shrink();
        return Container(
          margin: const EdgeInsets.only(top: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: TOGTColors.red.withValues(alpha: .08), borderRadius: BorderRadius.circular(16), border: Border.all(color: TOGTColors.red.withValues(alpha: .35))),
          child: Row(children: [
            const Icon(Icons.notifications_off_rounded, color: TOGTColors.red),
            const SizedBox(width: 12),
            Expanded(child: Text('Notifications are turned off — alarms cannot ring. Tap to allow them.', style: TOGTTypography.small.copyWith(color: TOGTColors.navy))),
            TextButton(
              onPressed: () async {
                await PermissionService.instance.openAppSettings();
                // Re-check once the user is back from system settings.
                if (mounted) _recheck();
              },
              child: const Text('Open settings', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ]),
        );
      },
    );
  }
}

class _AzkarCategory {
  const _AzkarCategory({required this.title, required this.items});
  final String Function(AppLocalizations) title;
  final List<_Azkar> items;
}

class _Azkar {
  const _Azkar({required this.arabic, this.transliteration = '', this.meaning = '', this.count = 1});
  final String arabic;
  final String transliteration;
  final String meaning;
  final int count;
}

const _morningAzkar = [
  _Azkar(arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ', transliteration: 'A\u2018ūdhu billāhi minash-shayṭānir-rajīm. Allāhu lā ilāha illā huwal-ḥayyul-qayyūm... wa-lā ya\u2019ūduhu ḥifẓuhumā wa-huwal-\u2018aliyyul-\u2018aẓīm', meaning: 'Ayat al-Kursi (complete) — whoever recites it in the morning is protected until evening.', count: 1),
  _Azkar(arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', transliteration: 'Qul huwa Allāhu aḥad, Allāhuṣ-ṣamad, lam yalid wa lam yūlad, wa lam yakul-lahu kufuwan aḥad (Sūrat al-Ikhlāṣ — complete)', meaning: 'Recite 3 times — equals reciting the whole Quran.', count: 3),
  _Azkar(arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', transliteration: 'Qul a\u2018ūdhu birabbil-falaq, min sharri mā khalaq, wa min sharri ghāsiqin idhā waqab, wa min sharrin-naffāthāti fil-\u2018uqad, wa min sharri ḥāsidin idhā ḥasad (Sūrat al-Falaq — complete)', meaning: 'Recite 3 times for protection.', count: 3),
  _Azkar(arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ', transliteration: 'Qul a\u2018ūdhu birabbin-nās, malikin-nās, ilāhin-nās, min sharril-waswāsil-khannās, alladhī yuwaswisu fī ṣudūrin-nās, minal-jinnati wan-nās (Sūrat an-Nās — complete)', meaning: 'Recite 3 times for protection.', count: 3),
  _Azkar(arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'Aṣbaḥnā wa aṣbaḥal-mulku lillāh...', meaning: 'We have entered the morning and with it all dominion belongs to Allah.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', transliteration: 'Allāhumma bika aṣbaḥnā...', meaning: 'O Allah, by You we enter the morning and evening, live and die, and to You is the resurrection.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', transliteration: 'Allāhumma anta rabbī lā ilāha illā anta... fa-innahū lā yaghfirudh-dhunūba illā anta (Sayyid al-Istighfār — complete)', meaning: 'The master of supplications — said once in the morning.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا', transliteration: 'Allāhumma innī as\u2019aluka \u2018ilman nāfi\u2018an...', meaning: 'O Allah, I ask You for beneficial knowledge, pure provision, and accepted deeds.', count: 1),
  _Azkar(arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا', transliteration: 'Raḍītu billāhi rabbā...', meaning: 'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad as my Prophet.', count: 3),
  _Azkar(arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', transliteration: 'Bismillāhil-ladhī lā yaḍurru...', meaning: 'Nothing will harm you by Allah\u2019s name.', count: 3),
  _Azkar(arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', transliteration: 'Ḥasbiyallāhu lā ilāha illā huwa...', meaning: 'Allah is sufficient for me — said 7 times.', count: 7),
  _Azkar(arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي', transliteration: 'Allāhumma \u2018āfinī fī badanī...', meaning: 'O Allah, grant my body, hearing and sight health.', count: 3),
];

const _eveningAzkar = [
  _Azkar(arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'Amsaynā wa amsal-mulku lillāh...', meaning: 'We have entered the evening and with it all dominion belongs to Allah.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ', transliteration: 'Allāhumma bika amsaynā...', meaning: 'O Allah, by You we enter the evening and morning, live and die, and to You is the return.', count: 1),
  _Azkar(arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: 'A\u2018ūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq', meaning: 'Protection from every harm tonight.', count: 3),
  _Azkar(arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ', transliteration: 'Allāhumma innī a\u2018ūdhu bika minal-kufr wal-faqr...', meaning: 'O Allah, I seek refuge in You from disbelief, poverty and the torment of the grave.', count: 3),
  _Azkar(arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ', transliteration: 'Subḥānallāhi wa biḥamdih... \u2018adada khalqih...', meaning: 'Glorified be Allah by the number of His creation.', count: 3),
];

const _afterPrayerAzkar = [
  _Azkar(arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ. اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', transliteration: 'Astaghfirullāh... Allāhumma antas-salām...', meaning: 'Seek forgiveness three times after every prayer.', count: 3),
  _Azkar(arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'Lā ilāha illallāhu waḥdahu lā sharīka lah...', meaning: 'Said after every prayer — a great reward.', count: 1),
  _Azkar(arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'Subḥānallāh', meaning: 'Glory be to Allah — 33 times after prayer.', count: 33),
  _Azkar(arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alḥamdulillāh', meaning: 'All praise is for Allah — 33 times after prayer.', count: 33),
  _Azkar(arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allāhu akbar', meaning: 'Allah is the Greatest — 33 times after prayer.', count: 33),
  _Azkar(arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'Lā ilāha illallāhu waḥdahu... (completing 100)', meaning: 'Completing the hundred after prayer.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', transliteration: 'Allāhumma a\u2018innī \u2018alā dhikrika wa shukrika wa ḥusni \u2018ibādatik', meaning: 'O Allah, help me to remember You, thank You, and worship You well.', count: 1),
];

const _travelAzkar = [
  _Azkar(arabic: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', transliteration: 'Allāhu akbar (×3), subḥānal-ladhī sakhkhara lanā hādhā...', meaning: 'The travel takbir — said when mounting a conveyance.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ، وَمِنَ الْعَمَلِ مَا تَرْضَىٰ', transliteration: 'Allāhumma innā nas\u2019aluka fī safarinā hādhal-birra wat-taqwā...', meaning: 'The Prophet\u2019s ﷺ travel dua — ask for righteousness and deeds that please Allah.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَٰذَا وَاطْوِ عَنَّا بُعْدَهُ. اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ', transliteration: 'Allāhumma hawwin \u2018alaynā safaranā...', meaning: 'O Allah, make this journey easy and be our Companion in travel.', count: 1),
  _Azkar(arabic: 'بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا', transliteration: 'Bismillāhi majrahā wa mursāhā', meaning: 'Said when boarding a ship or plane.', count: 1),
  _Azkar(arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: 'A\u2018ūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq', meaning: 'When stopping at a place during travel.', count: 3),
  _Azkar(arabic: 'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ', transliteration: 'Āyibūna tā\u2019ibūna \u2018ābidūna lirabbinā ḥāmidūn', meaning: 'The returning dua — said when coming back from travel.', count: 1),
];

const _sleepAzkar = [
  _Azkar(arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', transliteration: 'Bismika Allāhumma amūtu wa aḥyā', meaning: 'In Your name, O Allah, I die and I live.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ', transliteration: 'Allāhumma aslamtu nafsī ilayk...', meaning: 'The Prophet\u2019s ﷺ bedtime dua.', count: 1),
  _Azkar(arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ', transliteration: 'Āyat al-Kursī (complete) — Allāhu lā ilāha illā huwa... wa-huwal-\u2018aliyyul-\u2018aẓīm', meaning: 'Whoever recites it before sleep has a guardian from Allah all night.', count: 1),
  _Azkar(arabic: 'قراءة الإخلاص والمعوذتين ثم مسح الجسد بالكفين', transliteration: 'Al-Ikhlāṣ, al-Falaq, an-Nās (×3, wipe over body)', meaning: 'The Prophet\u2019s ﷺ nightly protection — cup hands, recite, wipe over body three times.', count: 3),
  _Azkar(arabic: 'سُبْحَانَ اللَّهِ (33) الْحَمْدُ لِلَّهِ (33) اللَّهُ أَكْبَرُ (34)', transliteration: 'Subḥānallāh ×33, Alḥamdulillāh ×33, Allāhu akbar ×34', meaning: 'The bedtime tasbih — better than a servant for you.', count: 100),
  _Azkar(arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', transliteration: 'Allāhumma qinī \u2018adhābaka yawma tab\u2018athu \u2018ibādak', meaning: 'Said three times when lying down.', count: 3),
];

const _distressAzkar = [
  _Azkar(arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ', transliteration: 'Lā ilāha illallāhul-\u2018aẓīmul-ḥalīm...', meaning: 'The dua of distress — said in hardship.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَىٰ نَفْسِي، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ', transliteration: 'Allāhumma raḥmataka arjū falā takilnī ilā nafsī...', meaning: 'O Allah, I hope for Your mercy — do not leave me to myself.', count: 1),
  _Azkar(arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', transliteration: 'Lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn', meaning: 'The dua of Yunus — said 40 times in distress.', count: 40),
  _Azkar(arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', transliteration: 'Ḥasbunallāhu wa ni\u2018mal-wakīl', meaning: 'Sufficient for us is Allah and He is the best Disposer of affairs.', count: 7),
  _Azkar(arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'Lā ḥawla wa lā quwwata illā billāh', meaning: 'There is no power except with Allah — a treasure from Paradise.', count: 10),
];

const _commonAzkar = [
  _Azkar(arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', transliteration: 'Subḥānallāhi wa biḥamdih, subḥānallāhil-\u2018aẓīm', meaning: 'Two words light on the tongue, heavy on the scale.', count: 100),
  _Azkar(arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ', transliteration: 'Allāhumma ṣalli wa sallim \u2018alā nabiyyinā Muḥammad', meaning: 'Send blessings on the Prophet ﷺ — ten rewards for one.', count: 10),
  _Azkar(arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', transliteration: 'Astaghfirullāha wa atūbu ilayh', meaning: 'Seek forgiveness — the Prophet ﷺ did so more than 70 times a day.', count: 100),
  _Azkar(arabic: 'اللَّهُمَّ أَعِنَّا بِذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', transliteration: 'Allāhumma a\u2018innā bidhikrika wa shukrika...', meaning: 'A comprehensive daily dua.', count: 1),
  _Azkar(arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', transliteration: 'Rabbanā ātinā fid-dunyā ḥasanah...', meaning: 'The most frequent dua of the Quran.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', transliteration: 'Allāhumma innī as\u2019alukal-jannah...', meaning: 'Ask for Paradise and refuge from the Fire.', count: 1),
];
/// What the counter is counting — the classic after-prayer and morning
/// adhkar. The dial counts 33 per lap regardless of choice.
class _Dhikr {
  const _Dhikr(this.arabic, this.transliteration);
  final String arabic;
  final String transliteration;
}

const _dhikrOptions = [
  _Dhikr('سُبْحَانَ اللَّهِ', 'Subhanallah'),
  _Dhikr('الْحَمْدُ لِلَّهِ', 'Alhamdulillah'),
  _Dhikr('اللَّهُ أَكْبَرُ', 'Allahu Akbar'),
  _Dhikr('لَا إِلَٰهَ إِلَّا اللَّهُ', 'La ilaha illallah'),
  _Dhikr('أَسْتَغْفِرُ اللَّهَ', 'Astaghfirullah'),
];

/// A lifelike handheld misbaha: 33 wooden beads threaded on a cord loop with
/// an imam bead and tassel hanging at the bottom. The loop sways gently like
/// it is held between fingers, beads glide to the next position on every tap
/// (with a scale impulse), and each completed lap of 33 pulses with a warm
/// glow + heavy haptic. All gradients go through Flutter's RadialGradient
/// (dart:ui Gradient.linear with >2 colors and no stops throws in release).
class _TasbihDial extends StatefulWidget {
  const _TasbihDial({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  State<_TasbihDial> createState() => _TasbihDialState();
}

class _TasbihDialState extends State<_TasbihDial> with TickerProviderStateMixin {
  late final AnimationController _sway = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();
  late final AnimationController _tap = AnimationController(vsync: this, duration: const Duration(milliseconds: 160), value: 1);
  late final AnimationController _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));

  @override
  void didUpdateWidget(covariant _TasbihDial oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.count != oldWidget.count) {
      _tap.forward(from: 0);
      // A completed lap: the tap that crossed a multiple of 33.
      if (widget.count > oldWidget.count && widget.count % 33 == 0) _pulse.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _sway.dispose();
    _tap.dispose();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inLoop = widget.count % 33;
    final completed = inLoop == 0 && widget.count > 0;
    return AnimatedBuilder(
      animation: Listenable.merge([_sway, _tap, _pulse]),
      builder: (context, child) {
        final sway = math.sin(_sway.value * 2 * math.pi) * 0.026; // ±1.5°
        final tapScale = 0.965 + 0.035 * Curves.easeOutBack.transform(_tap.value);
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onTap,
          child: Transform.scale(
            scale: tapScale,
            child: Transform.rotate(
            angle: sway,
            alignment: Alignment.topCenter,
            child: SizedBox(
              width: 300,
              height: 380,
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  CustomPaint(
                    size: const Size(300, 380),
                    painter: _MisbahaPainter(
                      done: completed ? 33 : inLoop,
                      total: 33,
                      phase: _sway.value,
                      tapT: Curves.easeOutCubic.transform(_tap.value),
                      pulse: _pulse.value,
                    ),
                  ),
                  Positioned(
                    top: 118,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${widget.count}',
                          style: TextStyle(
                            fontSize: 54,
                            fontWeight: FontWeight.w800,
                            color: completed ? TOGTColors.orange : const Color(0xFF12394F),
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$inLoop / 33',
                          style: TOGTTypography.small.copyWith(color: TOGTColors.grey, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          ),
        );
      },
    );
  }
}

/// Paints the misbaha: soft drop shadow, dark cord loop, 33 polished wooden
/// beads (radial-gradient spheres with a specular highlight), the larger imam
/// bead with a brass cap at the bottom of the loop and a swaying tassel.
class _MisbahaPainter extends CustomPainter {
  const _MisbahaPainter({required this.done, required this.total, required this.phase, required this.tapT, required this.pulse});

  final int done;
  final int total;
  final double phase; // 0..1 sway cycle — drives handheld sway + tassel lag
  final double tapT; // 0..1 pop envelope for the just-counted bead
  final double pulse;

  // Wooden bead shading: highlight → base → core shadow.
  static const _wood = [Color(0xFFCBA876), Color(0xFF8B5E34), Color(0xFF46311F)];
  // Counted beads warm into honey amber, like beads polished by use.
  static const _glow = [Color(0xFFFFE3AE), Color(0xFFE2A144), Color(0xFF7E4A12)];

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.46);
    final rx = size.width * 0.36;
    final ry = size.height * 0.30;

    // Soft drop shadow under the whole loop.
    canvas.drawCircle(center.translate(6, 14), rx * 0.98, Paint()..color = const Color(0x2212394F)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16));

    // Lap-completion glow (behind everything, fades in and out).
    if (pulse > 0) {
      final glowStrength = math.sin(pulse * math.pi);
      canvas.drawCircle(
        center,
        rx * (1.02 + 0.10 * glowStrength),
        Paint()
          ..color = const Color(0xFFFF8C2E).withValues(alpha: 0.30 * glowStrength)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 22),
      );
    }

    // The cord the beads are threaded on.
    canvas.drawOval(Rect.fromCenter(center: center, width: (rx + 2) * 2, height: (ry + 2) * 2), Paint()..style = PaintingStyle.stroke..strokeWidth = 3.2..color = const Color(0xFF4A2E14));

    // 33 beads around the loop. The imam bead sits at the bottom (θ = 90°),
    // so beads start just past it and wrap around.
    final beadR = (2 * math.pi * math.sqrt((rx * rx + ry * ry) / 2)) / (total + 1) * 0.50;
    final popT = math.sin(math.pi * tapT); // 0→1→0 pop envelope
    for (var i = 0; i < total; i++) {
      final t = i / total;
      final angle = math.pi / 2 + 2 * math.pi * t; // bottom → right → top → left
      final position = Offset(center.dx + rx * math.cos(angle), center.dy + ry * math.sin(angle));
      final isDone = i < done;
      final edge = i == done - 1 && done < total; // the bead just counted
      final pop = edge ? 0.28 * popT : 0.0;
      _bead(canvas, position, beadR * (1 + pop), isDone ? _glow : _wood);
      if (edge) {
        canvas.drawCircle(position, beadR * (1.6 + pop), Paint()..color = const Color(0x59E2A144)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8));
      } else if (isDone) {
        canvas.drawCircle(position, beadR * 1.55, Paint()..color = const Color(0x2EE2A144)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5));
      }
    }

    // Elongated imam bead + brass cap at the bottom of the loop.
    final imam = Offset(center.dx, center.dy + ry + beadR * 0.9);
    final imamRect = Rect.fromCenter(center: imam, width: beadR * 2.4, height: beadR * 3.4);
    final imamShader = RadialGradient(
      center: const Alignment(-0.35, -0.4),
      radius: 1.15,
      colors: const [Color(0xFFB98A5B), Color(0xFF6B4423), Color(0xFF3A2410)],
      stops: const [0.0, 0.55, 1.0],
    ).createShader(imamRect);
    canvas.drawOval(imamRect, Paint()..shader = imamShader);
    final capRect = Rect.fromCenter(center: Offset(center.dx, center.dy + ry - beadR * 0.7), width: beadR * 1.3, height: beadR * 1.7);
    canvas.drawRRect(
      RRect.fromRectAndRadius(capRect, Radius.circular(beadR * 0.3)),
      Paint()..shader = const RadialGradient(colors: [Color(0xFFF2DFAE), Color(0xFFB8894A)], stops: [0.1, 1.0]).createShader(capRect),
    );

    // Tassel: silk strands hanging from the imam bead, swaying with a slight
    // lag behind the loop like real cord.
    final tasselTop = imam.translate(0, beadR * 1.9);
    final lag = math.sin(phase * 2 * math.pi - 0.55) * 0.09;
    final cosL = math.cos(lag);
    final sinL = math.sin(lag);
    Offset swing(Offset p) => Offset(
          tasselTop.dx + (p.dx - tasselTop.dx) * cosL - (p.dy - tasselTop.dy) * sinL,
          tasselTop.dy + (p.dx - tasselTop.dx) * sinL + (p.dy - tasselTop.dy) * cosL,
        );
    canvas.drawCircle(tasselTop, 3.0, Paint()..color = const Color(0xFFC9A227));
    final strand = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFFA03A2A).withValues(alpha: .85);
    for (final dx in const [-5.0, -3.0, -1.0, 1.0, 3.0, 5.0]) {
      strand.strokeWidth = dx.abs() < 2 ? 1.5 : 2.1;
      final ctrl = swing(tasselTop.translate(dx * 0.6, 16 + dx.abs()));
      final end = swing(tasselTop.translate(dx * 1.5, 30 + dx.abs() * 1.6));
      canvas.drawPath(
        Path()
          ..moveTo(tasselTop.dx, tasselTop.dy + 2)
          ..quadraticBezierTo(ctrl.dx, ctrl.dy, end.dx, end.dy),
        strand,
      );
    }
  }

  /// One polished sphere: radial gradient (light top-left → dark bottom-right),
  /// thin dark rim, and a small specular dot.
  void _bead(Canvas canvas, Offset position, double radius, List<Color> shades) {
    final shader = RadialGradient(
      center: const Alignment(-0.35, -0.4),
      radius: 1.15,
      colors: shades,
      stops: const [0.0, 0.55, 1.0],
    ).createShader(Rect.fromCircle(center: position, radius: radius));
    canvas.drawCircle(position, radius, Paint()..shader = shader);
    canvas.drawCircle(
      position,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = const Color(0xFF3E2A12).withValues(alpha: .5),
    );
    canvas.drawCircle(position.translate(-radius * .32, -radius * .38), radius * .26, Paint()..color = Colors.white.withValues(alpha: .55));
  }

  @override
  bool shouldRepaint(covariant _MisbahaPainter oldDelegate) =>
      oldDelegate.done != done || oldDelegate.total != total || oldDelegate.phase != phase || oldDelegate.tapT != tapT || oldDelegate.pulse != pulse;
}
