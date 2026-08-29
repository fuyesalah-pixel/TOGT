import 'package:flutter/material.dart';
import '../theme/colors.dart';

class ShimmerLoading extends StatefulWidget {
  const ShimmerLoading({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 16,
    this.child,
  });

  final double? width;
  final double? height;
  final double borderRadius;
  final Widget? child;

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
        ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(color: TOGTColors.lightGrey.withOpacity(.55)),
              Positioned(
                left: -(widget.width ?? 300),
                top: 0,
                bottom: 0,
                width: (widget.width ?? 300) * .9,
                child: Transform.translate(
                  offset: Offset(_c.value * ((widget.width ?? 300) * 2.2), 0),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.transparent,
                          Colors.white.withOpacity(.75),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              if (widget.child != null) widget.child!,
            ],
          ),
        );
      },
    );
  }
}

class ShimmerPackageCard extends StatelessWidget {
  const ShimmerPackageCard({super.key, this.width = 260});

  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: width,
            height: 150,
            child: const ShimmerLoading(borderRadius: 20),
          ),
          const SizedBox(height: 10),
          ShimmerLoading(width: width * .8, height: 14, borderRadius: 7),
          const SizedBox(height: 6),
          ShimmerLoading(width: width * .5, height: 12, borderRadius: 6),
        ],
      ),
    );
  }
}
