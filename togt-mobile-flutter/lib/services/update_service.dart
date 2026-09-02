import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

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