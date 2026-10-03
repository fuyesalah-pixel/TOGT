import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';

class ApiConfig {
  static const productionBase = 'https://travel.togttrading.com/api';
  static const localBase = 'http://10.0.2.2:3001/api';
  static const webProductionOrigin = 'https://travel.togttrading.com';
  static const webLocalOrigin = 'http://10.0.2.2:3000';

  static bool get useLocal => const bool.fromEnvironment('TOGT_LOCAL_API', defaultValue: false);

  static String get baseUrl => useLocal ? localBase : productionBase;
  static String get webOrigin => useLocal ? webLocalOrigin : webProductionOrigin;
}

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  static const timeout = Duration(seconds: 20);
  String? _accessToken;
  String? _refreshToken;
  String? _cookieHeader;

  /// Set by AuthService: invoked exactly once when a request fails with 401
  /// and the silent refresh cannot recover the session (refresh token
  /// expired/revoked). The handler clears the session and routes to login.
  void Function()? onSessionExpired;

  bool _sessionExpiredHandled = false;

  bool get hasToken => _accessToken != null;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;

  Future<bool> testApiConnection() async {
    try {
      await get('/packages');
      return true;
    } catch (_) {
      return false;
    }
  }

  void setToken(String? token) => _accessToken = token;
  void setTokens({String? accessToken, String? refreshToken}) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    if (accessToken != null) {
      _cookieHeader = 'togt_access=$accessToken${refreshToken == null ? '' : '; togt_refresh=$refreshToken'}';
    }
  }

  /// Clears in-memory auth state (logout + session-expired handoff). The
  /// persisted copies are wiped by the caller (AuthService._clearPersistedSession).
  void clearTokens() {
    _accessToken = null;
    _refreshToken = null;
    _cookieHeader = null;
  }
  void saveCookie(http.Response response) {
    final setCookie = response.headers['set-cookie'];
    if (setCookie == null || setCookie.isEmpty) return;
    final values = setCookie.split(',').map((item) => item.split(';').first.trim()).toList();
    _cookieHeader = values.where((item) => item.isNotEmpty).join('; ');
  }
  /// Central 401 handling — the "auth interceptor": try one silent refresh,
  /// retry the original call once; if the refresh itself fails, clear the
  /// session, notify the app (graceful redirect to login) and surface a
  /// clear error instead of raw 401 noise.
  Future<http.Response> _handleUnauthorized(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
    Map<String, String> formFields = const {},
    String? filePath,
    String field = 'file',
    String? fileType,
  }) async {
    final refreshed = (_refreshToken != null) ? await _refresh() : false;
    if (refreshed) {
      // Exactly one retry — the retried call must not trigger another refresh.
      if (filePath != null) {
        return _sendFile(method, path, formFields, filePath, field: field, fileType: fileType, query: query, retry: false);
      }
      if (formFields.isNotEmpty) return _sendForm(method, path, formFields, retry: false);
      return _send(method, path, query: query, body: body, retry: false);
    }
    await _expireSession();
    throw ApiException('Your session has expired. Please sign in again.', statusCode: 401);
  }

  Future<void> _expireSession() async {
    if (_sessionExpiredHandled) return;
    _sessionExpiredHandled = true;
    clearTokens();
    final handler = onSessionExpired;
    if (handler != null) {
      try { handler(); } catch (_) {}
    }
  }

  /// Called after login so a previous "expired" handoff can fire again if a
  /// later session genuinely expires.
  void resetSessionState() => _sessionExpiredHandled = false;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
        if (_cookieHeader != null) 'Cookie': _cookieHeader!,
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final q = query?.map((k, v) => MapEntry(k, v?.toString() ?? ''));
    q?.removeWhere((k, v) => v.isEmpty);
    return Uri.parse('${ApiConfig.baseUrl}$path')
        .replace(queryParameters: (q == null || q.isEmpty) ? null : q);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _send('GET', path, query: query);
      return _handle(res);
    } on TimeoutException {
      throw ApiException('Connection timed out');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Network error. Check your connection and try again.', statusCode: 0);
    }
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _send('POST', path, body: body);
      return _handle(res);
    } on TimeoutException {
      throw ApiException('Connection timed out');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Network error. Check your connection and try again.', statusCode: 0);
    }
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _send('PATCH', path, body: body);
      return _handle(res);
    } on TimeoutException {
      throw ApiException('Connection timed out');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Network error. Check your connection and try again.', statusCode: 0);
    }
  }

  Future<http.Response> _send(String method, String path, {Map<String, dynamic>? query, Map<String, dynamic>? body, bool retry = true}) async {
    final request = http.Request(method, _uri(path, query))
      ..headers.addAll(_headers)
      ..body = jsonEncode(body ?? {});
    final response = await http.Response.fromStream(await request.send().timeout(timeout));
    saveCookie(response);
    debugPrint('$method $path -> ${response.statusCode} (${_accessToken == null ? 'no auth' : 'auth'})');
    if (response.statusCode == 401) {
      if (retry && path != '/auth/refresh' && path != '/auth/google-mobile') {
        return _handleUnauthorized(method, path, query: query, body: body);
      }
      // Even the final 401 must end the broken session cleanly.
      await _expireSession();
    }
    return response;
  }

  Future<bool> _refresh() async {
    try {
      final headers = {'Content-Type': 'application/json', if (_cookieHeader != null) 'Cookie': _cookieHeader!, if (_accessToken != null) 'Authorization': 'Bearer $_accessToken'};
      final response = await http.post(_uri('/auth/refresh'), headers: headers, body: jsonEncode({'refreshToken': _refreshToken})).timeout(timeout);
      debugPrint('POST /auth/refresh -> ${response.statusCode}');
      saveCookie(response);
      if (response.statusCode < 200 || response.statusCode >= 300) return false;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      setTokens(accessToken: data['accessToken']?.toString(), refreshToken: data['refreshToken']?.toString());
      final prefs = await SharedPreferences.getInstance();
      const secure = FlutterSecureStorage();
       if (_accessToken != null) { await secure.write(key: 'togt_token', value: _accessToken); }
       if (_refreshToken != null) { await secure.write(key: 'togt_refresh', value: _refreshToken); }
       await prefs.remove('togt_token');
       await prefs.remove('togt_refresh');
      return _accessToken != null;
    } catch (_) {
      return false;
    }
  }

  Future<dynamic> upload(String path, String filePath, {String field = 'file', Map<String, String>? query}) async {
    final response = await _sendFile('POST', path, {}, filePath, field: field, query: query?.map((k, v) => MapEntry(k, v.toString())));
    return _handle(response);
  }

  Future<dynamic> postForm(String path, Map<String, String> fields) async {
    final response = await _sendForm('POST', path, fields);
    return _handle(response);
  }

  /// multipart/form-data POST with one file plus string fields
  /// (e.g. chat attachments: receiverId, message, file).
  Future<dynamic> postFile(String path, Map<String, String> fields, String filePath, {String field = 'file', String? fileType}) async {
    final response = await _sendFile('POST', path, fields, filePath, field: field, fileType: fileType);
    return _handle(response);
  }

  /// urlencoded/form POST helper shared by postForm (and retries).
  Future<http.Response> _sendForm(String method, String path, Map<String, String> fields, {bool retry = true}) async {
    final request = http.MultipartRequest(method, _uri(path))
      ..headers.addAll(_headers..remove('Content-Type'))
      ..fields.addAll(fields);
    final response = await http.Response.fromStream(await request.send().timeout(timeout));
    saveCookie(response);
    debugPrint('$method $path (form) -> ${response.statusCode}');
    if (response.statusCode == 401 && retry) {
      return _handleUnauthorized(method, path, formFields: fields);
    }
    return response;
  }

  /// multipart POST helper shared by upload/postFile (and retries).
  Future<http.Response> _sendFile(String method, String path, Map<String, String> fields, String filePath, {String field = 'file', String? fileType, Map<String, dynamic>? query, bool retry = true}) async {
    final request = http.MultipartRequest(method, _uri(path, query))
      ..headers.addAll(_headers..remove('Content-Type'))
      ..fields.addAll(fields);
    // The backend validates the declared content type against its allow-list;
    // Android copy streams can lose the original MIME, so callers pass the
    // extension-derived type explicitly (fromBytes is the reliable way to
    // attach a contentType).
    if (fileType == null) {
      request.files.add(await http.MultipartFile.fromPath(field, filePath));
    } else {
      final bytes = await File(filePath).readAsBytes();
      request.files.add(http.MultipartFile.fromBytes(field, bytes, filename: filePath.split(Platform.pathSeparator).last, contentType: MediaType.parse(fileType)));
    }
    final response = await http.Response.fromStream(await request.send().timeout(timeout));
    saveCookie(response);
    debugPrint('$method $path (multipart) -> ${response.statusCode}');
    if (response.statusCode == 401 && retry) {
      return _handleUnauthorized(method, path, formFields: fields, filePath: filePath, field: field, fileType: fileType, query: query);
    }
    return response;
  }

  Future<List<int>> downloadBytes(String path) async {
    var response = await http.get(_uri(path), headers: _headers).timeout(timeout);
    if (response.statusCode == 401) {
      response = await _handleUnauthorized('GET', path);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) _handle(response);
    return response.bodyBytes;
  }

  dynamic _handle(http.Response res) {
    dynamic body;
    try {
      body = res.body.isNotEmpty ? jsonDecode(res.body) : null;
    } catch (_) {
      body = res.body;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final msg = body is Map
        ? (body['message']?.toString() ?? 'Request failed (${res.statusCode})')
        : 'Request failed (${res.statusCode})';
    throw ApiException(msg, statusCode: res.statusCode);
  }

  String resolveImageUrl(String pathOrUrl) {
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    return '${ApiConfig.webOrigin}$pathOrUrl';
  }

  /// Signed, short-lived URLs for private documents stored as
  /// `r2-private://<key>` (customer request documents). Public http(s) URLs
  /// and bare paths are returned unchanged (resolved against the web origin).
  Future<String> resolveDocumentUrl(String pathOrUrl) async {
    if (pathOrUrl.startsWith('r2-private://')) {
      try {
        final data = await post('/service-requests/documents/signed-url', body: {'key': pathOrUrl});
        final url = data is Map ? data['url']?.toString() : null;
        return (url == null || url.isEmpty) ? pathOrUrl : url;
      } catch (_) {
        return pathOrUrl;
      }
    }
    return resolveImageUrl(pathOrUrl);
  }

  Stream<String> sseStream(String path, Map<String, dynamic> body, {void Function(Map<String, dynamic> meta)? onMeta}) async* {
    final client = http.Client();
    try {
      final req = http.Request('POST', _uri(path))
        ..headers.addAll(_headers)
        ..body = jsonEncode(body);
      final res = await client.send(req).timeout(timeout);
      if (res.statusCode >= 300) {
        throw ApiException('Stream failed (${res.statusCode})', statusCode: res.statusCode);
      }
      await for (final chunk in res.stream.transform(utf8.decoder)) {
        for (final line in chunk.split('\n')) {
          final l = line.trim();
          if (l.startsWith('data:')) {
            var data = l.substring(5).trim();
            if (data == '[DONE]') return;
            try {
              final j = jsonDecode(data);
              if (j is Map) {
                final meta = j['meta'];
                if (meta is Map) {
                  if (onMeta != null) onMeta(meta.cast<String, dynamic>());
                  continue;
                }
                data = (j['chunk'] ?? j['content'] ?? j['delta'] ?? j['text'] ?? '').toString();
              } else {
                data = '$j';
              }
            } catch (_) {}
            if (data.isNotEmpty) yield data;
          }
        }
      }
    } finally {
      client.close();
    }
  }
}
