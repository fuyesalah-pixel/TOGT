import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class AnimatedButton extends StatefulWidget {
  const AnimatedButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.gradient = TOGTColors.orangeGradient,
    this.foregroundColor = TOGTColors.white,
    this.expanded = true,
    this.height = 54,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Gradient gradient;
  final Color foregroundColor;
  final bool expanded;
  final double height;

  @override
  State<AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<AnimatedButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 160), value: 1);
  bool _loading = false;
  bool _success = false;

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Future<void> _tap() async {
    if (widget.onPressed == null || _loading || _success) return;
    await _c.reverse();
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      widget.onPressed!();
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;
      setState(() {
        _loading = false;
        _success = true;
      });
      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      setState(() => _success = false);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
    if (mounted) await _c.forward();
  }

  @override
  Widget build(BuildContext context) {
    final btn = ScaleTransition(
      scale: Tween<double>(begin: .94, end: 1).animate(
          CurvedAnimation(parent: _c, curve: Curves.easeOutBack)),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: widget.height,
          decoration: BoxDecoration(
            gradient: widget.gradient,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: TOGTColors.orange.withOpacity(.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: _tap,
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _success
                    ? Icon(Icons.check_rounded,
                        key: const ValueKey('ok'), color: widget.foregroundColor, size: 26)
                    : _loading
                        ? SizedBox(
                            key: const ValueKey('load'),
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.4, color: widget.foregroundColor))
                        : Row(
                            key: const ValueKey('label'),
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (widget.icon != null) ...[
                                Icon(widget.icon, color: widget.foregroundColor, size: 20),
                                const SizedBox(width: 8),
                              ],
                              Text(widget.label,
                                  style: TOGTTypography.button
                                      .copyWith(color: widget.foregroundColor)),
                            ],
                          ),
              ),
            ),
          ),
        ),
      ),
    );

    return widget.expanded ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}

class BouncyIcon extends StatefulWidget {
  const BouncyIcon({super.key, required this.icon, this.size = 26, this.color});

  final IconData icon;
  final double size;
  final Color? color;

  @override
  State<BouncyIcon> createState() => _BouncyIconState();
}

class _BouncyIconState extends State<BouncyIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 450), value: 1);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _c.reverse(),
      onTapUp: (_) => _c.forward(),
      onTapCancel: () => _c.forward(),
      child: ScaleTransition(
        scale: Tween<double>(begin: .7, end: 1).animate(
            CurvedAnimation(parent: _c, curve: Curves.elasticOut)),
        child: Icon(widget.icon, size: widget.size, color: widget.color),
      ),
    );
  }
}
