import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';

import 'navigation/app_navigator.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/permission_service.dart';
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
    _runStartupPermissionFlow();
    _runStartupUpdateFlow();
  });
}

/**
 * Permission flow: runs after the app UI is up so dialogs appear over the
 * home shell. Re-checks on every app open (fix 3): missing runtime
 * permissions are re-requested, permanently denied ones offer a shortcut to
 * the system settings page.
 */
Future<void> _runStartupPermissionFlow() async {
  await Future<void>.delayed(const Duration(milliseconds: 1500));
  final context = AppNavigator.navigatorKey.currentContext;
  if (context == null || !context.mounted) return;
  try {
    await PermissionService.instance.ensureAll(context);
  } catch (_) {
    // Never let the permission flow crash the app (or tests) — the user can
    // still grant permissions later from settings or the Personal screen.
  }
}

Future<void> _runStartupUpdateFlow() async {
  await Future<void>.delayed(const Duration(milliseconds: 4200));
  final updated = await UpdateService.instance.consumeInstallToast();
  final update = await UpdateService.instance.checkForUpdate();
  final context = AppNavigator.navigatorKey.currentContext;
  if (context == null) return;
  final l10n = AppLocalizations.of(context);
  if (updated) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(
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
