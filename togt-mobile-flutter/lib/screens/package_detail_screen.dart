import 'package:flutter/material.dart';

import '../models/package_model.dart';
import '../services/api_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import 'booking_screen.dart';

class PackageDetailScreen extends StatefulWidget {
  const PackageDetailScreen({super.key, required this.package});

  final TPackage package;

  @override
  State<PackageDetailScreen> createState() => _PackageDetailScreenState();
}

class _PackageDetailScreenState extends State<PackageDetailScreen> {
  final PageController _gallery = PageController(viewportFraction: .95);
  int _page = 0;

  List<String> get galleryImages {
    final imgs = widget.package.images.isNotEmpty
        ? widget.package.images
        : (widget.package.image != null ? <String>[widget.package.image!] : <String>[]);
    return imgs;
  }

  @override
  void dispose() {
    _gallery.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.package;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: TOGTColors.navy,
            foregroundColor: TOGTColors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'pkg-${p.id}',
                child: Image.network(
                  p.image != null ? ApiService.instance.resolveImageUrl(p.image!) : '',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    decoration: const BoxDecoration(gradient: TOGTColors.blueGradient),
                    child: const Center(
                        child: Icon(Icons.flight_takeoff_rounded, size: 64, color: TOGTColors.white)),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -24),
              child: Container(
                padding: const EdgeInsets.fromLTRB(22, 26, 22, 40),
                decoration: const BoxDecoration(
                  color: TOGTColors.offWhite,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(p.title, style: TOGTTypography.h1),
                        ),
                        if (p.price != null)
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 600),
                            curve: Curves.easeOutBack,
                            builder: (_, v, child) => Transform.scale(scale: v, child: child!),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                gradient: TOGTColors.orangeGradient,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(color: TOGTColors.orange.withOpacity(.4), blurRadius: 14),
                                ],
                              ),
                              child: Text(
                                '${p.currency ?? 'ETB'} ${p.price!.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    color: TOGTColors.white, fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _Chip(icon: Icons.category_rounded, label: p.type.label),
                        if (p.duration != null)
                          _Chip(icon: Icons.schedule_rounded, label: p.duration!),
                        if (p.destination != null)
                          _Chip(icon: Icons.place_rounded, label: p.destination!),
                        _Chip(icon: Icons.group_rounded, label: 'Max ${p.maxMembers}'),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text('About this package', style: TOGTTypography.h2),
                    const SizedBox(height: 8),
                    Text(p.description, style: TOGTTypography.body.copyWith(height: 1.6)),
                    if (galleryImages.length > 1) ...[
                      const SizedBox(height: 24),
                      Text('Gallery', style: TOGTTypography.h2),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 170,
                        child: PageView.builder(
                          controller: _gallery,
                          itemCount: galleryImages.length,
                          onPageChanged: (i) => setState(() => _page = i),
                          itemBuilder: (_, i) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 5),
                            clipBehavior: Clip.antiAlias,
                            decoration:
                                BoxDecoration(borderRadius: BorderRadius.circular(20)),
                            child: Image.network(
                              ApiService.instance.resolveImageUrl(galleryImages[i]),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  Container(color: TOGTColors.lightGrey),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(galleryImages.length, (i) {
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: i == _page ? 18 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _page ? TOGTColors.orange : TOGTColors.lightGrey,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          );
                        }),
                      ),
                    ],
                    if (p.includes.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text('What\'s included', style: TOGTTypography.h2),
                      const SizedBox(height: 10),
                      ...p.includes.map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 7),
                            child: Row(children: [
                              const Icon(Icons.check_circle_rounded,
                                  size: 18, color: TOGTColors.green),
                              const SizedBox(width: 8),
                              Expanded(child: Text(e, style: TOGTTypography.body)),
                            ]),
                          )),
                    ],
                    if (p.excludes.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text('Not included', style: TOGTTypography.h2),
                      const SizedBox(height: 10),
                      ...p.excludes.map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 7),
                            child: Row(children: [
                              const Icon(Icons.cancel_rounded, size: 18, color: TOGTColors.red),
                              const SizedBox(width: 8),
                              Expanded(child: Text(e, style: TOGTTypography.body)),
                            ]),
                          )),
                    ],
                    const SizedBox(height: 32),
                    AnimatedButton(
                      label: 'Book Now',
                      icon: Icons.airplane_ticket_rounded,
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => BookingScreen(package: p))),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: TOGTColors.blue.withOpacity(.07),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: TOGTColors.blue),
        const SizedBox(width: 6),
        Text(label,
            style: TOGTTypography.small.copyWith(color: TOGTColors.blue, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
