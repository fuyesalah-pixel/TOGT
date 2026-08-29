import 'dart:async';

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/colors.dart';
import 'shimmer_loading.dart';

class HeroCarousel extends StatefulWidget {
  const HeroCarousel({super.key, required this.items});

  final List<HeroSlide> items;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class HeroSlide {
  const HeroSlide({required this.imageUrl, required this.title, this.subtitle});
  final String imageUrl;
  final String title;
  final String? subtitle;
}

class _HeroCarouselState extends State<HeroCarousel>
    with SingleTickerProviderStateMixin {
  final PageController _controller = PageController(viewportFraction: .92);
  Timer? _timer;
  int _page = 0;

  late final AnimationController _fade =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 600))
        ..forward();

  @override
  void initState() {
    super.initState();
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) async {
      if (!mounted || widget.items.isEmpty) return;
      final next = (_page + 1) % widget.items.length;
      await _controller.animateToPage(next,
          duration: const Duration(milliseconds: 550), curve: Curves.easeOutCubic);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    _fade.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return SizedBox(
        height: 190,
        child: const ShimmerLoading(borderRadius: 24),
      );
    }
    return FadeTransition(
      opacity: CurvedAnimation(parent: _fade, curve: Curves.easeOut),
      child: Column(
        children: [
          SizedBox(
            height: 190,
            child: PageView.builder(
              controller: _controller,
              itemCount: widget.items.length,
              onPageChanged: (i) => setState(() => _page = i),
              itemBuilder: (context, i) {
                final slide = widget.items[i];
                final active = i == _page;
                return AnimatedScale(
                  scale: active ? 1 : .93,
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOut,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.network(
                            ApiService.instance.resolveImageUrl(slide.imageUrl),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              decoration:
                                  const BoxDecoration(gradient: TOGTColors.blueGradient),
                              child: const Center(
                                  child: Icon(Icons.flight_takeoff_rounded,
                                      color: TOGTColors.white, size: 48)),
                            ),
                          ),
                          DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  TOGTColors.navy.withOpacity(.85),
                                  Colors.transparent,
                                ],
                                stops: const [0, .65],
                              ),
                            ),
                          ),
                          Positioned(
                            left: 18,
                            right: 18,
                            bottom: 18,
                            child: TweenAnimationBuilder<double>(
                              tween: Tween(begin: active ? 0 : 0.001, end: active ? 1 : 1),
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeOutBack,
                              builder: (_, v, child) =>
                                  Transform.translate(offset: Offset(0, 20 * (1 - v)), child: Opacity(opacity: v, child: child)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(slide.title,
                                      style: const TextStyle(
                                          color: TOGTColors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.w800)),
                                  if (slide.subtitle != null) ...[
                                    const SizedBox(height: 4),
                                    Text(slide.subtitle!,
                                        style: TextStyle(
                                            color: TOGTColors.white.withOpacity(.85),
                                            fontSize: 13)),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.items.length, (i) {
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: i == _page ? 22 : 7,
                height: 7,
                decoration: BoxDecoration(
                  color: i == _page ? TOGTColors.orange : TOGTColors.lightGrey,
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
