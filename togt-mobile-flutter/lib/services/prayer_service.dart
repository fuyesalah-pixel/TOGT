import 'dart:convert';

import 'package:adhan/adhan.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
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
      onDidReceiveNotificationResponse: (response) {
        // The Friday reminder is a gentle notice — no azan audio.
        if (response.id == fridayKahfId) return;
        playAzan();
      },
    );
    // Cold start: the user tapped an alarm notification while the app was
    // fully killed — onDidReceiveNotificationResponse above never fires, so
    // replay the azan from the launch details instead.
    try {
      final launch = await notifications.getNotificationAppLaunchDetails();
      final response = launch?.notificationResponse;
      if ((launch?.didNotificationLaunchApp ?? false) && response != null && response.id != fridayKahfId) {
        // Give the engine a beat so the audio plugin is attached.
        Future.delayed(const Duration(milliseconds: 600), () => playAzan());
      }
    } catch (_) {}
    await notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    // Full-screen alarm intents need the special USE_FULL_SCREEN_INTENT grant
    // on Android 14+ — request it so alarms break through silently-dropped
    // notifications instead of never showing at all.
    try {
      await notifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestFullScreenIntentPermission();
    } catch (_) {}
    // Android freezes notification-channel settings at creation — every time
    // the alarm experience changes, the channel id must move forward (v1:
    // custom asset that could go missing, v2: silent system default). v3
    // plays the bundled azan.mp3 on the ALARM stream so every prayer/custom
    // alarm sounds the azan even when the app was killed. The channel is
    // created EXPLICITLY here (not lazily inside zonedSchedule) so a channel
    // problem can never silently kill the alarm scheduling below.
    for (final legacy in const ['azan_channel', 'azan_alarms_v2']) {
      try {
        await notifications
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
            ?.deleteNotificationChannel(channelId: legacy);
      } catch (e) {
        debugPrint('PrayerService: legacy channel cleanup failed: $e');
      }
    }
    try {
      await notifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(const AndroidNotificationChannel(
            'azan_alarms_v3',
            'Azan Alarms',
            description: 'Prayer time and custom alarms — plays the azan',
            importance: Importance.max,
            playSound: true,
            sound: RawResourceAndroidNotificationSound('azan'),
            audioAttributesUsage: AudioAttributesUsage.alarm,
            enableVibration: true,
          ));
    } catch (e) {
      debugPrint('PrayerService: channel creation failed: $e');
    }
    _ready = true;
  }

  PrayerTimes calculate(double latitude, double longitude) => calculateFor(latitude, longitude);

  /// Pure calculation — safe to call from tests without constructing the
  /// audio/notification plugins.
  static PrayerTimes calculateFor(double latitude, double longitude) =>
      PrayerTimes.today(Coordinates(latitude, longitude), CalculationMethod.umm_al_qura.getParameters());

  Future<void> playAzan() async {
    await audio.stop();
    await audio.play(AssetSource('audio/azan.mp3'));
  }

  NotificationDetails get _details {
    // Play the bundled azan.mp3 as the channel sound on the ALARM stream:
    // the azan itself rings at prayer time even when the app process was
    // killed — no tap required. RawResourceAndroidNotificationSound reads
    // from android/app/src/main/res/raw/azan.mp3 (checked into the repo, so
    // the sound can never go missing the way a downloadable file could).
    const android = AndroidNotificationDetails(
      'azan_alarms_v3',
      'Azan Alarms',
      channelDescription: 'Prayer time and custom alarms — plays the azan',
      importance: Importance.max,
      priority: Priority.max,
      playSound: true,
      sound: RawResourceAndroidNotificationSound('azan'),
      // Route it through the ALARM stream so the OS plays it even in silent
      // mode and breaks through DND.
      audioAttributesUsage: AudioAttributesUsage.alarm,
      enableVibration: true,
      showWhen: false,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
      autoCancel: true,
    );
    const ios = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      // No custom sound name → the default system alert sound plays.
      interruptionLevel: InterruptionLevel.critical,
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
          } catch (e) {
            // Log instead of swallowing: a silent failure here is exactly how
            // "the alarm does not work" shipped unnoticed.
            debugPrint('PrayerService: scheduling ${entry.key} +$day failed: $e');
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
        final fire = first.add(Duration(days: day));          try {
            await notifications.zonedSchedule(
              id: (stableId + day * 7) & 0x7fffffff,
              title: alarm.label.isEmpty ? 'Alarm' : alarm.label,
              body: 'Your TOGT custom alarm. Tap to hear the azan.',
              scheduledDate: tz.TZDateTime.from(fire, tz.local),
              notificationDetails: _details,
              androidScheduleMode: _scheduleMode,
            );
          } catch (e) {
            debugPrint('PrayerService: scheduling custom "${alarm.label}" +$day failed: $e');
          }
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
    } catch (e) {
      debugPrint('PrayerService: Friday reminder scheduling failed: $e');
    }
  }
}
