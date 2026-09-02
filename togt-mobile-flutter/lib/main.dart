import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'navigation/app_navigator.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/update_service.dart';
import 'theme/theme.dart';
import 'widgets/update_dialog.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  try { await AuthService.instance.loadSession().timeout(const Duration(seconds: 8)); } catch (_) {}
  runApp(const TogtApp());
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    NotificationService.instance.initialize().catchError((_) => false);
    _runStartupUpdateFlow();
  });
}

Future<void> _runStartupUpdateFlow() async {
  await Future<void>.delayed(const Duration(milliseconds: 2500));
  final updated = await UpdateService.instance.consumeInstallToast();
  final update = await UpdateService.instance.checkForUpdate();
  final context = AppNavigator.navigatorKey.currentContext;
  if (context == null) return;
  if (updated) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(const SnackBar(
      content: Text('App updated successfully!'),
      behavior: SnackBarBehavior.floating,
      duration: Duration(seconds: 3),
    ));
  }
  if (update != null && context.mounted) {
    showUpdateDialog(context, update);
  }
}

class TogtApp extends StatelessWidget {
  const TogtApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TOGT Travel',
      debugShowCheckedModeBanner: false,
      navigatorKey: AppNavigator.navigatorKey,
      theme: TOGTTheme.light,
      home: const SplashScreen(),
    );
  }
}
