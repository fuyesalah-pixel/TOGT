import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../l10n/app_localizations.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// Runtime permission orchestration.
///
/// On first open (and every open afterwards) the app asks for:
///  - fine/coarse location  → prayer times + Qibla
///  - notifications         → azan alarms + chat messages (Android 13+)
/// Photos/files do not need a runtime permission: the system photo picker is
/// used for attachments, and APK installs are granted per-app via the special
/// "install unknown apps" screen (opened automatically from the update flow).
///
/// If the user permanently denied a permission we surface a dialog that opens
/// the app's system settings page instead of silently failing forever.
class PermissionService {
  PermissionService._();
  static final PermissionService instance = PermissionService._();

  static const _channel = MethodChannel('togt/permissions');
  static const _askedKey = 'togt_permissions_intro_shown';
  static const _backgroundKey = 'togt_background_location_explained';

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _prompting = false;

  /// Runs ONCE, right after the FIRST successful login. Shows the intro
  /// dialog, requests the permissions, and records completion. After that the
  /// app never asks again (unless the user re-enables the flow from Personal →
  /// "Permissions" which resets the flow).
  Future<void> runAfterLogin(BuildContext context) async {
    if (_prompting) return;
    // Already asked once ("don't ask again unless turned off") — the user can
    // re-enable the flow from Personal → Permissions.
    if (await hasCompletedIntro) return;
    _prompting = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final l10n = AppLocalizations.of(context);

      final proceed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (_) => _introDialog(context, l10n),
      );
      await prefs.setBool(_askedKey, true);
      if (proceed != true) return;
      if (!context.mounted) return;
      await requestMissing();
    } finally {
      _prompting = false;
    }
  }

  /// True once the post-login permission flow has completed. When it has, the
  /// app must not nag again on every open ("don't ask again unless turned
  /// off"). The user can re-enable prompts from the Personal screen.
  Future<bool> get hasCompletedIntro async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_askedKey) ?? false;
  }

  /// LOCATION IS SPECIAL: tracking and prayer tools only work when it is ON,
  /// so unlike the other permissions this one is re-checked on EVERY visit.
  /// If the user turned location off (or permanently denied it), we ask again
  /// with an explainer and — when the OS no longer shows the dialog — take
  /// them straight to the app's settings page. Call right after login.
  Future<void> ensureLocationOnVisit(BuildContext context) async {
    if (_prompting) return;
    try {
      final permission = await Geolocator.checkPermission();
      final serviceOn = await Geolocator.isLocationServiceEnabled();
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        // Granted — now push for "Allow all the time" so trip tracking keeps
        // working off-screen (background location). Explained once.
        if (permission != LocationPermission.always && context.mounted) await _askBackgroundLocation(context);
        return;
      }
      if (serviceOn && permission == LocationPermission.denied) {
        // OS dialog is still available — request directly.
        await Geolocator.requestPermission();
        final after = await Geolocator.checkPermission();
        if (after == LocationPermission.whileInUse && context.mounted) await _askBackgroundLocation(context);
        return;
      }
      // Permanently denied (or service off): dialog → system settings.
      if (!context.mounted) return;
      final l10n = AppLocalizations.of(context);
      final proceed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: Row(children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.location_on_rounded, color: TOGTColors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(l10n.locationBackgroundTitle, style: TOGTTypography.h3)),
          ]),
          content: Text(l10n.locationBackgroundBody, style: TOGTTypography.body),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(l10n.permissionLater)),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: TOGTColors.orange),
              onPressed: () => Navigator.pop(dialogContext, true),
              child: Text(l10n.permissionOpenSettings),
            ),
          ],
        ),
      );
      if (proceed == true) await openAppSettings();
    } catch (_) {
      // Never block login because of a permission crash.
    }
  }

  /// One-time explainer for upgrading to background ("Allow all the time")
  /// location, then a redirect to the settings page where Android exposes it.
  Future<void> _askBackgroundLocation(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_backgroundKey) ?? false) return;
    await prefs.setBool(_backgroundKey, true);
    if (!context.mounted) return;
    final l10n = AppLocalizations.of(context);
    final proceed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Row(children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.travel_explore_rounded, color: TOGTColors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(l10n.locationBackgroundTitle, style: TOGTTypography.h3)),
        ]),
        content: Text(l10n.locationBackgroundBody, style: TOGTTypography.body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: Text(l10n.permissionLater)),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: TOGTColors.orange),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(l10n.permissionOpenSettings),
          ),
        ],
      ),
    );
    if (proceed == true) await openAppSettings();
  }

  /// Reset the stored state so the next login shows the permission flow again.
  Future<void> resetFlow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_askedKey);
    await prefs.remove('togt_perm_settings_nag');
  }

  /// Quietly check + request anything still missing WITHOUT dialogs. Only
  /// called from explicit user action (Personal → Permissions) or the one-time
  /// post-login flow — never automatically on app open.
  Future<void> ensureAll(BuildContext context) async {
    if (_prompting) return;
    _prompting = true;
    try {
      final missing = await missingPermissions();
      if (missing.isEmpty) return;
      if (!context.mounted) return;
      await requestMissing();
    } finally {
      _prompting = false;
    }
  }

  /// Returns the list of permissions that are not granted right now.
  Future<List<String>> missingPermissions() async {
    final missing = <String>[];
    final location = await Geolocator.checkPermission();
    if (location == LocationPermission.denied || location == LocationPermission.deniedForever || location == LocationPermission.unableToDetermine) {
      missing.add('location');
    }
    try {
      final granted = await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.areNotificationsEnabled();
      if (granted == false) missing.add('notifications');
    } catch (_) {}
    return missing;
  }

  Future<void> requestMissing() async {
    final missing = await missingPermissions();
    if (missing.contains('location')) {
      try {
        var permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          // User picked "don't ask again" flow or skipped; service disabled.
        }
      } catch (_) {}
    }
    if (missing.contains('notifications')) {
      try {
        await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();
      } catch (_) {}
    }
  }

  /// True when the OS will show this app's notifications at all. When this
  /// is false every azan alarm is silently swallowed (Android 13+).
  Future<bool> notificationsEnabled() async {
    try {
      final enabled = await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.areNotificationsEnabled();
      return enabled ?? true;
    } catch (_) {
      return true;
    }
  }

  /// True when the OS will honour exact alarm scheduling for azan.
  Future<bool> canScheduleExactAlarms() async {
    try {
      return await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.canScheduleExactNotifications() ?? true;
    } catch (_) {
      return true;
    }
  }

  /// Opens the system page where the user grants exact-alarm access.
  Future<void> openExactAlarmSettings() async {
    try {
      await _channel.invokeMethod('openExactAlarmSettings');
    } catch (_) {}
  }

  /// Opens this app's page in the system Settings app.
  Future<void> openAppSettings() async {
    try {
      await _channel.invokeMethod('openAppSettings');
    } catch (_) {
      try {
        await Geolocator.openAppSettings();
      } catch (_) {}
    }
  }

  /// Opens the "install unknown apps" screen for this app, where the user
  /// allows APK installs coming from the in-app update flow.
  Future<void> openInstallPermissionSettings() async {
    try {
      await _channel.invokeMethod('openInstallPermissionSettings');
    } catch (_) {
      try {
        await openAppSettings();
      } catch (_) {}
    }
  }

  Widget _introDialog(BuildContext context, AppLocalizations l10n) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Row(children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.verified_user_rounded, color: TOGTColors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(l10n.permissionTitle, style: TOGTTypography.h3)),
        ]),
        content: Text(l10n.permissionBody, style: TOGTTypography.body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.permissionLater)),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: TOGTColors.orange),
            onPressed: () => Navigator.pop(context, true),
            child: Text(l10n.permissionGrant),
          ),
        ],
      );
}
