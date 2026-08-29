import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/auth_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import 'home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..forward();

  late final fade = CurvedAnimation(parent: _c, curve: Curves.easeOut);
  late final slide =
      Tween<Offset>(begin: const Offset(0, .3), end: Offset.zero)
          .animate(CurvedAnimation(parent: _c, curve: Curves.easeOutBack));

  bool _busy = false;

  Future<void> _signIn() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final user = await AuthService.instance.signInWithGoogle();
      if (user == null) return;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Signed in as ${user.name} (${user.role.name})')));
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeShell()));
    } on PlatformException catch (e) {
      debugPrint('Google sign-in error: ${e.code} ${e.message} ${e.details}');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Google sign-in failed (${e.code}). Check Google account setup and try again.')));
    } catch (e) {
      final message = e.toString().contains('Google OAuth') || e.toString().contains('401')
          ? 'Google sign-in is not available yet. Please try again later.'
          : 'Unable to sign in right now. Please try again.';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(decoration: BoxDecoration(gradient: TOGTColors.blueGradient)),
          Positioned(
            top: -80,
            right: -60,
            child: _Bubble(size: 260, color: TOGTColors.white.withOpacity(.06)),
          ),
          Positioned(
            bottom: -60,
            left: -50,
            child: _Bubble(size: 220, color: TOGTColors.orange.withOpacity(.12)),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: fade,
              child: Column(
                children: [
                  Expanded(
                    flex: 5,
                    child: Center(
                      child: SlideTransition(
                        position: slide,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(30),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: TOGTColors.white,
                                boxShadow: [
                                  BoxShadow(
                                      color: Colors.black.withOpacity(.18),
                                      blurRadius: 30,
                                      offset: const Offset(0, 12)),
                                ],
                              ),
                               child: Image.asset('assets/logo/togt_mobile_logo.jpg', width: 120, height: 120, fit: BoxFit.contain),
                            ),
                            const SizedBox(height: 24),
                            const Text('Welcome aboard',
                                style: TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w800,
                                    color: TOGTColors.white)),
                            const SizedBox(height: 8),
                            Text('Sign in to book your next journey',
                                style: TextStyle(
                                    fontSize: 14.5,
                                    color: TOGTColors.white.withOpacity(.75))),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(28, 36, 28, 24),
                      decoration: const BoxDecoration(
                        color: TOGTColors.white,
                        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
                      ),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                             if (_busy)
                               Container(height: 54, decoration: BoxDecoration(gradient: TOGTColors.blueGradient, borderRadius: BorderRadius.circular(18)), child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: TOGTColors.white)), SizedBox(width: 12), Text('Connecting to Google...', style: TextStyle(color: TOGTColors.white, fontWeight: FontWeight.w700))]))
                             else
                               AnimatedButton(label: 'Continue with Google', icon: Icons.g_mobiledata_rounded, gradient: TOGTColors.blueGradient, onPressed: _signIn),
                          ],
                        ),
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

class _Bubble extends StatelessWidget {
  const _Bubble({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
