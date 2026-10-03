import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:flutter/material.dart';

import '../l10n/app_localizations.dart';
import '../navigation/app_navigator.dart';
import 'api_service.dart';

class AppUpdateInfo {
  const AppUpdateInfo({
    required this.versionCode,
    required this.versionName,
    required this.apkUrl,
    required this.forceUpdate,
  });

  final int versionCode;
  final String versionName;
  final String apkUrl;
  final bool forceUpdate;

  static AppUpdateInfo? fromJson(Map<String, dynamic> json) {
    final code = json['versionCode'];
    final url = json['apkUrl']?.toString();
    if (code is! int || url == null || url.isEmpty) return null;
    return AppUpdateInfo(
      versionCode: code,
      versionName: json['versionName']?.toString() ?? '',
      apkUrl: url,
      forceUpdate: json['forceUpdate'] == true,
    );
  }
}

class UpdateService {
  UpdateService._();
  static final UpdateService instance = UpdateService._();

  static const _updateBase = String.fromEnvironment('TOGT_UPDATE_BASE',
      defaultValue: 'https://travel.togttrading.com/downloads');
  static const _pendingInstallKey = 'togt_update_installed';

  Uri get _versionUri => Uri.parse('$_updateBase/version.json');

  // ── Auto-update ─────────────────────────────────────────────────────────
  // As soon as the device comes online (and every 6h afterwards) the app
  // checks the version manifest; when a newer build exists it downloads it in
  // the background and opens the system installer by itself. The user only
  // confirms the OS-level install prompt — no manual download or reinstall.
  Timer? _autoTimer;
  bool _checking = false;
  bool _downloading = false;
  int? _lastAutoVersion;

  void startAutoUpdateMonitoring() {
    Connectivity().onConnectivityChanged.listen((results) {
      final connected = results.any((r) => r != ConnectivityResult.none);
      if (connected) _autoCheck(initialDelay: const Duration(seconds: 20));
    });
    _autoTimer?.cancel();
    _autoTimer = Timer.periodic(const Duration(hours: 6), (_) => _autoCheck());
    _autoCheck(initialDelay: const Duration(seconds: 20));
  }

  void stopAutoUpdateMonitoring() {
    _autoTimer?.cancel();
    _autoTimer = null;
  }

  Future<void> _autoCheck({Duration initialDelay = Duration.zero}) async {
    if (initialDelay != Duration.zero) await Future<void>.delayed(initialDelay);
    if (_checking || _downloading) return;
    _checking = true;
    try {
      final update = await checkForUpdate();
      if (update == null || _lastAutoVersion == update.versionCode) return;
      _lastAutoVersion = update.versionCode;
      await downloadAndInstall(update, announce: true);
    } catch (_) {
      // Silent by design — a failed background update retries on the next
      // connectivity change or timer tick.
    } finally {
      _checking = false;
    }
  }

  /// Downloads the APK in the background and opens the system installer.
  /// [announce] shows lightweight snackbars so the user knows what's happening.
  Future<bool> downloadAndInstall(AppUpdateInfo update, {bool announce = false}) async {
    if (_downloading) return false;
    _downloading = true;
    try {
      final context = announce ? AppNavigator.navigatorKey.currentContext : null;
      final l10n = context == null ? null : AppLocalizations.of(context);
      if (l10n != null) _toast(l10n.updatingApp);
      final path = await downloadApk(update, onProgress: (received, total) {});
      await markInstallLaunched();
      if (l10n != null) _toast(l10n.updateInstalling);
      final opened = await installApk(path);
      return opened;
    } finally {
      _downloading = false;
    }
  }

  void _toast(String message) {
    final context = AppNavigator.navigatorKey.currentContext;
    if (context == null) return;
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 3),
    ));
  }

  Future<int> currentVersionCode() async {
    final info = await PackageInfo.fromPlatform();
    return int.tryParse(info.buildNumber) ?? 0;
  }

  Future<AppUpdateInfo?> checkForUpdate() async {
    try {
      final response = await http
          .get(_versionUri)
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return null;
      final data = AppUpdateInfo.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
      if (data == null) return null;
      final current = await currentVersionCode();
      if (data.versionCode > current) return data;
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<String> downloadApk(
    AppUpdateInfo update, {
    required void Function(int received, int? total) onProgress,
  }) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/togt-update-${update.versionCode}.apk');
    if (file.existsSync()) await file.delete();
    final client = http.Client();
    try {
      final request = http.Request('GET', Uri.parse(update.apkUrl));
      final response = await client.send(request);
      if (response.statusCode != 200) {
        throw ApiException('Download failed (${response.statusCode})');
      }
      final total = response.contentLength;
      var received = 0;
      final sink = file.openWrite();
      try {
        await for (final chunk in response.stream) {
          sink.add(chunk);
          received += chunk.length;
          onProgress(received, total);
        }
        await sink.flush();
      } catch (_) {
        await sink.close();
        if (file.existsSync()) await file.delete();
        rethrow;
      }
      await sink.close();
      if (total != null && received < total) {
        if (file.existsSync()) await file.delete();
        throw ApiException('Download incomplete');
      }
      return file.path;
    } finally {
      client.close();
    }
  }

  Future<bool> installApk(String path) async {
    final result = await OpenFilex.open(path,
        type: 'application/vnd.android.package-archive');
    return result.type == ResultType.done;
  }

  Future<void> markInstallLaunched() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_pendingInstallKey, true);
  }

  Future<bool> consumeInstallToast() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getBool(_pendingInstallKey) ?? false;
    if (pending) await prefs.setBool(_pendingInstallKey, false);
    return pending;
  }
}