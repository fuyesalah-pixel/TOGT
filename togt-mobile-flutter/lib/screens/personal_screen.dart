import 'dart:math' as math;
import 'dart:async';
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
  bool _azan = true;
  bool _exactAlarmHintShown = false;
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
    _loadTasbih();
    _loadLocation();
  }

  Future<void> _loadTasbih() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _tasbih = prefs.getInt('togt_tasbih_count') ?? 0);
  }

  Future<void> _saveTasbih() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('togt_tasbih_count', _tasbih);
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
        if (_azan && !_exactAlarmHintShown && _times != null) _exactAlarmBanner(),
      ]);

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
         _hero(Icons.fingerprint_rounded, l10n.azkar, l10n.tapToCount),
        const SizedBox(height: 30),
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
  _Azkar(arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', transliteration: 'A\u2018ūdhu billāhi minash-shayṭānir-rajīm. Allāhu lā ilāha illā huwal-ḥayyul-qayyūm...', meaning: 'Ayat al-Kursi — whoever recites it in the morning is protected until evening.', count: 1),
  _Azkar(arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', transliteration: 'Qul huwa Allāhu aḥad... (Sūrat al-Ikhlāṣ)', meaning: 'Recite 3 times — equals reciting the whole Quran.', count: 3),
  _Azkar(arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ...', transliteration: 'Qul a\u2018ūdhu birabbil-falaq... (Sūrat al-Falaq)', meaning: 'Recite 3 times for protection.', count: 3),
  _Azkar(arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ...', transliteration: 'Qul a\u2018ūdhu birabbin-nās... (Sūrat an-Nās)', meaning: 'Recite 3 times for protection.', count: 3),
  _Azkar(arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', transliteration: 'Aṣbaḥnā wa aṣbaḥal-mulku lillāh...', meaning: 'We have entered the morning and with it all dominion belongs to Allah.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', transliteration: 'Allāhumma bika aṣbaḥnā...', meaning: 'O Allah, by You we enter the morning and evening, live and die, and to You is the resurrection.', count: 1),
  _Azkar(arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ...', transliteration: 'Allāhumma anta rabbī lā ilāha illā anta... (Sayyid al-Istighfār)', meaning: 'The master of supplications — said once in the morning.', count: 1),
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
  _Azkar(arabic: 'قراءة آية الكرسي: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', transliteration: 'Āyat al-Kursī', meaning: 'Whoever recites it before sleep has a guardian from Allah all night.', count: 1),
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

/// A real misbaha-style dial: 33 beads arranged in a ring, a rotating pointer,
/// and the current count in the middle. Each tap advances one bead with a
/// haptic tick; the ring visually completes at 33 and keeps counting.
class _TasbihDial extends StatelessWidget {
  const _TasbihDial({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final completed = count % 33 == 0 && count > 0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 280,
        height: 280,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: completed ? TOGTColors.orangeGradient : TOGTColors.blueGradient,
          boxShadow: [
            BoxShadow(
              color: (completed ? TOGTColors.orange : TOGTColors.blue).withOpacity(.35),
              blurRadius: 28,
              spreadRadius: 2,
            ),
          ],
        ),
        child: AnimatedRotation(
          turns: count / 33,
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
          child: CustomPaint(
            painter: _TasbihPainter(progress: (count % 33) / 33, completed: completed),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$count',
                    style: const TextStyle(fontSize: 56, color: TOGTColors.white, fontWeight: FontWeight.w800),
                  ),
                  Text(
                    '${count % 33}/33',
                    style: TextStyle(fontSize: 14, color: TOGTColors.white.withOpacity(.75), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TasbihPainter extends CustomPainter {
  const _TasbihPainter({required this.progress, required this.completed});
  final double progress;
  final bool completed;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 22;

    // Progress arc
    final arcPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round
      ..color = TOGTColors.orange;
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, 2 * math.pi * progress, false, arcPaint);

    // 33 beads
    const beads = 33;
    final beadPaint = Paint()..color = TOGTColors.white.withOpacity(.92);
    final doneBeadPaint = Paint()..color = TOGTColors.orange;
    final highlightPaint = Paint()
      ..color = TOGTColors.white.withOpacity(.35)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
    for (var i = 0; i < beads; i++) {
      final angle = -math.pi / 2 + (2 * math.pi * i / beads);
      final position = Offset(center.dx + radius * math.cos(angle), center.dy + radius * math.sin(angle));
      final done = i < (progress == 0 ? (completed ? beads : 0) : progress * beads);
      canvas.drawCircle(position, 5.5, done ? doneBeadPaint : beadPaint);
      canvas.drawCircle(position - const Offset(1.5, 1.5), 2, highlightPaint);
    }

    // Decorative inner ring
    final innerPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = TOGTColors.white.withOpacity(.25);
    canvas.drawCircle(center, radius - 16, innerPaint);
  }

  @override
  bool shouldRepaint(covariant _TasbihPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.completed != completed;
}
