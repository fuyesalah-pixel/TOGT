import 'dart:convert';

import 'package:adhan/adhan.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

/// A user-created alarm (Personal → Prayer times → Custom alarms), stored in
/// SharedPreferences and fired with the azan sound like the prayer alarms.
class CustomAlarm {
  CustomAlarm({required this.id, required this.hour, required this.minute, this.label = '', this.enabled = true});

  final String id;
  final int hour;
  final int minute;
  final String label;
  bool enabled;

  Map<String, dynamic> toJson() => {'id': id, 'hour': hour, 'minute': minute, 'label': label, 'enabled': enabled};
  factory CustomAlarm.fromJson(Map<String, dynamic> json) => CustomAlarm(
        id: json['id']?.toString() ?? '',
        hour: (json['hour'] as num?)?.toInt() ?? 6,
        minute: (json['minute'] as num?)?.toInt() ?? 0,
        label: json['label']?.toString() ?? '',
        enabled: json['enabled'] != false,
      );

  static Future<List<CustomAlarm>> loadAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('togt_custom_alarms');
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = (jsonDecode(raw) as List).map((e) => CustomAlarm.fromJson(e as Map<String, dynamic>)).toList();
      return list;
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveAll(List<CustomAlarm> alarms) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('togt_custom_alarms', jsonEncode(alarms.map((a) => a.toJson()).toList()));
  }
}

/// Schedules azan notifications for prayer times, user-created custom alarms
/// and the weekly Friday (Jumu'ah) Surat Al-Kahf reminder, and plays the azan
/// audio when a notification is tapped.
///
/// Alarm reliability notes:
///  - `AndroidScheduleMode.exactAllowWhileIdle` fires on time even in Doze
///    (falls back to `inexactAllowWhileIdle` when the user has not granted
///    the exact-alarm special access).
///  - Prayer + custom alarms are scheduled for a rolling 7-day window and
///    rescheduled whenever the Personal screen opens, so the pool never runs
///    dry while the app stays installed.
///  - The Friday reminder uses a native WEEKLY repeat
///    (`matchDateTimeComponents: dayOfWeekAndTime`), so one scheduling call
///    keeps firing every Friday without the app ever reopening.
///  - Full-screen intents + azan sound + max priority make the notifications
///    visible on the lock screen; tapping plays the azan.
class PrayerService {
  PrayerService._();
  static final instance = PrayerService._();
  final notifications = FlutterLocalNotificationsPlugin();
  final audio = AudioPlayer();
  bool _ready = false;

  /// Notification id reserved for the weekly Friday Al-Kahf reminder.
  static const fridayKahfId = 424242;

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

  /// Gentle reminder style for the Friday Al-Kahf notice (no azan sound).
  NotificationDetails get _reminderDetails {
    const android = AndroidNotificationDetails(
      'reminders_channel',
      'Reminders',
      channelDescription: 'Friday Al-Kahf and other reminders',
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(''),
    );
    const ios = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      interruptionLevel: InterruptionLevel.timeSensitive,
    );
    return const NotificationDetails(android: android, iOS: ios);
  }

  bool _exactSupported = true;

  Future<void> _resolveScheduleMode() async {
    try {
      final plugin = notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      final canExact = await plugin?.canScheduleExactNotifications();
      _exactSupported = canExact ?? false;
      if (_exactSupported) await plugin?.requestExactAlarmsPermission();
    } catch (_) {
      _exactSupported = false;
    }
  }

  AndroidScheduleMode get _scheduleMode =>
      _exactSupported ? AndroidScheduleMode.exactAllowWhileIdle : AndroidScheduleMode.inexactAllowWhileIdle;

  /// (Re)schedules everything: the 5 daily prayer alarms for the next 7 days
  /// (when azan alarms are enabled) plus every enabled custom alarm.
  Future<void> schedule(PrayerTimes times, {bool enabled = true, List<CustomAlarm> customAlarms = const []}) async {
    await initialize();
    await notifications.cancelAll();
    if (!enabled && customAlarms.where((a) => a.enabled).isEmpty) return;

    await _resolveScheduleMode();
    final now = DateTime.now();

    if (enabled) {
      final prayers = {
        'Fajr': times.fajr,
        'Dhuhr': times.dhuhr,
        'Asr': times.asr,
        'Maghrib': times.maghrib,
        'Isha': times.isha,
      };
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
              androidScheduleMode: _scheduleMode,
            );
          } catch (_) {
            // Individual schedule failures must not abort the remaining alarms.
          }
        }
      }
    }

    // Custom alarms: next 7 occurrences of each (daily recurrence).
    for (final alarm in customAlarms.where((a) => a.enabled)) {
      final base = DateTime(now.year, now.month, now.day, alarm.hour, alarm.minute);
      var first = base.isAfter(now) ? base : base.add(const Duration(days: 1));
      final stableId = alarm.id.hashCode & 0x7fffffff;
      for (var day = 0; day < 7; day++) {
        final fire = first.add(Duration(days: day));
        try {
          await notifications.zonedSchedule(
            id: (stableId + day * 7) & 0x7fffffff,
            title: alarm.label.isEmpty ? 'Alarm' : alarm.label,
            body: 'Your TOGT custom alarm. Tap to hear the azan.',
            scheduledDate: tz.TZDateTime.from(fire, tz.local),
            notificationDetails: _details,
            androidScheduleMode: _scheduleMode,
          );
        } catch (_) {}
      }
    }

    // cancelAll() above also removed the weekly Friday reminder — re-arm it
    // so the Jumu'ah Al-Kahf notice survives any prayer re-scheduling.
    await scheduleFridayKahfReminder();
  }

  /// Schedules the weekly Friday (Jumu'ah) Surat Al-Kahf reminder at 11:30
  /// device-local time with a native WEEKLY repeat — it keeps firing every
  /// Friday even if the app is not opened again. Safe to call on every app
  /// start: the fixed id replaces the previous schedule.
  Future<void> scheduleFridayKahfReminder() async {
    await initialize();
    final now = DateTime.now();
    var next = DateTime(now.year, now.month, now.day, 11, 30);
    // DateTime.weekday: Monday=1 … Friday=5, Sunday=7.
    while (next.weekday != DateTime.friday || !next.isAfter(now)) {
      next = next.add(const Duration(days: 1));
    }
    try {
      await notifications.zonedSchedule(
        id: fridayKahfId,
        title: "Jumu'ah Mubarak 🕌",
        body: 'Read Surat Al-Kahf today — the sunnah for Friday. Have a blessed Jumu\'ah!',
        scheduledDate: tz.TZDateTime.from(next, tz.local),
        notificationDetails: _reminderDetails,
        androidScheduleMode: _scheduleMode,
        matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
      );
    } catch (_) {}
  }
}
