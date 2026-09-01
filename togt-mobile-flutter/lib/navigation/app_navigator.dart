import 'package:flutter/material.dart';

import '../screens/home_shell.dart';
import '../screens/login_screen.dart';
import '../services/auth_service.dart';

/// Global navigation helpers so any screen (e.g. forms, profile) can route
/// back to a known location without a stack web of callbacks.
class AppNavigator {
  AppNavigator._();

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Shared home tab index so external actions (e.g. "Go to Home" after a
  /// successful form) can force the home tab even when pushed deep in a stack.
  static final ValueNotifier<int> homeTab = ValueNotifier<int>(0);

  static void _switchTab(int index) => homeTab.value = index;

  /// Pops everything and lands on the home tab of [HomeShell].
  static void goHome({int tab = 0}) {
    _switchTab(tab);
    navigatorKey.currentState?.popUntil((route) => route.isFirst);
    if (AuthService.instance.isLoggedIn) {
      navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeShell()),
        (route) => false,
      );
    } else {
      goToLogin();
    }
  }

  /// Pops everything and lands on the [LoginScreen].
  static void goToLogin() {
    _switchTab(0);
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }
}
