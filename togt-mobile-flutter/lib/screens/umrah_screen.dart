import 'package:flutter/material.dart';

import '../models/package_model.dart';
import '../services/package_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import '../widgets/package_card.dart';
import '../widgets/shimmer_loading.dart';

class UmrahScreen extends StatefulWidget {
  const UmrahScreen({super.key});

  @override
  State<UmrahScreen> createState() => _UmrahScreenState();
}

class _UmrahScreenState extends State<UmrahScreen>
    with SingleTickerProviderStateMixin {
  List<TPackage>? _packages;
  late final AnimationController _pulse = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 2000))
    ..repeat(reverse: true);

  @override
  void initState() {
    super.initState();
    PackageService.instance.fetchPackages().then((v) {
      if (mounted) setState(() => _packages = v.where((p) => p.isUmrah).toList());
    }).catchError((e) {
      if (mounted) setState(() => _packages = []);
    });
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: TOGTColors.blueGradient,
              borderRadius: BorderRadius.circular(26),
            ),
            child: Row(
              children: [
                FadeTransition(
                  opacity: Tween(begin: .55, end: 1.0).animate(_pulse),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: TOGTColors.white.withOpacity(.12),
                    ),
                    child: const Icon(Icons.mosque_rounded,
                        size: 40, color: TOGTColors.orange),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Umrah Journeys',
                          style: TextStyle(
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                              color: TOGTColors.white)),
                      const SizedBox(height: 4),
                      Text('Economy · VIP · Honeymoon · Custom',
                          style:
                              TextStyle(color: TOGTColors.white.withOpacity(.75), fontSize: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('Prayer Tools', style: TOGTTypography.h2),
          const SizedBox(height: 12),
          Row(
            children: [
              _ToolCard(icon: Icons.explore_rounded, label: 'Qibla', color: TOGTColors.green),
              const SizedBox(width: 12),
              _ToolCard(icon: Icons.access_time_filled_rounded, label: 'Prayer Times', color: TOGTColors.blue),
              const SizedBox(width: 12),
              _ToolCard(icon: Icons.notifications_active_rounded, label: 'Azan Alarm', color: TOGTColors.orange),
            ],
          ),
          const SizedBox(height: 26),
          Text('Umrah Packages', style: TOGTTypography.h2),
          const SizedBox(height: 14),
          if (_packages == null)
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: .68,
              children: const [
                ShimmerPackageCard(),
                ShimmerPackageCard(),
                ShimmerPackageCard(),
                ShimmerPackageCard(),
              ],
            )
          else if (_packages!.isEmpty)
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: TOGTColors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(children: [
                Icon(Icons.mosque_outlined, size: 40, color: TOGTColors.grey),
                const SizedBox(height: 10),
                Text('No Umrah packages yet.\nStart the API and seed data to see them.',
                    textAlign: TextAlign.center, style: TOGTTypography.body),
              ]),
            )
          else
            ...List.generate(_packages!.length, (i) {
              final p = _packages![i];
              return StaggeredEntrance(
                index: i,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: PackageCard(
                    package: p,
                    onTap: () {},
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _ToolCard extends StatelessWidget {
  const _ToolCard({required this.icon, required this.label, required this.color});

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: TOGTColors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(color: TOGTColors.navy.withOpacity(.05), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(children: [
          BouncyIcon(icon: icon, size: 27, color: color),
          const SizedBox(height: 8),
          Text(label,
              style: TOGTTypography.small.copyWith(fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }
}
