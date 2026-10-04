import '../service_request_screen.dart';

/// "Umrah Gift" entry on the home screen — same UMRAH request flow as the
/// web smart-form (which marks the booking as a gift with full/half
/// sponsorship and captures the recipient's details).
class UmrahGiftFormScreen extends ServiceRequestScreen {
  const UmrahGiftFormScreen({super.key})
      : super(
          serviceType: 'UMRAH',
          title: 'Umrah Gift',
          extraFields: const ['Gift type', 'Recipient name', 'Recipient phone', 'Recipient email'],
          fieldDefaults: const {'Gift type': 'Full gift (100% paid by sender)'},
        );
}
