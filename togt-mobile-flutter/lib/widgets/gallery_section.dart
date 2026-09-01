import 'package:flutter/material.dart';

import '../models/gallery_item.dart';
import '../services/api_service.dart';
import '../services/content_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'shimmer_loading.dart';

const _categoryColors = <String, Color>{
  'UMRAH': Color(0xFFFF9300),
  'DOMESTIC': Color(0xFF276749),
  'TOURIST': Color(0xFF553C9A),
  'EVENT': Color(0xFF1F67B1),
  'VISA': Color(0xFFC53030),
};

Color _categoryColor(String cat) => _categoryColors[cat.toUpperCase()] ?? TOGTColors.orange;

class GallerySection extends StatefulWidget {
  const GallerySection({super.key});

  @override
  State<GallerySection> createState() => _GallerySectionState();
}

class _GallerySectionState extends State<GallerySection> {
  List<GalleryItem>? _items;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ContentService.instance.fetchGallery();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'Gallery', subtitle: 'Moments from TOGT journeys'),
        const SizedBox(height: 14),
        if (_items == null && _error == null)
          const _GallerySkeleton()
        else if (_error != null)
          _GalleryError(message: _error!, onRetry: _load)
        else
          for (var i = 0; i < _items!.length; i++) ...[
            _GalleryCard(item: _items![i], index: i),
            if (i != _items!.length - 1) const SizedBox(height: 14),
          ],
        const SizedBox(height: 12),
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

class _GallerySkeleton extends StatelessWidget {
  const _GallerySkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      ShimmerLoading(height: 190, borderRadius: 20),
      const SizedBox(height: 12),
      ShimmerLoading(height: 190, borderRadius: 20),
    ]);
  }
}

class _GalleryError extends StatelessWidget {
  const _GalleryError({required this.message, required this.onRetry});

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
        const Icon(Icons.photo_library_outlined, color: TOGTColors.grey, size: 32),
        const SizedBox(height: 8),
        Text('Gallery unavailable', style: TOGTTypography.h3),
        const SizedBox(height: 4),
        Text(message, style: TOGTTypography.small, textAlign: TextAlign.center),
        const SizedBox(height: 10),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
  }
}

class _GalleryCard extends StatefulWidget {
  const _GalleryCard({required this.item, required this.index});

  final GalleryItem item;
  final int index;

  @override
  State<_GalleryCard> createState() => _GalleryCardState();
}

class _GalleryCardState extends State<_GalleryCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 800))
    ..forward();
  late final Animation<double> _fade =
      CurvedAnimation(parent: _c, curve: Curves.easeOut);
  late final Animation<Offset> _slide =
      Tween(begin: const Offset(0, .3), end: Offset.zero)
          .animate(CurvedAnimation(parent: _c, curve: Curves.easeOutCubic));

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final color = _categoryColor(item.category);
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: Material(
          color: TOGTColors.white,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => _open(context),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ImageHeader(item: item),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withOpacity(.14),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(item.category.toUpperCase(),
                            style: TOGTTypography.small.copyWith(
                                color: color,
                                fontSize: 10,
                                fontWeight: FontWeight.w800)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.title, style: TOGTTypography.h3),
                            if (item.location != null && item.location!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 3),
                                child: Row(children: [
                                  const Icon(Icons.place_outlined,
                                      size: 13, color: TOGTColors.orange),
                                  const SizedBox(width: 3),
                                  Flexible(
                                      child: Text(item.location!,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TOGTTypography.small)),
                                ]),
                              ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded,
                          color: TOGTColors.grey),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _open(BuildContext context) {
    _openDetail(context, widget.item);
  }
}

class _ImageHeader extends StatefulWidget {
  const _ImageHeader({required this.item});

  final GalleryItem item;

  @override
  State<_ImageHeader> createState() => _ImageHeaderState();
}

class _ImageHeaderState extends State<_ImageHeader> {
  final PageController _page = PageController();
  int _pageIndex = 0;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.item.allImages;
    if (images.isEmpty) {
      return Container(
        height: 170,
        width: double.infinity,
        color: TOGTColors.lightGrey,
        child: const Icon(Icons.image_not_supported_outlined,
            color: TOGTColors.grey, size: 40),
      );
    }
    return Stack(
      children: [
        SizedBox(
          height: 170,
          child: PageView.builder(
            controller: _page,
            itemCount: images.length,
            onPageChanged: (i) => setState(() => _pageIndex = i),
            itemBuilder: (context, i) => Image.network(
              ApiService.instance.resolveImageUrl(images[i]),
              fit: BoxFit.cover,
              width: double.infinity,
              errorBuilder: (_, __, ___) => Container(
                color: TOGTColors.lightGrey,
                child: const Icon(Icons.broken_image_outlined,
                    color: TOGTColors.grey, size: 36),
              ),
              loadingBuilder: (context, child, progress) =>
                  progress == null ? child : ShimmerLoading(),
            ),
          ),
        ),
        if (images.length > 1)
          Positioned(
            right: 10,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: TOGTColors.navy.withOpacity(.6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('${_pageIndex + 1}/${images.length}',
                  style: const TextStyle(
                      color: TOGTColors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ),
      ],
    );
  }
}

class _GalleryDetail extends StatefulWidget {
  const _GalleryDetail({required this.item});

  final GalleryItem item;

  @override
  State<_GalleryDetail> createState() => _GalleryDetailState();
}

class _GalleryDetailState extends State<_GalleryDetail> {
  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final videos = item.videos.where((v) => v.url.isNotEmpty).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Gallery')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: _ImageHeader(item: item),
          ),
          const SizedBox(height: 18),
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _categoryColor(item.category).withOpacity(.14),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(item.category.toUpperCase(),
                  style: TOGTTypography.small.copyWith(
                      color: _categoryColor(item.category),
                      fontWeight: FontWeight.w800)),
            ),
            const Spacer(),
            if (item.location != null && item.location!.isNotEmpty)
              Row(children: [
                const Icon(Icons.place_outlined, size: 15, color: TOGTColors.orange),
                const SizedBox(width: 4),
                Text(item.location!, style: TOGTTypography.small),
              ]),
          ]),
          const SizedBox(height: 14),
          Text(item.title, style: TOGTTypography.h1),
          const SizedBox(height: 10),
          if (item.description.isNotEmpty) ...[
            Text(item.description, style: TOGTTypography.body),
            const SizedBox(height: 14),
          ],
          if (item.images.isNotEmpty) ...[
            Text('More Photos', style: TOGTTypography.h3),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: item.images
                  .map((img) => ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          ApiService.instance.resolveImageUrl(img),
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 100,
                            height: 100,
                            color: TOGTColors.lightGrey,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
          if (videos.isNotEmpty) ...[
            const SizedBox(height: 18),
            Text('Videos', style: TOGTTypography.h3),
            const SizedBox(height: 10),
            for (final v in videos)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: TOGTColors.blue.withOpacity(.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.play_arrow_rounded, color: TOGTColors.blue),
                ),
                title: Text(v.title.isEmpty ? 'Watch video' : v.title,
                    style: TOGTTypography.h3),
                trailing:
                    const Icon(Icons.open_in_new_rounded, color: TOGTColors.grey),
              ),
          ],
        ],
      ),
    );
  }
}

Future<void> _openDetail(BuildContext context, GalleryItem item) {
  return Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => _GalleryDetail(item: item)));
}
