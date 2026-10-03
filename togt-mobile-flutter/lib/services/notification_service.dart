import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../navigation/app_navigator.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  try { await Firebase.initializeApp(); } catch (_) {}
}
class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();
  bool enabled = false;

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  bool _localReady = false;

  /// Shows incoming FCM messages while the app is in the foreground (when the
  /// app is backgrounded/terminated Android shows them without our help).
  Future<void> _ensureLocalNotifications() async {
    if (_localReady) return;      await _local.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );
    _localReady = true;
  }

  /// Registers the current FCM token with the backend. Called at app start
  /// (if already signed in) and again after every successful login so tokens
  /// always exist for users who signed in before granting notifications.
  Future<void> registerDeviceToken() async {
    if (!enabled || !ApiService.instance.hasToken) return;
    try {
      final messaging = FirebaseMessaging.instance;
      final token = await messaging.getToken().timeout(const Duration(seconds: 8));
      if (token != null) {
        await ApiService.instance.post('/users/device-token', body: {'token': token});
      }
    } catch (_) {}
  }

  Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging
          .requestPermission(alert: true, badge: true, sound: true)
          .timeout(const Duration(seconds: 5))
          .then<void>((_) => null, onError: (_) => null);
      await _ensureLocalNotifications();
      messaging.onTokenRefresh.listen((value) async {
        try {
          if (ApiService.instance.hasToken) await ApiService.instance.post('/users/device-token', body: {'token': value});
        } catch (_) {}
      });
      // Foreground: Android does not auto-display FCM notifications while the
      // app is open, so show them ourselves (chat, admin messages, reminders).
      FirebaseMessaging.onMessage.listen((message) async {
        try {
          await _ensureLocalNotifications();
          final notification = message.notification;
          if (notification == null) return;
          final id = (message.messageId?.hashCode ?? DateTime.now().millisecondsSinceEpoch) & 0x7fffffff;
          await _local.show(
            id: id,
            title: notification.title ?? 'TOGT',
            body: notification.body ?? '',
            notificationDetails: const NotificationDetails(
              android: AndroidNotificationDetails(
                'fcm_channel',
                'Messages & alerts',
                channelDescription: 'Support chat, admin messages and reminders',
                importance: Importance.high,
                priority: Priority.high,
                styleInformation: BigTextStyleInformation(''),
              ),
              iOS: DarwinNotificationDetails(presentAlert: true, presentSound: true),
            ),
            payload: message.data['kind']?.toString(),
          );
        } catch (_) {}
      });
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        // Tapping a notification while the app was backgrounded: chat messages
        // open the chat tab (it loads fresh), anything else lands on home.
        final kind = message.data['kind']?.toString() ?? '';
        AppNavigator.goHome(tab: kind.contains('chat') ? 2 : 0);
      });
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);
      // Register any existing token right away — but only when the user is
      // already signed in; fresh logins register via registerDeviceToken().
      await registerDeviceToken();
      enabled = true;
    } catch (_) {
      enabled = false;
    }
  }
}
