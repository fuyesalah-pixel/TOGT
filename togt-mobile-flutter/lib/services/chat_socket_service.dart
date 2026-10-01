import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

/// Live chat connection for human support.
///
/// The gateway accepts either the `togt_access` cookie (web) or the same JWT
/// passed via the socket.io `auth.token` handshake option (this app).
/// After a successful connect the server joins us to `user:{id}` and
/// `role:{role}` rooms, from which `message:new` / `newWorkerReply` /
/// `newCustomerMessage` events stream in real time.
class ChatSocketService {
  ChatSocketService._();
  static final instance = ChatSocketService._();
  io.Socket? _socket;
  bool _connected = false;

  bool get isConnected => _connected;

  void connect({
    required void Function(Map<String, dynamic>) onMessage,
    void Function()? onTyping,
    void Function(String role)? onRoleChanged,
    void Function(bool connected)? onConnectionChanged,
  }) {
    if (!ApiService.instance.hasToken) return;
    _socket?.dispose();
    _socket = io
        .io(ApiConfig.webOrigin, io.OptionBuilder().setPath('/api/socket.io').setTransports(['websocket']).setAuth({'token': ApiService.instance.accessToken}).disableAutoConnect().build());
    _socket!
      ..on('connect', (_) {
        _connected = true;
        onConnectionChanged?.call(true);
      })
      ..on('disconnect', (_) {
        _connected = false;
        onConnectionChanged?.call(false);
      })
      ..on('newMessage', (data) => onMessage(_asMap(data)))
      ..on('message:new', (data) => onMessage(_asMap(data)))
      ..on('newCustomerMessage', (data) => onMessage(_asMap(data)))
      ..on('newWorkerReply', (data) => onMessage(_asMap(data)))
      ..on('roleChanged', (data) => onRoleChanged?.call((data as Map)['newRole'].toString()))
      ..on('typing', (_) => onTyping?.call())
      ..connect();
  }

  static Map<String, dynamic> _asMap(dynamic data) =>
      data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};

  void send({required String customerId, required String message, String? receiverId}) => _socket?.emit('customerMessage', {'customerId': customerId, 'receiverId': receiverId, 'message': message});

  Future<dynamic> conversations() => ApiService.instance.get('/chat/conversations');
  Future<dynamic> messages(String userId) => ApiService.instance.get('/chat/$userId/messages');

  /// Opens (or returns) the shared support conversation for this customer.
  Future<dynamic> start() => ApiService.instance.post('/chat/start', body: {'channel': 'support'});

  /// Sends a text message to `receiverId` over REST (source of truth; socket
  /// events are only used for live delivery to the other side).
  Future<dynamic> sendMessage({required String receiverId, required String message}) => ApiService.instance.postForm('/chat/send', {'receiverId': receiverId, 'message': message});

  /// Sends a file attachment (photo/document) plus optional caption.
  Future<dynamic> sendFile({required String receiverId, required String filePath, String? message}) => ApiService.instance.postFile('/chat/send', {'receiverId': receiverId, if (message != null && message.isNotEmpty) 'message': message}, filePath);

  void dispose() {
    _socket?.dispose();
    _socket = null;
    _connected = false;
  }
}
