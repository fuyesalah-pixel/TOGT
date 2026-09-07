import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleService {
  LocaleService._();
  static final instance = LocaleService._();
  static const _key = 'togt_locale';
  final ValueNotifier<Locale?> locale = ValueNotifier<Locale?>(null);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_key);
    if (value == 'en' || value == 'ar' || value == 'am') locale.value = Locale(value!);
  }

  Future<void> setLocale(String languageCode) async {
    if (!{'en', 'ar', 'am'}.contains(languageCode)) return;
    locale.value = Locale(languageCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, languageCode);
  }
}
