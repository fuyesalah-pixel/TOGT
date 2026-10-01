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

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _prompting = false;

  /// Call from the home shell on every app open. Shows the intro dialog once,
  /// then quietly re-requests anything that is still missing. Permanently
  /// denied permissions trigger a "open settings" dialog (max once per day).
  Future<void> ensureAll(BuildContext context) async {
    if (_prompting) return;
    _prompting = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final askedBefore = prefs.getBool(_askedKey) ?? false;

      final missing = await missingPermissions();
      if (missing.isEmpty) return;

      if (!context.mounted) return;
      final l10n = AppLocalizations.of(context);
      if (!askedBefore) {
        final proceed = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (_) => _introDialog(context, l10n),
        );
        await prefs.setBool(_askedKey, true);
        if (proceed != true) return;
      }

      await requestMissing();

      final stillMissing = await missingPermissions();
      var permanentlyDenied = false;
      for (final p in stillMissing) {
        final denied = p == 'location' ? await _locationPermanentlyDenied() : await _notificationsPermanentlyDenied();
        if (denied) {
          permanentlyDenied = true;
          break;
        }
      }
      if (permanentlyDenied) {
        final lastSettingsNag = prefs.getInt('togt_perm_settings_nag') ?? 0;
        final now = DateTime.now().millisecondsSinceEpoch;
        if (now - lastSettingsNag > const Duration(hours: 20).inMilliseconds && context.mounted) {
          await prefs.setInt('togt_perm_settings_nag', now);
          await _settingsDialog(context, AppLocalizations.of(context));
        }
      }
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

  Future<bool> _locationPermanentlyDenied() async => await Geolocator.checkPermission() == LocationPermission.deniedForever;

  Future<bool> _notificationsPermanentlyDenied() async {
    // The plugin cannot distinguish permanent denial; treat "still disabled
    // after a request" as needing the settings page.
    try {
      final granted = await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.areNotificationsEnabled();
      return granted == false;
    } catch (_) {
      return false;
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

  Future<void> _settingsDialog(BuildContext context, AppLocalizations l10n) => showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: Text(l10n.permissionTitle, style: TOGTTypography.h3),
          content: Text(l10n.permissionBlockedBody, style: TOGTTypography.body),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.permissionLater)),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: TOGTColors.blue),
              onPressed: () {
                Navigator.pop(context);
                openAppSettings();
              },
              child: Text(l10n.permissionOpenSettings),
            ),
          ],
        ),
      );
}
