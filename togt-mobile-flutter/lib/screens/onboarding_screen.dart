import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  final PageController _controller = PageController();
  int _page = 0;

  late final AnimationController _contentC = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 600), value: 1);

  static const slides = [
    (
      icon: Icons.flight_takeoff_rounded,
      title: 'Welcome to TOGT',
      text: 'Ethiopia\'s IATA-accredited travel partner. Flights, tours, visas — '
          'all in one beautiful app.',
      colors: [Color(0xFF1F67B1), Color(0xFF12394F)],
    ),
    (
      icon: Icons.card_travel_rounded,
      title: 'Book Packages Easily',
      text: 'Umrah journeys, domestic adventures and world tours. Browse, compare '
          'and book in seconds.',
      colors: [Color(0xFFFF9300), Color(0xFFE07C00)],
    ),
    (
      icon: Icons.travel_explore_rounded,
      title: 'Track Your Journey',
      text: 'Chat with our team, follow your bookings and stay updated every step '
          'of the way.',
      colors: [Color(0xFF2BB673), Color(0xFF1F67B1)],
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    _contentC.dispose();
    super.dispose();
  }

  Future<void> _goNext() async {
    if (_page < slides.length - 1) {
      await _contentC.reverse();
      await _controller.nextPage(
          duration: const Duration(milliseconds: 450), curve: Curves.easeOutCubic);
      _contentC.forward();
    } else {
      _finish();
    }
  }

  void _finish() {
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: slides.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (context, i) => _buildSlide(slides[i]),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: _finish,
                  child: Text('Skip',
                      style: TOGTTypography.button.copyWith(color: TOGTColors.grey)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlide(({IconData icon, String title, String text, List<Color> colors}) slide) {
    final (icon: icon, title: title, text: text, colors: colors) = slide;
    return Container(
      color: TOGTColors.white,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FadeTransition(
            opacity: CurvedAnimation(parent: _contentC, curve: Curves.easeOut),
            child: SlideTransition(
              position:
                  Tween<Offset>(begin: const Offset(0, .25), end: Offset.zero)
                      .animate(CurvedAnimation(parent: _contentC, curve: Curves.easeOutBack)),
              child: Container(
                width: 190,
                height: 190,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: colors),
                  boxShadow: [
                    BoxShadow(color: colors.first.withOpacity(.4), blurRadius: 40, offset: const Offset(0, 14)),
                  ],
                ),
                child: Icon(icon, size: 86, color: TOGTColors.white),
              ),
            ),
          ),
          const SizedBox(height: 56),
          FadeTransition(
            opacity: _contentC,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(slides.length, (i) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: i == _page ? 26 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i == _page ? colors.first : TOGTColors.lightGrey,
                        borderRadius: BorderRadius.circular(5),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 36),
                Text(title, style: TOGTTypography.display, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                Text(text,
                    style: TOGTTypography.body.copyWith(fontSize: 15.5, height: 1.55),
                    textAlign: TextAlign.center),
                const SizedBox(height: 48),
                _NavButtons(page: _page, onNext: _goNext, onDone: _finish, color: colors.first),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NavButtons extends StatelessWidget {
  const _NavButtons({required this.page, required this.onNext, required this.onDone, required this.color});

  final int page;
  final VoidCallback onNext;
  final VoidCallback onDone;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final isLast = page == 2;
    return Row(
      children: [
        AnimatedOpacity(
          duration: const Duration(milliseconds: 250),
          opacity: isLast ? 0 : 1,
          child: ElevatedButton.icon(
            onPressed: isLast ? null : onNext,
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            label: const Text('Next'),
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: TOGTColors.white,
              disabledBackgroundColor: TOGTColors.lightGrey,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
        const Spacer(),
        TextButton(
          onPressed: onDone,
          child: Text(isLast ? 'Get Started' : '',
              style: TOGTTypography.button.copyWith(color: color)),
        ),
      ],
    );
  }
}
