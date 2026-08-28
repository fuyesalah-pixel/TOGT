import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  try { await Firebase.initializeApp(); } catch (_) {}
}

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();
  bool enabled = false;

  Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true).timeout(const Duration(seconds: 5)).catchError((_) {});
      messaging.onTokenRefresh.listen((value) async {
        try {
          if (ApiService.instance.hasToken) await ApiService.instance.post('/users/device-token', body: {'token': value});
        } catch (_) {}
      });
      FirebaseMessaging.onMessage.listen((_) {});
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);
      try {
        final token = await messaging.getToken().timeout(const Duration(seconds: 5));
        if (token != null && ApiService.instance.hasToken) await ApiService.instance.post('/users/device-token', body: {'token': token});
      } catch (_) {}
      enabled = true;
    } catch (_) {
      enabled = false;
    }
  }
}
