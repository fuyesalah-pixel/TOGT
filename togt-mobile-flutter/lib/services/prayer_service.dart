import 'package:adhan/adhan.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

/// Schedules azan notifications for prayer times and plays the azan audio.
///
/// Alarm reliability notes:
///  - `AndroidScheduleMode.exactAllowWhileIdle` fires on time even in Doze
///    (falls back to `inexactAllowWhileIdle` when the user has not granted
///    the exact-alarm special access).
///  - Notifications are scheduled for a rolling 7-day window (56 alarms) and
///    rescheduled whenever the Personal screen opens, so the pool never runs
///    dry while the app stays installed.
///  - Full-screen intents + azan sound + ongoing-style priority make the
///    notification visible on the lock screen, and tapping it plays the azan.
class PrayerService {
  PrayerService._();
  static final instance = PrayerService._();
  final notifications = FlutterLocalNotificationsPlugin();
  final audio = AudioPlayer();
  bool _ready = false;

  Future<void> initialize() async {
    if (_ready) return;
    tz.initializeTimeZones();
    await notifications.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (_) => playAzan(),
    );
    await notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    _ready = true;
  }

  PrayerTimes calculate(double latitude, double longitude) =>
      PrayerTimes.today(Coordinates(latitude, longitude), CalculationMethod.umm_al_qura.getParameters());

  Future<void> playAzan() async {
    await audio.stop();
    await audio.play(AssetSource('audio/azan.mp3'));
  }

  NotificationDetails get _details {
    const android = AndroidNotificationDetails(
      'azan_channel',
      'Azan Alarms',
      channelDescription: 'Prayer time notifications',
      importance: Importance.max,
      priority: Priority.max,
      sound: RawResourceAndroidNotificationSound('azan'),
      playSound: true,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
      autoCancel: true,
    );
    const ios = DarwinNotificationDetails(
      sound: 'azan.mp3',
      presentSound: true,
      presentAlert: true,
      interruptionLevel: InterruptionLevel.timeSensitive,
    );
    return const NotificationDetails(android: android, iOS: ios);
  }

  bool _exactSupported = true;

  Future<void> schedule(PrayerTimes times, {bool enabled = true}) async {
    await initialize();
    await notifications.cancelAll();
    if (!enabled) return;

    final prayers = {
      'Fajr': times.fajr,
      'Dhuhr': times.dhuhr,
      'Asr': times.asr,
      'Maghrib': times.maghrib,
      'Isha': times.isha,
    };

    // Ask for (and prefer) exact alarm permission on Android 12+.
    try {
      final plugin = notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      final canExact = await plugin?.canScheduleExactNotifications();
      _exactSupported = canExact ?? false;
      if (_exactSupported) {
        await plugin?.requestExactAlarmsPermission();
      }
    } catch (_) {
      _exactSupported = false;
    }
    final mode = _exactSupported ? AndroidScheduleMode.exactAllowWhileIdle : AndroidScheduleMode.inexactAllowWhileIdle;

    final now = DateTime.now();
    // Rolling 7-day window: each prayer scheduled once per day for 7 days.
    for (final entry in prayers.entries) {
      var when = entry.value;
      if (!when.isAfter(now)) when = when.add(const Duration(days: 1));
      for (var day = 0; day < 7; day++) {
        final fire = when.add(Duration(days: day));
        final id = (entry.key.hashCode + day * 31) & 0x7fffffff;
        try {
          await notifications.zonedSchedule(
            id: id,
            title: '${entry.key} Prayer',
            body: 'It is time for ${entry.key} prayer. Tap to hear the azan.',
            scheduledDate: tz.TZDateTime.from(fire, tz.local),
            notificationDetails: _details,
            androidScheduleMode: mode,
          );
        } catch (_) {
          // Individual schedule failures must not abort the remaining alarms.
        }
      }
    }
  }
}
