import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:io';
import 'api_service.dart';

class DocumentService {
  DocumentService._();
  static final instance = DocumentService._();

  /// Picks an image (gallery or camera). Optionally downscales to keep chat
  /// uploads small and fast.
  Future<XFile?> pickImage(ImageSource source, {int maxDimension = 1600}) async {
    return ImagePicker().pickImage(source: source, imageQuality: 82, maxWidth: maxDimension.toDouble(), maxHeight: maxDimension.toDouble());
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
