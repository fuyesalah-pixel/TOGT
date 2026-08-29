import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../services/document_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../../widgets/animated_button.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key, this.serviceRequestId});
  final String? serviceRequestId;
  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  final _text = TextEditingController();
  final List<XFile> _images = [];
  int _rating = 0;
  bool _busy = false;
  String? _message;

  @override
  void dispose() { _text.dispose(); super.dispose(); }

  Future<void> _pickImage() async {
    if (_images.length >= 3) return;
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null && mounted) setState(() => _images.add(image));
  }

  Future<void> _submit() async {
    if (_rating == 0 || _text.text.trim().length < 5) {
      setState(() => _message = 'Choose a rating and write at least 5 characters.');
      return;
    }
    setState(() { _busy = true; _message = null; });
    try {
      final urls = <String>[];
      for (final image in _images) {
        final result = await DocumentService.instance.uploadPath(image.path, folder: 'reviews');
        if (result != null) urls.add(result);
      }
      await ApiService.instance.post('/reviews', body: {
        if (widget.serviceRequestId != null) 'serviceRequestId': widget.serviceRequestId,
        'rating': _rating,
        'reviewText': _text.text.trim(),
        'imageUrls': urls,
      });
      if (mounted) setState(() => _message = 'Thank you. Your review was submitted for approval.');
    } catch (e) {
      if (mounted) setState(() => _message = 'Could not submit review: $e');
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Reviews')),
    body: ListView(padding: const EdgeInsets.all(22), children: [
      Text('Share your experience', style: TOGTTypography.h1),
      const SizedBox(height: 8),
      Text('Your feedback helps other travelers choose with confidence.', style: TOGTTypography.body),
      const SizedBox(height: 26),
      Center(child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(5, (i) => IconButton(onPressed: () => setState(() => _rating = i + 1), icon: Icon(i < _rating ? Icons.star_rounded : Icons.star_border_rounded, color: TOGTColors.orange, size: 38))))),
      const SizedBox(height: 12),
      TextField(controller: _text, maxLines: 6, decoration: const InputDecoration(labelText: 'Your review', hintText: 'Tell us about your journey...')),
      const SizedBox(height: 18),
      Row(children: [Text('Photos (${_images.length}/3)', style: TOGTTypography.h3), const Spacer(), TextButton.icon(onPressed: _images.length < 3 ? _pickImage : null, icon: const Icon(Icons.add_photo_alternate_outlined), label: const Text('Add photo'))]),
      if (_images.isNotEmpty) SizedBox(height: 92, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: _images.length, separatorBuilder: (_, __) => const SizedBox(width: 10), itemBuilder: (_, i) => Stack(children: [ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.file(File(_images[i].path), width: 92, height: 92, fit: BoxFit.cover)), Positioned(right: 2, top: 2, child: GestureDetector(onTap: () => setState(() => _images.removeAt(i)), child: const CircleAvatar(radius: 11, backgroundColor: Colors.black54, child: Icon(Icons.close, color: Colors.white, size: 14))))]))),
      const SizedBox(height: 24),
      AnimatedButton(label: _busy ? 'Submitting...' : 'Submit Review', icon: Icons.send_rounded, onPressed: _busy ? null : _submit),
      if (_message != null) Padding(padding: const EdgeInsets.only(top: 16), child: Text(_message!, style: TOGTTypography.body.copyWith(color: _message!.startsWith('Thank') ? TOGTColors.green : TOGTColors.red))),
    ]),
  );
}
