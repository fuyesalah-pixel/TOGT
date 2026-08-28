import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

class ChatSocketService {
  ChatSocketService._();
  static final instance = ChatSocketService._();
  io.Socket? _socket;

  void connect({required void Function(Map<String, dynamic>) onMessage, void Function()? onTyping, void Function(String role)? onRoleChanged}) {
    if (!ApiService.instance.hasToken) return;
    _socket?.dispose();
    _socket = io.io(ApiConfig.webProductionOrigin, io.OptionBuilder().setTransports(['websocket']).setAuth({'token': ApiService.instance.accessToken}).disableAutoConnect().build());
    _socket!..on('newMessage', (data) => onMessage(Map<String, dynamic>.from(data as Map)))..on('message:new', (data) => onMessage(Map<String, dynamic>.from(data as Map)))..on('newCustomerMessage', (data) => onMessage(Map<String, dynamic>.from(data as Map)))..on('newWorkerReply', (data) => onMessage(Map<String, dynamic>.from(data as Map)))..on('roleChanged', (data) => onRoleChanged?.call((data as Map)['newRole'].toString()))..on('typing', (_) => onTyping?.call())..connect();
  }

  void send({required String customerId, required String message, String? receiverId}) => _socket?.emit('customerMessage', {'customerId': customerId, 'receiverId': receiverId, 'message': message});
  Future<dynamic> conversations() => ApiService.instance.get('/chat/conversations');
  Future<dynamic> messages(String userId) => ApiService.instance.get('/chat/$userId/messages');
  Future<dynamic> start() => ApiService.instance.post('/chat/start', body: {'channel': 'support'});
  Future<dynamic> sendMessage({required String receiverId, required String message}) => ApiService.instance.post('/chat/send', body: {'receiverId': receiverId, 'message': message});
  void dispose() => _socket?.dispose();
}
