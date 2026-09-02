import 'package:flutter/material.dart';

import '../models/package_model.dart';
import '../services/package_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/iata_section.dart';
import '../widgets/gallery_section.dart';
import '../widgets/testimonials_section.dart';
import '../widgets/package_card.dart';
import '../widgets/shimmer_loading.dart';
import 'packages_screen.dart';
import 'service_request_screen.dart';
import 'forms/ticket_form_screen.dart';
import 'forms/umrah_form_screen.dart';
import 'forms/visa_form_screen.dart';
import 'forms/domestic_form_screen.dart';
import 'forms/tourist_form_screen.dart';
import 'forms/foreign_travel_form_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<TPackage>? packages;
  String? error;

  static const heroSlides = [
    HeroSlide(
        imageUrl: '/images/hero/hero-benuna-image-domesetic-1st.jpg',
        title: 'Discover Ethiopia',
        subtitle: 'Domestic tours across the north & south'),
    HeroSlide(
        imageUrl: '/images/hero/hero-umra-2nd.jpg',
        title: 'Umrah 2026',
        subtitle: 'Economy · VIP · Honeymoon packages'),
    HeroSlide(
        imageUrl: '/images/hero/hero-tecketing-3rd.jpg',
        title: 'IATA Ticketing',
        subtitle: 'Best fares on all major airlines'),
    HeroSlide(
        imageUrl: '/images/hero/hero-visa-proccess-5th.jpg',
        title: 'Visa Processing',
        subtitle: 'Visit, medical & family visas made easy'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await PackageService.instance.fetchPackages();
      if (mounted) setState(() => packages = data);
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    }
  }

  Widget _buildFeatured(List<TPackage> featured) {
    if (packages == null) {
      return SizedBox(
        height: 220,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: 3,
          separatorBuilder: (_, __) => const SizedBox(width: 16),
          itemBuilder: (_, __) => const ShimmerPackageCard(),
        ),
      );
    }
    if (error != null) return _ErrorPanel(message: error!, onRetry: _load);
    return SizedBox(
      height: 235,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: featured.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, i) => StaggeredEntrance(
          index: i,
          child: PackageCard(
            package: featured[i],
            width: 250,
            onTap: () => openPackageDetail(context, featured[i]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final featured = (packages ?? []).take(6).toList();
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: TOGTColors.orange,
        onRefresh: () async {
          await _load();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          cacheExtent: 900,
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              sliver: SliverMainAxisGroup(slivers: [
                SliverToBoxAdapter(
                  child: Column(children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: TOGTColors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: TOGTColors.blue.withOpacity(.12)),
                          ),
                          child: Image.asset('assets/logo/togt_mobile_logo.jpg', fit: BoxFit.contain),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('TOGT Tour & Travel', style: TOGTTypography.h3),
                            Text('Where would you like to go?', style: TOGTTypography.small),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 1.02, end: 1),
                      duration: const Duration(milliseconds: 700),
                      curve: Curves.easeOutCubic,
                      child: TextField(
                        readOnly: true,
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const AllPackagesScreen())),
                        decoration: InputDecoration(
                          hintText: 'Search destinations, packages…',
                          prefixIcon: Icon(Icons.search_rounded, color: TOGTColors.orange),
                          suffixIcon: Container(
                            margin: const EdgeInsets.all(6),
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              gradient: TOGTColors.orangeGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.tune_rounded, color: TOGTColors.white),
                          ),
                        ),
                      ),
                      builder: (_, v, child) =>
                          Transform.scale(scale: v, alignment: Alignment.topCenter, child: child!),
                    ),
                  ]),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 22)),
                SliverToBoxAdapter(
                  child: RepaintBoundary(
                    child: HeroCarousel(items: heroSlides),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 26)),
                const SliverToBoxAdapter(
                  child: _SectionHeader(title: 'Services', onSeeAll: null),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 12)),
                SliverToBoxAdapter(
                  child: GridView.count(
                    crossAxisCount: 4,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 8,
                    childAspectRatio: .76,
                    children: const [
                      _Service(icon: Icons.flight_takeoff_rounded, label: 'Tickets', type: 'FLIGHT'),
                      _Service(icon: Icons.mosque_rounded, label: 'Umrah', type: 'UMRAH'),
                      _Service(icon: Icons.landscape_rounded, label: 'Domestic', type: 'DOMESTIC'),
                      _Service(icon: Icons.public_rounded, label: 'Foreign', type: 'FOREIGN'),
                      _Service(icon: Icons.badge_outlined, label: 'Visa', type: 'VISA'),
                      _Service(icon: Icons.business_center_outlined, label: 'Consult', type: 'CONSULTING'),
                      _Service(icon: Icons.phone_in_talk_outlined, label: 'Contact', type: 'CONTACT'),
                      _Service(icon: Icons.card_giftcard_rounded, label: 'Gift', type: 'UMRAH_GIFT'),
                    ],
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 26)),
                SliverToBoxAdapter(
                  child: _SectionHeader(
                      title: 'Featured Packages',
                      onSeeAll: () {
                        Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const AllPackagesScreen()));
                      }),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 14)),
                SliverToBoxAdapter(
                  child: RepaintBoundary(child: _buildFeatured(featured)),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 30)),
                const SliverToBoxAdapter(
                  child: RepaintBoundary(child: IataSection()),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 30)),
                const SliverToBoxAdapter(
                  child: RepaintBoundary(child: GallerySection()),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 30)),
                const SliverToBoxAdapter(
                  child: RepaintBoundary(child: TestimonialsSection()),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: TOGTTypography.h2),
        if (onSeeAll != null)
          GestureDetector(
            onTap: onSeeAll,
            child: Row(children: [
              Text('See all',
                  style: TOGTTypography.button
                      .copyWith(color: TOGTColors.orange, fontSize: 13)),
              Icon(Icons.chevron_right_rounded, size: 18, color: TOGTColors.orange),
            ]),
          ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: TOGTColors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(color: TOGTColors.navy.withOpacity(.06), blurRadius: 12, offset: const Offset(0, 4)),
              ],
            ),
            child: BouncyIcon(icon: icon, size: 25, color: TOGTColors.blue),
          ),
          const SizedBox(height: 8),
          Text(label, style: TOGTTypography.small.copyWith(color: TOGTColors.navy)),
        ],
      ),
    );
  }
}

class _Service extends StatelessWidget {
  const _Service({required this.icon, required this.label, required this.type});
  final IconData icon;
  final String label;
  final String type;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () {
          if (type == 'UMRAH' || type == 'DOMESTIC' || type == 'FOREIGN') {
            final filter = type == 'UMRAH'
                ? PackageFilter.umrah
                : type == 'DOMESTIC'
                    ? PackageFilter.domestic
                    : PackageFilter.foreign;
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => AllPackagesScreen(embedded: false, initialFilter: filter)));
          } else {
            final screen = switch (type) {
              'FLIGHT' => const TicketFormScreen(),
              'UMRAH_GIFT' => const UmrahFormScreen(),
              'VISA' => const VisaFormScreen(),
              'CONSULTING' => const ServiceRequestScreen(serviceType: 'CONSULTING', title: 'Consulting'),
              'CONTACT' => const ServiceRequestScreen(serviceType: 'CONTACT', title: 'Contact Us'),
              'TOURIST' => const TouristFormScreen(),
              _ => const ForeignTravelFormScreen(),
            };
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
          }
        },
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(color: TOGTColors.white, borderRadius: BorderRadius.circular(16), boxShadow: [
              BoxShadow(color: TOGTColors.navy.withOpacity(.06), blurRadius: 10, offset: const Offset(0, 4)),
            ]),
            child: Icon(icon, color: TOGTColors.blue, size: 24),
          ),
          const SizedBox(height: 7),
          Text(label, textAlign: TextAlign.center, style: TOGTTypography.small.copyWith(color: TOGTColors.navy, fontWeight: FontWeight.w700, fontSize: 10.5)),
        ]),
      );
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: TOGTColors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Icon(Icons.wifi_off_rounded, color: TOGTColors.grey, size: 36),
          const SizedBox(height: 10),
          Text('Cannot reach the API',
              style: TOGTTypography.h3),
          const SizedBox(height: 4),
          Text(message, style: TOGTTypography.small, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}