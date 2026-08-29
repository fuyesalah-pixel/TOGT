import 'package:flutter/material.dart';

import '../models/package_model.dart';
import '../services/package_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/package_card.dart';
import '../widgets/shimmer_loading.dart';
import 'package_detail_screen.dart';

class PackagesScreen extends StatelessWidget {
  const PackagesScreen({super.key, this.onOpenUmrah});

  final VoidCallback? onOpenUmrah;

  @override
  Widget build(BuildContext context) {
    return const AllPackagesScreen(embedded: true);
  }
}

class AllPackagesScreen extends StatefulWidget {
  const AllPackagesScreen({super.key, this.embedded = false, this.initialFilter = PackageFilter.all});

  final bool embedded;
  final PackageFilter initialFilter;

  @override
  State<AllPackagesScreen> createState() => _AllPackagesScreenState();
}

enum PackageFilter { all, umrah, domestic, tourist, foreign, custom }

class _AllPackagesScreenState extends State<AllPackagesScreen>
    with SingleTickerProviderStateMixin {
  List<TPackage> _packages = [];
  bool _loading = true;
  String? _error;
  String _query = '';
  late PackageFilter _filter;

  late final AnimationController _tabC =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 350), value: 1);

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await PackageService.instance.fetchPackages(forceRefresh: force);
      if (mounted) setState(() => _packages = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _filter = widget.initialFilter;
    _load();
  }

  void _setFilter(PackageFilter f) async {
    await _tabC.reverse();
    setState(() => _filter = f);
    _tabC.forward();
  }

  List<TPackage> get _filtered {
    Iterable<TPackage> list = _packages;
    switch (_filter) {
      case PackageFilter.umrah:
        list = list.where((p) => p.isUmrah);
        break;
      case PackageFilter.domestic:
        list = list.where((p) => p.type.isDomestic);
        break;
      case PackageFilter.tourist:
        list = list.where((p) => p.type.value == 'TOURIST_PREBUILT');
        break;
      case PackageFilter.foreign:
        list = list.where((p) => p.type.isForeign);
        break;
      case PackageFilter.custom:
        list = list.where((p) => p.type.value.endsWith('CUSTOM'));
        break;
      case PackageFilter.all:
        break;
    }
    final q = _query.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((p) =>
          p.title.toLowerCase().contains(q) ||
          (p.destination ?? '').toLowerCase().contains(q));
    }
    return list.toList();
  }

  @override
  Widget build(BuildContext context) {
    final body = RefreshIndicator(
      color: TOGTColors.orange,
      onRefresh: () => _load(force: true),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Explore Packages', style: TOGTTypography.h1),
                    const SizedBox(height: 6),
                    Text('${_filtered.length} journeys available',
                        style: TOGTTypography.small),
                    const SizedBox(height: 16),
                    TextField(
                      onChanged: (v) => setState(() => _query = v),
                      decoration: InputDecoration(
                        hintText: 'Search packages…',
                        prefixIcon: Icon(Icons.search_rounded, color: TOGTColors.orange),
                      ),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      height: 40,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _chip('All', PackageFilter.all),
                          _chip('Umrah', PackageFilter.umrah),
                          _chip('Domestic', PackageFilter.domestic),
                          _chip('Tourist', PackageFilter.tourist),
                          _chip('Foreign', PackageFilter.foreign),
                          _chip('Custom', PackageFilter.custom),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],
                ),
              ),
            ),
          ),
          if (_loading)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => const ShimmerPackageCard(width: double.infinity),
                  childCount: 4,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    mainAxisExtent: 225),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Text('Failed to load packages\n$_error',
                    textAlign: TextAlign.center, style: TOGTTypography.body),
              ),
            )
          else if (_filtered.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: Text('No packages found', style: TOGTTypography.body)),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final p = _filtered[i];
                    return StaggeredEntrance(
                      index: i,
                      child: PackageCard(
                        package: p,
                        onTap: () => openPackageDetail(context, p),
                      ),
                    );
                  },
                  childCount: _filtered.length,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    mainAxisExtent: 235),
              ),
            ),
        ],
      ),
    );

    return widget.embedded ? body : Scaffold(body: body);
  }

  Widget _chip(String label, PackageFilter f) {
    final active = _filter == f;
    return ScaleTransition(
      scale: Tween<double>(begin: .95, end: 1).animate(
          CurvedAnimation(parent: _tabC, curve: Curves.easeOutBack)),
      child: GestureDetector(
        onTap: () => _setFilter(f),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.only(right: 10),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
          decoration: BoxDecoration(
            gradient: active ? TOGTColors.blueGradient : null,
            color: active ? null : TOGTColors.white,
            borderRadius: BorderRadius.circular(13),
          ),
          child: Center(
            child: Text(label,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: active ? TOGTColors.white : TOGTColors.grey)),
          ),
        ),
      ),
    );
  }
}

Future<void> openPackageDetail(BuildContext context, TPackage p) {
  return Navigator.of(context).push(MaterialPageRoute(builder: (_) => PackageDetailScreen(package: p)));
}
