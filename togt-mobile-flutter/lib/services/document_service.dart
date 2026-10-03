import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:io';
import 'api_service.dart';

class DocumentService {
  DocumentService._();
  static final instance = DocumentService._();

  /// Extensions the backend accepts (uploads.service.ts allow-list).
  static const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

  /// Picks an image (gallery or camera). Optionally downscales to keep chat
  /// uploads small and fast.
  Future<XFile?> pickImage(ImageSource source, {int maxDimension = 1600}) async {
    return ImagePicker().pickImage(source: source, imageQuality: 82, maxWidth: maxDimension.toDouble(), maxHeight: maxDimension.toDouble());
  }

  /// Picks any allowed document (PDF, images, …) via the system file browser —
  /// this is what makes the chat paperclip offer real files, not just photos.
  Future<XFile?> pickDocument() async {
    final file = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
    );
    final path = file?.path;
    return path == null ? null : XFile(path);
  }

  /// Derives the MIME type from the file extension. Android copy streams
  /// frequently lose the original content type, and the backend rejects the
  /// upload when the declared MIME is missing or wrong, so the extension —
  /// not the platform — is the source of truth here.
  static String mimeForPath(String path) {
    final ext = path.split('?').first.split('.').last.toLowerCase();
    return switch (ext) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'gif' => 'image/gif',
      'webp' => 'image/webp',
      'pdf' => 'application/pdf',
      _ => 'application/octet-stream',
    };
  }

  /// True when the file both matches an allowed extension and fits the 10MB
  /// backend limit — used to fail fast with a friendly message instead of a
  /// round trip to the server.
  static bool isAllowed(String path, {int? sizeBytes}) {
    final ext = path.split('?').first.split('.').last.toLowerCase();
    if (!allowedExtensions.contains(ext)) return false;
    if (sizeBytes != null && sizeBytes > 10 * 1024 * 1024) return false;
    return true;
  }

  Future<String?> pickAndUpload({ImageSource source = ImageSource.gallery, String folder = 'documents'}) async {
    final image = await pickImage(source);
    if (image == null) return null;
    return uploadPath(image.path, folder: folder);
  }

  Future<String?> uploadPath(String path, {String folder = 'documents'}) async {
    final result = await ApiService.instance.upload('/uploads', path, query: {'folder': folder});
    return result is Map ? result['url']?.toString() : null;
  }

  Future<void> downloadTicket(String ticketId) async {
    final response = await ApiService.instance.downloadBytes('/tickets/$ticketId/pdf');
    final file = File('${(await getApplicationDocumentsDirectory()).path}/ticket-$ticketId.pdf');
    await file.writeAsBytes(response);
    await OpenFilex.open(file.path);
  }

  /// Opens a remote attachment in the system viewer. OpenFilex only handles
  /// local paths, so https files are downloaded to a temp file first (with a
  /// browser fallback) — this is what makes "tap attachment → it opens" work.
  Future<void> openRemote(String url) async {
    if (!url.startsWith('http')) {
      await OpenFilex.open(url);
      return;
    }
    try {
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 30));
      if (response.statusCode >= 200 && response.statusCode < 300 && response.bodyBytes.isNotEmpty) {
        final ext = url.split('?').first.split('.').last.toLowerCase();
        final safeExt = RegExp(r'^[a-z0-9]{1,5}$').hasMatch(ext) ? ext : 'bin';
        final file = File('${(await getTemporaryDirectory()).path}/togt-${DateTime.now().millisecondsSinceEpoch}.$safeExt');
        await file.writeAsBytes(response.bodyBytes);
        final result = await OpenFilex.open(file.path);
        if (result.type != ResultType.done) {
          await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        }
        return;
      }
    } catch (_) {}
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}
