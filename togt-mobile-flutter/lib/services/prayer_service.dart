import 'package:adhan/adhan.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

class PrayerService {
  PrayerService._();
  static final instance = PrayerService._();
  final notifications = FlutterLocalNotificationsPlugin();
  final audio = AudioPlayer();
  bool _ready = false;

  Future<void> initialize() async {
    if (_ready) return;
    tz.initializeTimeZones();
    await notifications.initialize(settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher'), iOS: DarwinInitializationSettings()));
    await notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();
    _ready = true;
  }

  PrayerTimes calculate(double latitude, double longitude) => PrayerTimes.today(Coordinates(latitude, longitude), CalculationMethod.umm_al_qura.getParameters());

  Future<void> playAzan() => audio.play(AssetSource('audio/azan.mp3'));

  Future<void> schedule(PrayerTimes times, {bool enabled = true}) async {
    await initialize();
    await notifications.cancelAll();
    if (!enabled) return;
    final prayers = {'Fajr': times.fajr, 'Dhuhr': times.dhuhr, 'Asr': times.asr, 'Maghrib': times.maghrib, 'Isha': times.isha};
    for (final entry in prayers.entries) {
      final when = entry.value.isAfter(DateTime.now()) ? entry.value : entry.value.add(const Duration(days: 1));
      await notifications.zonedSchedule(id: entry.key.hashCode, title: '${entry.key} Prayer', body: 'It is time for ${entry.key} prayer.', scheduledDate: tz.TZDateTime.from(when, tz.local), notificationDetails: const NotificationDetails(android: AndroidNotificationDetails('azan_channel', 'Azan Alarms', channelDescription: 'Prayer time notifications', importance: Importance.high, priority: Priority.high, sound: RawResourceAndroidNotificationSound('azan')), iOS: DarwinNotificationDetails(sound: 'azan.mp3')), androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle);
    }
  }
}
