import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  static const _userKey = 'togt_user';
  static const _tokenKey = 'togt_token';
  static const _secureStorage = FlutterSecureStorage();
  final GoogleSignIn _google = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: '7080313699-a75362f5tshq150lee3urk4f54bmntk3.apps.googleusercontent.com',
  );

  TUser? _currentUser;

  TUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    final token = prefs.getString(_tokenKey) ?? await _secureStorage.read(key: _tokenKey);
    final refreshToken = prefs.getString('togt_refresh') ?? await _secureStorage.read(key: 'togt_refresh');
    if (raw != null) {
      try {
        _currentUser = TUser.fromJsonMap(jsonDecode(raw));
      } catch (_) {}
    }
    ApiService.instance.setTokens(accessToken: token, refreshToken: refreshToken);
    if (token != null) {
      try {
        final remote = await ApiService.instance.get('/auth/me');
        if (remote is Map<String, dynamic>) await _persist(TUser.fromJson(remote), token, refreshToken);
      } catch (_) {}
    }
  }

  Future<TUser> loginWithGoogle({required String idToken}) async {
    final data = await ApiService.instance.post('/auth/google-mobile', body: {'idToken': idToken});
    final user = TUser.fromJsonMap((data['user'] ?? data) as Map<String, dynamic>);
    await _persist(user, data['accessToken']?.toString(), data['refreshToken']?.toString());
    return user;
  }

  Future<TUser> loginDemo(TUser demoUser) async {
    await _persist(demoUser, null);
    return demoUser;
  }

  Future<void> _persist(TUser user, String? token, [String? refreshToken]) async {
    _currentUser = user;
    ApiService.instance.setTokens(accessToken: token, refreshToken: refreshToken);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    if (token != null) {
      await _secureStorage.write(key: _tokenKey, value: token);
      await prefs.setString(_tokenKey, token);
    }
    if (refreshToken != null) {
      await _secureStorage.write(key: 'togt_refresh', value: refreshToken);
      await prefs.setString('togt_refresh', refreshToken);
    }
  }

  Future<void> logout() async {
    try {
      if (ApiService.instance.hasToken) {
        await ApiService.instance.post('/auth/logout');
      }
    } catch (_) {}
    _currentUser = null;
    ApiService.instance.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_tokenKey);
    await prefs.remove('togt_refresh');
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: 'togt_refresh');
    await _google.signOut();
  }

  Future<void> applyRole(String role) async {
    final user = _currentUser;
    if (user == null) return;
    final next = UserRole.values.firstWhere((item) => item.name == role.toLowerCase(), orElse: () => user.role);
    await _persist(user.withRole(next), ApiService.instance.accessToken);
  }

  Future<TUser?> signInWithGoogle() async {
    final account = await _google.signIn();
    if (account == null) return null;
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) throw ApiException('Google did not return an ID token');
    return loginWithGoogle(idToken: idToken);
  }
}
