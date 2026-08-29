import 'package:flutter/material.dart';
import '../models/package_model.dart';
import '../services/api_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class PackageCard extends StatelessWidget {
  const PackageCard({
    super.key,
    required this.package,
    required this.onTap,
    this.width,
  });

  final TPackage package;
  final VoidCallback onTap;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final card = ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Material(
        color: TOGTColors.white,
        elevation: 0,
        child: InkWell(
          onTap: onTap,
          splashColor: TOGTColors.orange.withOpacity(.15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  SizedBox(
                    height: 150,
                    width: double.infinity,
                    child: Hero(
                      tag: 'pkg-${package.id}',
                      child: Image.network(
                        package.image != null
                            ? ApiService.instance.resolveImageUrl(package.image!)
                            : '',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          decoration: const BoxDecoration(gradient: TOGTColors.blueGradient),
                          child: Icon(_iconFor(package.type),
                              color: TOGTColors.white, size: 42),
                        ),
                        loadingBuilder: (context, child, progress) =>
                            progress == null ? child : Container(color: TOGTColors.lightGrey),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: _PriceBadge(
                        price: package.price, currency: package.currency),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(package.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TOGTTypography.h3),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.place_rounded,
                            size: 14, color: TOGTColors.orange),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            package.destination ?? package.type.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TOGTTypography.small,
                          ),
                        ),
                        if (package.duration != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: TOGTColors.blue.withOpacity(.08),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(children: [
                              Icon(Icons.calendar_today_rounded,
                                  size: 11, color: TOGTColors.blue),
                              const SizedBox(width: 4),
                              Text(package.duration!,
                                  style: TOGTTypography.small
                                      .copyWith(color: TOGTColors.blue)),
                            ]),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return width == null
        ? card
        : SizedBox(width: width, child: card);
  }

  static IconData _iconFor(PackageType t) {
    if (t.isUmrah) return Icons.mosque_rounded;
    if (t.isDomestic) return Icons.landscape_rounded;
    return Icons.public_rounded;
  }
}

class _PriceBadge extends StatelessWidget {
  const _PriceBadge({this.price, this.currency});

  final double? price;
  final String? currency;

  @override
  Widget build(BuildContext context) {
    if (price == null) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: TOGTColors.orangeGradient,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: TOGTColors.navy.withOpacity(.25), blurRadius: 8),
        ],
      ),
      child: Text(
        '${currency ?? 'ETB'} ${price!.toStringAsFixed(price! % 1 == 0 ? 0 : 2)}',
        style: const TextStyle(
            color: TOGTColors.white, fontWeight: FontWeight.w800, fontSize: 12.5),
      ),
    );
  }
}

class StaggeredEntrance extends StatefulWidget {
  const StaggeredEntrance({
    super.key,
    required this.index,
    required this.child,
  });

  final int index;
  final Widget child;

  @override
  State<StaggeredEntrance> createState() => _StaggeredEntranceState();
}

class _StaggeredEntranceState extends State<StaggeredEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 500));
  late final curved =
      CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 70 * widget.index.clamp(0, 10)), () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(begin: const Offset(0, .18), end: Offset.zero)
            .animate(curved),
        child: widget.child,
      ),
    );
  }
}
