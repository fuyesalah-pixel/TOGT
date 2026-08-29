import 'package:image_picker/image_picker.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'api_service.dart';

class DocumentService {
  DocumentService._();
  static final instance = DocumentService._();

  Future<String?> pickAndUpload({ImageSource source = ImageSource.gallery, String folder = 'documents'}) async {
    final image = await ImagePicker().pickImage(source: source);
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
}
