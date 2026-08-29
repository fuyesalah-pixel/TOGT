import 'package:flutter/material.dart';
import '../theme/colors.dart';
import 'onboarding_screen.dart';
import '../services/auth_service.dart';
import 'home_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );

  late final planeFly = Tween<Offset>(
          begin: const Offset(-1.6, .9), end: const Offset(1.8, -.7))
      .animate(CurvedAnimation(parent: _c, curve: const Interval(0, .55, curve: Curves.easeInOut)));
  late final circleExpand = Tween<double>(begin: 0, end: 1)
      .animate(CurvedAnimation(parent: _c, curve: const Interval(.25, .75, curve: Curves.easeOutCubic)));
  late final logoScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _c, curve: const Interval(.5, .95, curve: Curves.elasticOut)));
  late final taglineOpacity = Tween<double>(begin: 0, end: 1)
      .animate(CurvedAnimation(parent: _c, curve: const Interval(.75, 1)));
  @override
  void initState() {
    super.initState();
    _c.forward();
    Future.delayed(const Duration(milliseconds: 2900), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 500),
         pageBuilder: (_, __, ___) => AuthService.instance.isLoggedIn ? const HomeShell() : const OnboardingScreen(),
        transitionsBuilder: (_, a, __, child) =>
            FadeTransition(opacity: a, child: ScaleTransition(scale: Tween<double>(begin: .96, end: 1).animate(a), child: child)),
      ));
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TOGTColors.white,
      body: Stack(
        fit: StackFit.expand,
        children: [
          AnimatedBuilder(
            animation: _c,
            builder: (context, _) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  Center(
                    child: Container(
                      width: 260 * circleExpand.value,
                      height: 260 * circleExpand.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: TOGTColors.orangeGradient
                            .scale(0.15 + .85 * (circleExpand.value)),
                        boxShadow: [
                          BoxShadow(color: TOGTColors.orange.withOpacity(.4 * circleExpand.value), blurRadius: 60),
                        ],
                      ),
                    ),
                  ),
                  SlideTransition(
                    position: planeFly,
                    child: const Icon(Icons.flight_rounded,
                        size: 54, color: TOGTColors.blue),
                  ),
                  Transform.scale(
                    scale: logoScale.value,
                    child: Container(
                      padding: const EdgeInsets.all(26),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: TOGTColors.white,
                        border: Border.all(color: TOGTColors.blue, width: 3),
                      ),
                       child: Image.asset('assets/logo/togt_mobile_logo.jpg', width: 150, height: 150, fit: BoxFit.contain),
                    ),
                  ),
                ],
              );
            },
          ),
          Positioned(
            bottom: 90,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: taglineOpacity,
              child: Column(
                children: [
                  const Text('Your journey begins here',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: TOGTColors.navy)),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: 130,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: const LinearProgressIndicator(
                        minHeight: 4,
                        valueColor:
                            AlwaysStoppedAnimation(TOGTColors.orange),
                        backgroundColor: TOGTColors.lightGrey,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension _GradientScale on Gradient {
  Gradient scale(double t) => this;
}
