import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';

import 'navigation/app_navigator.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/update_service.dart';
import 'services/locale_service.dart';
import 'theme/theme.dart';
import 'widgets/update_dialog.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  try { await AuthService.instance.loadSession().timeout(const Duration(seconds: 8)); } catch (_) {}
  await LocaleService.instance.load();
  runApp(const TogtApp());
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    NotificationService.instance.initialize().catchError((_) => false);
    _runStartupUpdateFlow();
  });
}

Future<void> _runStartupUpdateFlow() async {
  await Future<void>.delayed(const Duration(milliseconds: 4200));
  final updated = await UpdateService.instance.consumeInstallToast();
  final update = await UpdateService.instance.checkForUpdate();
  final context = AppNavigator.navigatorKey.currentContext;
  if (context == null) return;
  final l10n = AppLocalizations.of(context);
  if (updated) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(const SnackBar(
      content: Text(l10n.appUpdated),
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
    return ValueListenableBuilder<Locale?>(
      valueListenable: LocaleService.instance.locale,
      builder: (context, locale, _) => MaterialApp(
        title: 'TOGT Travel',
        debugShowCheckedModeBanner: false,
        navigatorKey: AppNavigator.navigatorKey,
        theme: TOGTTheme.light,
        locale: locale,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const SplashScreen(),
      ),
    );
  }
}
