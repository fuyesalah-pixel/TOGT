import 'package:flutter/material.dart';

import '../navigation/app_navigator.dart';
import '../widgets/bottom_nav_bar.dart';
import 'chat_home_screen.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'packages_screen.dart';
import 'personal_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int get _index => AppNavigator.homeTab.value;

  late final List<Widget> _tabs = [
    const HomeScreen(),
    PackagesScreen(onOpenUmrah: () => AppNavigator.homeTab.value = 1),
    const PersonalScreen(),
    const ChatHomeScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    AppNavigator.homeTab.addListener(_onTabChanged);
  }

  void _onTabChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    AppNavigator.homeTab.removeListener(_onTabChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        switchInCurve: Curves.easeOut,
        transitionBuilder: (child, a) => FadeTransition(opacity: a, child: child),
        child: KeyedSubtree(
          key: ValueKey(_index),
          child: _tabs[_index],
        ),
      ),
      bottomNavigationBar: TogtNavBar(
        currentIndex: _index,
        onTap: (i) => AppNavigator.homeTab.value = i,
      ),
    );
  }
}
