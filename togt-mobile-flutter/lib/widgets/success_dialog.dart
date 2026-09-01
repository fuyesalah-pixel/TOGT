import 'package:flutter/material.dart';

import '../navigation/app_navigator.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'animated_button.dart';

/// Animated success popup shown after a form submission succeeds.
/// Single "Go to Home" action that clears the form behind it and routes home.
class SuccessDialog {
  SuccessDialog._();

  /// Shows the animated success dialog. The form state is cleared by [onGoHome].
  /// Returns once the dialog is dismissed.
  static Future<void> show({
    required BuildContext context,
    required VoidCallback onGoHome,
    String title = 'Request Submitted Successfully!',
    String message = 'Your request has been sent to the TOGT team.',
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: Dialog(
          backgroundColor: TOGTColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _AnimatedSuccessIcon(),
                const SizedBox(height: 20),
                Text(title,
                    textAlign: TextAlign.center,
                    style: TOGTTypography.h2),
                const SizedBox(height: 8),
                Text(message,
                    textAlign: TextAlign.center,
                    style: TOGTTypography.body),
                const SizedBox(height: 24),
                AnimatedButton(
                  label: 'Go to Home',
                  icon: Icons.home_rounded,
                  gradient: TOGTColors.blueGradient,
                  onPressed: () {
                    onGoHome();
                    Navigator.of(context).pop();
                    AppNavigator.goHome();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedSuccessIcon extends StatefulWidget {
  const _AnimatedSuccessIcon();

  @override
  State<_AnimatedSuccessIcon> createState() => _AnimatedSuccessIconState();
}

class _AnimatedSuccessIconState extends State<_AnimatedSuccessIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 650))
    ..forward();
  late final Animation<double> _scale = CurvedAnimation(
      parent: _c,
      curve: const Interval(0, .5, curve: Curves.elasticOut));
  late final Animation<double> _opacity =
      CurvedAnimation(parent: _c, curve: const Interval(.4, 1, curve: Curves.easeOut));

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) => Opacity(
        opacity: _opacity.value,
        child: Transform.scale(scale: _scale.value, child: child),
      ),
      child: Container(
        width: 92,
        height: 92,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: TOGTColors.greenGradient,
          boxShadow: [
            BoxShadow(
                color: TOGTColors.green.withOpacity(.4),
                blurRadius: 24,
                offset: const Offset(0, 8)),
          ],
        ),
        child: const Icon(Icons.check_rounded, color: TOGTColors.white, size: 52),
      ),
    );
  }
}
