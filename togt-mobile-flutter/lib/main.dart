import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'theme/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  try { await AuthService.instance.loadSession().timeout(const Duration(seconds: 8)); } catch (_) {}
  runApp(const TogtApp());
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    NotificationService.instance.initialize().catchError((_) => false);
  });
}

class TogtApp extends StatelessWidget {
  const TogtApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TOGT Travel',
      debugShowCheckedModeBanner: false,
      theme: TOGTTheme.light,
      home: const SplashScreen(),
    );
  }
}
