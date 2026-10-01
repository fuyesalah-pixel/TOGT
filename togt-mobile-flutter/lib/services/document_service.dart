import 'package:image_picker/image_picker.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
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

  /// Opens a remote attachment URL in the system viewer/browser.
  Future<void> openRemote(String url) async {
    await OpenFilex.open(url);
  }
}
