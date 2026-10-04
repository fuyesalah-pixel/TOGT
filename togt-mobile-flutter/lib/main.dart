import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'l10n/app_localizations.dart';

import 'navigation/app_navigator.dart';
import 'screens/splash_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/prayer_service.dart';
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
    // Weekly Friday (Jumu'ah) Surat Al-Kahf reminder — armed at every app
    // start with a native weekly repeat so it fires even if the app is not
    // opened again. Also re-armed after any azan rescheduling.
    PrayerService.instance.scheduleFridayKahfReminder().catchError((_) => null);
    // Re-arm the full 7-day azan + custom alarm pool at every start. The
    // schedule() call that used to happen only when the Personal screen was
    // opened left alarms silent whenever the app stayed installed but was
    // not opened for days.
    try {
      final alarms = await CustomAlarm.loadAll();
      final azanOn = (await SharedPreferences.getInstance()).getBool('togt_azan_enabled') ?? true;
      final location = await Geolocator.getLastKnownPosition();
      if (location != null) {
        await PrayerService.instance.schedule(
          PrayerService.instance.calculate(location.latitude, location.longitude),
          enabled: azanOn,
          customAlarms: alarms,
        );
      }
    } catch (_) {}
    // Permissions are asked ONCE, right after the first login (see
    // PermissionService.runAfterLogin + LoginScreen) — never on app open.
    _runStartupUpdateFlow();
    // Background auto-update: checks on connectivity + every 6h, downloads
    // and opens the installer without any manual step (except the OS prompt).
    UpdateService.instance.startAutoUpdateMonitoring();
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
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(
      content: Text(l10n.appUpdated),
      behavior: SnackBarBehavior.floating,
      duration: Duration(seconds: 3),
    ));
  }
  // Regular updates install automatically in the background (see
  // startAutoUpdateMonitoring); only forced updates interrupt with a dialog.
  if (update != null && update.forceUpdate && context.mounted) {
    showUpdateDialog(context, update);
  }
}

/// In release builds a build-phase exception normally paints NOTHING (the
/// black screen users reported on the first language switch, when the whole
/// widget tree rebuilt with new localizations for the first time). Render a
/// self-healing fallback instead so the app can always recover.
final ErrorWidgetBuilder _defaultErrorWidgetBuilder = ErrorWidget.builder;

class TogtApp extends StatefulWidget {
  const TogtApp({super.key});

  @override
  State<TogtApp> createState() => _TogtAppState();
}

class _TogtAppState extends State<TogtApp> {
  @override
  void initState() {
    super.initState();
    // Release-only: flutter_test asserts ErrorWidget.builder is never replaced
    // (and debug builds keep the red error screen anyway).
    if (kDebugMode) return;
    ErrorWidget.builder = (details) {
      // Keep the developer red screen in debug builds.
      if (kDebugMode) return _defaultErrorWidgetBuilder(details);
      return Container(
        color: const Color(0xFF12394F),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(32),
        child: Text(
          'Something went wrong — tap to reload.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white.withOpacity(.85), fontSize: 15),
        ),
      );
    };
  }

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
