import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../l10n/app_localizations.dart';
import '../../navigation/app_navigator.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
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
  bool _submitted = false;
  String? _message;

  @override
  void dispose() { _text.dispose(); super.dispose(); }

  Future<void> _pickImage() async {
    if (_images.length >= 3) return;
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (image != null && mounted) setState(() => _images.add(image));
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    // Guests cannot POST /reviews — surface a clear sign-in prompt instead of
    // a doomed submission that fails with a raw session error.
    if (AuthService.instance.currentUser == null) {
      setState(() => _message = l10n.notSignedIn);
      return;
    }
    if (_rating == 0 || _text.text.trim().length < 5) {
      setState(() => _message = l10n.required);
      return;
    }
    setState(() { _busy = true; _message = null; });
    try {
      // Photos upload first, but one failing upload must never lose the
      // review itself — submit with whatever made it and say so.
      final urls = <String>[];
      var failedUploads = 0;
      for (final image in _images) {
        try {
          final result = await DocumentService.instance.uploadPath(image.path, folder: 'reviews');
          if (result != null) { urls.add(result); } else { failedUploads++; }
        } catch (_) { failedUploads++; }
      }
      await ApiService.instance.post('/reviews', body: {
        if (widget.serviceRequestId != null) 'serviceRequestId': widget.serviceRequestId,
        'rating': _rating,
        'reviewText': _text.text.trim(),
        'imageUrls': urls,
      });
      if (mounted) {
        setState(() {
          _submitted = true;
          _message = failedUploads == 0 ? l10n.reviewSubmittedThanks : l10n.reviewSubmittedNoPhotos(failedUploads);
          _rating = 0;
          _text.clear();
          _images.clear();
        });
      }
    } catch (e) {
       if (mounted) setState(() { _submitted = false; _message = l10n.submissionFailed(e.toString()); });
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) { final l10n = AppLocalizations.of(context); return Scaffold(
    appBar: AppBar(title: Text(l10n.reviews)),
    body: ListView(padding: const EdgeInsets.all(22), children: [
      Text(l10n.shareExperience, style: TOGTTypography.h1),
      const SizedBox(height: 8),
      Text(l10n.feedbackHelps, style: TOGTTypography.body),
      const SizedBox(height: 26),
      Center(child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(5, (i) => IconButton(onPressed: () => setState(() => _rating = i + 1), icon: Icon(i < _rating ? Icons.star_rounded : Icons.star_border_rounded, color: TOGTColors.orange, size: 38))))),
      const SizedBox(height: 12),
      TextField(controller: _text, maxLines: 6, decoration: InputDecoration(labelText: l10n.yourReview, hintText: l10n.tellJourney)),
      const SizedBox(height: 18),
      Row(children: [Text(l10n.photosCount(_images.length), style: TOGTTypography.h3), const Spacer(), TextButton.icon(onPressed: _images.length < 3 ? _pickImage : null, icon: const Icon(Icons.add_photo_alternate_outlined), label: Text(l10n.addPhoto))]),
      if (_images.isNotEmpty) SizedBox(height: 92, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: _images.length, separatorBuilder: (_, __) => const SizedBox(width: 10), itemBuilder: (_, i) => Stack(children: [ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.file(File(_images[i].path), width: 92, height: 92, fit: BoxFit.cover)), Positioned(right: 2, top: 2, child: GestureDetector(onTap: () => setState(() => _images.removeAt(i)), child: const CircleAvatar(radius: 11, backgroundColor: Colors.black54, child: Icon(Icons.close, color: Colors.white, size: 14))))]))),
      const SizedBox(height: 24),
      AnimatedButton(label: _busy ? l10n.sending : l10n.reviews, icon: Icons.send_rounded, onPressed: _busy ? null : _submit),
      if (AuthService.instance.currentUser == null) ...[
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: TOGTColors.blue.withOpacity(.06), borderRadius: BorderRadius.circular(14), border: Border.all(color: TOGTColors.blue.withOpacity(.25))),
          child: Row(children: [
            const Icon(Icons.info_outline_rounded, color: TOGTColors.blue),
            const SizedBox(width: 12),
            Expanded(child: Text(l10n.notSignedIn, style: TOGTTypography.body.copyWith(color: TOGTColors.navy))),
          ]),
        ),
        const SizedBox(height: 10),
        AnimatedButton(label: l10n.signIn, icon: Icons.login_rounded, gradient: TOGTColors.orangeGradient, onPressed: () => AppNavigator.goToLogin()),
      ],
      if (_message != null) Padding(padding: const EdgeInsets.only(top: 16), child: Text(_message!, style: TOGTTypography.body.copyWith(color: _submitted ? TOGTColors.green : TOGTColors.red))),
    ]),
  ); }
}
