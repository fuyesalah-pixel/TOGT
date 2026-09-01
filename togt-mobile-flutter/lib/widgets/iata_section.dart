import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../theme/typography.dart';

const _airlines = <String>[
  'Emirates',
  'Qatar Airways',
  'Turkish Airlines',
  'Saudia',
  'EgyptAir',
  'Air Canada',
  'Air France',
  'American Airlines',
  'British Airways',
  'Delta',
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
                    decoration: BoxDecoration(
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  _TrustBadge(icon: Icons.verified_rounded, label: 'IATA Accredited'),
                  _TrustBadge(icon: Icons.trending_up_rounded, label: 'Transparent Fares'),
                  _TrustBadge(icon: Icons.public_rounded, label: 'Global Reach'),
                ],
              ),
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
                fontFeatures: const [FontFeature.tabularFigures()],
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

class _TrustBadge extends StatelessWidget {
  const _TrustBadge({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: TOGTColors.white.withOpacity(.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: TOGTColors.white.withOpacity(.12)),
      ),
      child: Column(
        children: [
          Icon(icon, color: TOGTColors.orange, size: 20),
          const SizedBox(height: 6),
          Text(label,
              textAlign: TextAlign.center,
              style: TOGTTypography.small.copyWith(
                  color: TOGTColors.white.withOpacity(.9), fontSize: 10.5)),
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

class _AirlineMarqueeState extends State<_AirlineMarquee> {
  final ScrollController _scroll = ScrollController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      if (!mounted || !_scroll.hasClients) return;
      if (_scroll.position.maxScrollExtent > 0 &&
          _scroll.offset >= _scroll.position.maxScrollExtent - 2) {
        _scroll.jumpTo(0);
      }
      _scroll.animateTo(
        _scroll.offset + 1,
        duration: const Duration(milliseconds: 40),
        curve: Curves.linear,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = [..._airlines, ..._airlines];
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        color: TOGTColors.white.withOpacity(.07),
        child: SingleChildScrollView(
          controller: _scroll,
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          child: Row(
            children: items
                .map((name) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Text(name,
                          style: TOGTTypography.h3.copyWith(
                              color: TOGTColors.white.withOpacity(.85),
                              fontSize: 13)),
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}
