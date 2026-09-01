import 'package:flutter/material.dart';

import '../models/review_item.dart';
import '../services/content_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'package_card.dart';
import 'shimmer_loading.dart';

class TestimonialsSection extends StatefulWidget {
  const TestimonialsSection({super.key});

  @override
  State<TestimonialsSection> createState() => _TestimonialsSectionState();
}

class _TestimonialsSectionState extends State<TestimonialsSection> {
  List<ReviewItem>? _reviews;
  String? _error;
  int _visible = 3;
  static const _pageSize = 3;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ContentService.instance.fetchVisibleReviews();
      if (mounted) setState(() {
        _reviews = data;
        _visible = _pageSize;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'Testimonials', subtitle: 'What our travelers say'),
        const SizedBox(height: 14),
        if (_reviews == null && _error == null)
          const _ReviewsSkeleton()
        else if (_error != null)
          _ReviewsError(message: _error!, onRetry: _load)
        else if (_reviews!.isEmpty)
          const _EmptyReviews()
        else ...[
          for (var i = 0; i < _visible && i < _reviews!.length; i++) ...[
            StaggeredTestimonialCard(
              index: i,
              review: _reviews![i],
            ),
            const SizedBox(height: 12),
          ],
          if (_visible < _reviews!.length) ...[
            const SizedBox(height: 6),
            Center(
              child: TextButton.icon(
                onPressed: () => setState(
                    () => _visible = (_visible + _pageSize).clamp(0, _reviews!.length)),
                icon: const Icon(Icons.expand_more_rounded, color: TOGTColors.orange),
                label: const Text('See More Reviews',
                    style: TextStyle(color: TOGTColors.orange)),
              ),
            ),
          ] else if (_reviews!.length > _pageSize) ...[
            const SizedBox(height: 6),
            Center(
              child: TextButton.icon(
                onPressed: () => setState(() => _visible = _pageSize),
                icon: const Icon(Icons.expand_less_rounded, color: TOGTColors.grey),
                label: const Text('Show Less',
                    style: TextStyle(color: TOGTColors.grey)),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: TOGTTypography.h2),
      const SizedBox(height: 4),
      Text(subtitle, style: TOGTTypography.small),
    ]);
  }
}

class _ReviewsSkeleton extends StatelessWidget {
  const _ReviewsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      ShimmerLoading(height: 140, borderRadius: 18),
      const SizedBox(height: 12),
      ShimmerLoading(height: 140, borderRadius: 18),
    ]);
  }
}

class _ReviewsError extends StatelessWidget {
  const _ReviewsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: TOGTColors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(children: [
        const Icon(Icons.rate_review_outlined, color: TOGTColors.grey, size: 32),
        const SizedBox(height: 8),
        Text('Reviews unavailable', style: TOGTTypography.h3),
        const SizedBox(height: 4),
        Text(message, style: TOGTTypography.small, textAlign: TextAlign.center),
        const SizedBox(height: 10),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
  }
}

class _EmptyReviews extends StatelessWidget {
  const _EmptyReviews();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: TOGTColors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Column(children: [
        Icon(Icons.star_border_rounded, color: TOGTColors.grey, size: 30),
        SizedBox(height: 8),
        Text('No reviews yet', style: TextStyle(color: TOGTColors.grey)),
      ]),
    );
  }
}

class StaggeredTestimonialCard extends StatelessWidget {
  const StaggeredTestimonialCard({super.key, required this.review, required this.index});

  final ReviewItem review;
  final int index;

  @override
  Widget build(BuildContext context) {
    return StaggeredEntrance(
      index: index,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: TOGTColors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: TOGTColors.navy.withOpacity(.05),
                blurRadius: 14,
                offset: const Offset(0, 5)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AnimatedStars(rating: review.rating),
            const SizedBox(height: 10),
            Text('“${review.text}”',
                style: TOGTTypography.body.copyWith(color: TOGTColors.navy)),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [TOGTColors.blue, TOGTColors.orange],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Text(
                    review.name.isNotEmpty ? review.name[0].toUpperCase() : 'T',
                    style: const TextStyle(
                        color: TOGTColors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(review.name, style: TOGTTypography.h3),
                      const SizedBox(height: 2),
                      Row(children: [
                        const Icon(Icons.verified_rounded,
                            size: 14, color: TOGTColors.green),
                        const SizedBox(width: 4),
                        Text('Verified TOGT customer',
                            style: TOGTTypography.small.copyWith(fontSize: 11.5)),
                      ]),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class AnimatedStars extends StatefulWidget {
  const AnimatedStars({super.key, required this.rating});

  final int rating;

  @override
  State<AnimatedStars> createState() => _AnimatedStarsState();
}

class _AnimatedStarsState extends State<AnimatedStars>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..forward();
  late final Animation<double> _t =
      CurvedAnimation(parent: _c, curve: Curves.elasticOut);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      builder: (context, child) => Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(5, (i) {
          final shown = i < widget.rating;
          final step = (_t.value * 5 - i).clamp(0.0, 1.0).toDouble();
          return Opacity(
            opacity: step,
            child: Transform.scale(
              scale: 0.5 + 0.5 * Curves.elasticOut.transform(step),
              child: Icon(
                shown ? Icons.star_rounded : Icons.star_outline_rounded,
                color: TOGTColors.orange,
                size: 22,
              ),
            ),
          );
        }),
      ),
    );
  }
}
