import 'package:flutter/material.dart';
import '../theme/colors.dart';

class TogtNavBar extends StatelessWidget {
  const TogtNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  static const items = [
    (icon: Icons.home_rounded, activeIcon: Icons.home_filled, label: 'Home'),
    (icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view_rounded, label: 'Packages'),
    (icon: Icons.mosque_outlined, activeIcon: Icons.mosque_rounded, label: 'Personal'),
    (icon: Icons.chat_bubble_outline_rounded, activeIcon: Icons.chat_bubble_rounded, label: 'Chat'),
    (icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(splashColor: Colors.transparent),
      child: Container(
        decoration: BoxDecoration(
          color: TOGTColors.white,
          boxShadow: [
            BoxShadow(
              color: TOGTColors.navy.withOpacity(.08),
              blurRadius: 24,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: List.generate(items.length, (i) {
                final item = items[i];
                final active = i == currentIndex;
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onTap(i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: active ? TOGTColors.blue.withOpacity(.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 1, end: active ? 1.15 : 1),
                            duration: const Duration(milliseconds: 350),
                            curve: Curves.elasticOut,
                            builder: (_, v, child) =>
                                Transform.scale(scale: v, child: child),
                            child: Icon(
                              active ? item.activeIcon : item.icon,
                              size: 24,
                              color:
                                  active ? TOGTColors.blue : TOGTColors.grey.withOpacity(.75),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.label,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                              color: active ? TOGTColors.blue : TOGTColors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
