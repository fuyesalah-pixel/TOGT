import 'package:flutter/material.dart';

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
  int _index = 0;

  late final List<Widget> _tabs = [
    const HomeScreen(),
    PackagesScreen(onOpenUmrah: () => setState(() => _index = 1)),
    const PersonalScreen(),
    const ChatHomeScreen(),
    const ProfileScreen(),
  ];

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
        onTap: (i) => setState(() => _index = i),
      ),
    );
  }
}
