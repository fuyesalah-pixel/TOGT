import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

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

  bool get hasToken => _accessToken != null;
  String? get accessToken => _accessToken;

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
    _refreshToken = refreshToken ?? _refreshToken;
  }
  void saveCookie(http.Response response) {
    final setCookie = response.headers['set-cookie'];
    if (setCookie == null || setCookie.isEmpty) return;
    final values = setCookie.split(',').map((item) => item.split(';').first.trim()).toList();
    _cookieHeader = values.where((item) => item.isNotEmpty).join('; ');
  }
  void clearTokens() { _accessToken = null; _refreshToken = null; _cookieHeader = null; }

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
    if (response.statusCode == 401 && retry && _refreshToken != null && path != '/auth/refresh') {
      final refreshed = await _refresh();
      if (refreshed) return _send(method, path, query: query, body: body, retry: false);
    }
    return response;
  }

  Future<bool> _refresh() async {
    try {
      final headers = {'Content-Type': 'application/json', if (_cookieHeader != null) 'Cookie': _cookieHeader!, if (_accessToken != null) 'Authorization': 'Bearer $_accessToken'};
      final response = await http.post(_uri('/auth/refresh'), headers: headers, body: jsonEncode({'refreshToken': _refreshToken})).timeout(timeout);
      saveCookie(response);
      if (response.statusCode < 200 || response.statusCode >= 300) return false;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      setTokens(accessToken: data['accessToken']?.toString(), refreshToken: data['refreshToken']?.toString());
      return _accessToken != null;
    } catch (_) {
      return false;
    }
  }

  Future<dynamic> upload(String path, String filePath, {String field = 'file', Map<String, String>? query}) async {
    final request = http.MultipartRequest('POST', _uri(path, query));
    request.headers.addAll(_headers..remove('Content-Type'));
    request.files.add(await http.MultipartFile.fromPath(field, filePath));
    final response = await http.Response.fromStream(await request.send().timeout(timeout));
    return _handle(response);
  }

  Future<List<int>> downloadBytes(String path) async {
    final response = await http.get(_uri(path), headers: _headers).timeout(timeout);
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

  Stream<String> sseStream(String path, Map<String, dynamic> body) async* {
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
              data = (j is Map ? (j['content'] ?? j['delta'] ?? j['text'] ?? '') : j).toString();
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
