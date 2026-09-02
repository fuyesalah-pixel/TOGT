import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart' show Ticker;

import '../services/api_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

const _airlines = <({String name, String logo})>[
  (name: 'Emirates', logo: '/images/airlines/emirates.jpg'),
  (name: 'Qatar Airways', logo: '/images/airlines/qatar-airways.jpg'),
  (name: 'Turkish Airlines', logo: '/images/airlines/turkish-airlines.jpg'),
  (name: 'EgyptAir', logo: '/images/airlines/egyptair.jpg'),
  (name: 'Air Canada', logo: '/images/airlines/air-canada.jpg'),
  (name: 'Air France', logo: '/images/airlines/air-france.jpg'),
  (name: 'American Airlines', logo: '/images/airlines/american-airlines.jpg'),
  (name: 'British Airways', logo: '/images/airlines/british-airways.jpg'),
];

class IataSection extends StatefulWidget {
  const IataSection({super.key});

  @override
  State<IataSection> createState() => _IataSectionState();
}

class _IataSectionState extends State<IataSection>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1100))
    ..forward();
  late final Animation<double> _fade =
      CurvedAnimation(parent: _c, curve: Curves.easeOut);
  late final Animation<Offset> _slide =
      Tween(begin: const Offset(0, .35), end: Offset.zero)
          .animate(CurvedAnimation(parent: _c, curve: Curves.easeOutCubic));

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 26, 20, 26),
          decoration: const BoxDecoration(
            gradient: TOGTColors.iataGradient,
            borderRadius: BorderRadius.all(Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: TOGTColors.orange,
                    ),
                    child: const Icon(Icons.verified_rounded,
                        color: TOGTColors.white, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'IATA Accredited Member Agency',
                      style: TOGTTypography.small.copyWith(
                          color: TOGTColors.orange,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text('Proud IATA Member Agency',
                  style: TOGTTypography.h2.copyWith(color: TOGTColors.white)),
              const SizedBox(height: 8),
              Text(
                'We work with the International Air Transport Association (IATA) — '
                'connecting you to over 370 member airlines across 120+ countries, '
                'covering 85% of global air traffic.',
                style: TOGTTypography.body.copyWith(
                    color: TOGTColors.white.withOpacity(.82), height: 1.5),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  _Counter(value: 370, suffix: '+', label: 'Member Airlines'),
                  const _DividerDot(),
                  _Counter(value: 120, suffix: '+', label: 'Countries'),
                  const _DividerDot(),
                  _Counter(value: 85, suffix: '%', label: 'Global Air Traffic'),
                ],
              ),
              const SizedBox(height: 26),
              const _TrustCard(
                  icon: Icons.verified_rounded, label: 'IATA Accredited'),
              const SizedBox(height: 12),
              const _TrustCard(
                  icon: Icons.trending_up_rounded, label: 'Transparent Fares'),
              const SizedBox(height: 12),
              const _TrustCard(
                  icon: Icons.public_rounded, label: 'Global Reach'),
              const SizedBox(height: 22),
              const _AirlineMarquee(),
            ],
          ),
        ),
      ),
    );
  }
}

class _Counter extends StatelessWidget {
  const _Counter({required this.value, required this.suffix, required this.label});

  final int value;
  final String suffix;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          _CountUp(value: value, suffix: suffix),
          const SizedBox(height: 4),
          Text(label,
              textAlign: TextAlign.center,
              style: TOGTTypography.small.copyWith(
                  color: TOGTColors.white.withOpacity(.8), fontSize: 11.5)),
        ],
      ),
    );
  }
}

class _CountUp extends StatefulWidget {
  const _CountUp({required this.value, required this.suffix});

  final int value;
  final String suffix;

  @override
  State<_CountUp> createState() => _CountUpState();
}

class _CountUpState extends State<_CountUp>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1600))
    ..forward();
  late final Animation<double> _anim =
      CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, child) {
        final count = (widget.value * _anim.value).round();
        return Text('$count${widget.suffix}',
            style: TOGTTypography.display.copyWith(
                color: TOGTColors.orange,
                fontWeight: FontWeight.w800,
                fontSize: 26));
      },
    );
  }
}

class _DividerDot extends StatelessWidget {
  const _DividerDot();

  @override
  Widget build(BuildContext context) =>
      Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: TOGTColors.white.withOpacity(.4)));
}

class _TrustCard extends StatelessWidget {
  const _TrustCard({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: TOGTColors.white.withOpacity(.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: TOGTColors.white.withOpacity(.12)),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: TOGTColors.orange.withOpacity(.18),
            ),
            child: Icon(icon, color: TOGTColors.orange, size: 19),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: TOGTTypography.small.copyWith(
                    color: TOGTColors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5)),
          ),
          Icon(Icons.check_circle_outline_rounded,
              color: TOGTColors.orange.withOpacity(.9), size: 18),
        ],
      ),
    );
  }
}

class _AirlineLogo extends StatelessWidget {
  const _AirlineLogo({required this.name, required this.logo});

  final String name;
  final String logo;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            padding: const EdgeInsets.all(5),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: TOGTColors.white,
            ),
            child: ClipOval(
              child: Image.network(
                ApiService.instance.resolveImageUrl(logo),
                fit: BoxFit.contain,
                cacheWidth: 96,
                errorBuilder: (_, __, ___) => Icon(Icons.flight_rounded,
                    color: TOGTColors.blue, size: 20),
                loadingBuilder: (context, child, progress) =>
                    progress == null
                        ? child
                        : const SizedBox.shrink(),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(name,
              style: TOGTTypography.small.copyWith(
                  color: TOGTColors.white.withOpacity(.85), fontSize: 10)),
        ],
      ),
    );
  }
}

class _AirlineMarquee extends StatefulWidget {
  const _AirlineMarquee();

  @override
  State<_AirlineMarquee> createState() => _AirlineMarqueeState();
}

class _AirlineMarqueeState extends State<_AirlineMarquee>
    with SingleTickerProviderStateMixin {
  final ScrollController _scroll = ScrollController();
  late final Ticker _ticker = createTicker(_onTick);
  Duration _last = Duration.zero;

  static const _speed = 30.0;

  @override
  void initState() {
    super.initState();
    _ticker.start();
  }

  void _onTick(Duration elapsed) {
    if (!mounted || !_scroll.hasClients) return;
    final max = _scroll.position.maxScrollExtent;
    if (max <= 0) return;
    final dt = (elapsed - _last).inMicroseconds / 1000000;
    _last = elapsed;
    if (dt <= 0 || dt > 1) return;
    final half = max / 2;
    final next = _scroll.offset + _speed * dt;
    _scroll.jumpTo(next >= half ? next - half : next);
  }

  @override
  void dispose() {
    _ticker.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = [..._airlines, ..._airlines];
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          color: TOGTColors.white.withOpacity(.07),
          child: SingleChildScrollView(
            controller: _scroll,
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            child: Row(
              children: [
                for (final airline in items)
                  _AirlineLogo(name: airline.name, logo: airline.logo),
              ],
            ),
          ),
        ),
      ),
    );
  }
}