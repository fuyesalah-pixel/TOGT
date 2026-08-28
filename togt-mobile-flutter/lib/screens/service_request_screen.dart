import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import '../services/request_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import 'profile/my_requests_screen.dart';

class ServiceRequestScreen extends StatefulWidget {
  const ServiceRequestScreen({super.key, required this.serviceType, required this.title});
  final String serviceType;
  final String title;

  @override
  State<ServiceRequestScreen> createState() => _ServiceRequestScreenState();
}

class _ServiceRequestScreenState extends State<ServiceRequestScreen> {
  final Map<String, TextEditingController> _fields = {};
  bool _busy = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    final user = AuthService.instance.currentUser;
    if (user != null) {
      _field('Full name').text = user.name;
      _field('Email').text = user.email;
      if (user.phone != null) _field('Phone').text = user.phone!;
      if (user.passportNumber != null) _field('Passport number').text = user.passportNumber!;
      if (user.nationality != null) _field('Nationality').text = user.nationality!;
    }
  }

  TextEditingController _field(String name) => _fields.putIfAbsent(name, TextEditingController.new);
  List<String> get _fieldNames => switch (widget.serviceType) {
    'FLIGHT' => ['Trip type', 'From', 'To', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Full name', 'Email', 'Phone'],
    'UMRAH' => ['Package type', 'Travel date', 'Return date', 'Number of pilgrims', 'Hotel preference', 'Room type', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'VISA' => ['Nationality', 'Destination country', 'Visa type', 'Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Full name', 'Email', 'Phone', 'Address', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'DOMESTIC' => ['Tour type', 'Destination', 'Start date', 'End date', 'Number of people', 'Accommodation type', 'Full name', 'Email', 'Phone'],
    'FOREIGN' => ['Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Tour duration', 'Arrival date', 'Departure date', 'Number of people', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Nationality'],
    'CONTACT' => ['Full name', 'Email', 'Phone', 'Message'],
    'CONSULTING' => ['Full name', 'Email', 'Phone', 'Message'],
    _ => ['Destination country', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
  };

  @override
  void dispose() { for (final field in _fields.values) field.dispose(); super.dispose(); }

  Future<void> _date(String label) async {
    final date = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 3650)), initialDate: DateTime.now());
    if (date != null) _field(label).text = date.toIso8601String().split('T').first;
    if (mounted) setState(() {});
  }

  Future<void> _submit() async {
    final required = ['Full name', 'Email', if (widget.serviceType != 'DOMESTIC') 'Phone', if (widget.serviceType == 'CONTACT' || widget.serviceType == 'CONSULTING') 'Message'];
    if (required.any((name) => _field(name).text.trim().isEmpty)) {
      setState(() => _message = 'Please complete all required fields.');
      return;
    }
    if (_field('Email').text.isNotEmpty && !_field('Email').text.contains('@')) { setState(() => _message = 'Enter a valid email address.'); return; }
    setState(() { _busy = true; _message = null; });
    try {
      await RequestService.instance.createRequest(type: widget.serviceType, payload: {
        'details': _fields.entries.map((entry) => '${entry.key}: ${entry.value.text.trim()}').join('\n'),
      });
       for (final field in _fields.values) field.clear();
       if (!mounted) return;
       await showDialog<void>(context: context, builder: (_) => AlertDialog(title: const Text('Request Submitted Successfully!'), content: const Text('Your request has been created.'), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('View My Requests'))]));
       if (mounted) Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MyRequestsScreen()));
    } catch (e) {
      setState(() => _message = 'Submission failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: ListView(padding: const EdgeInsets.all(22), children: [
          Text('${widget.title} request', style: TOGTTypography.h1),
          const SizedBox(height: 8),
          Text('Tell us what you need and a TOGT specialist will follow up.', style: TOGTTypography.body),
          const SizedBox(height: 26),
          ..._fieldNames.map((label) => _isDate(label) ? _dateField(label) : _inputField(label)),
          const SizedBox(height: 26),
          AnimatedButton(label: _busy ? 'Sending...' : 'Send Request', icon: Icons.send_rounded, onPressed: _busy ? null : _submit),
          if (_message != null) Padding(padding: const EdgeInsets.only(top: 18), child: Text(_message!, style: TOGTTypography.body.copyWith(color: _message!.startsWith('Request') ? TOGTColors.green : TOGTColors.red))),
          if (_message?.startsWith('Request') == true) Row(children: [Expanded(child: OutlinedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment checkout will open when a payment reference is issued.'))), child: const Text('Pay Now'))), const SizedBox(width: 12), Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: const Text('Pay Later')))]),
        ]),
      );

  bool _isDate(String label) => label.toLowerCase().contains('date');
  bool _isSearchable(String label) => ['From', 'To', 'Destination', 'Destination country', 'Nationality', 'Airline', 'Airline preference', 'Package type', 'Cabin class', 'Tour type', 'Visa type', 'Hotel preference', 'Room type', 'Accommodation type'].contains(label);
  Widget _inputField(String label) {
    final key = label.toLowerCase();
    final numeric = ['Adults', 'Children', 'Infants', 'Passengers', 'Number of pilgrims', 'Number of people'].contains(label);
    final maxLength = numeric ? 1 : key.contains('name') ? 50 : key == 'email' ? 100 : key == 'phone' ? 13 : key.contains('passport') ? 20 : key.contains('address') ? 200 : key.contains('message') || key.contains('notes') ? 500 : 100;
    return TextField(controller: _field(label), readOnly: _isSearchable(label), onTap: _isSearchable(label) ? () => _choose(label) : null, maxLength: maxLength, keyboardType: numeric || label == 'Phone' ? TextInputType.number : label == 'Email' ? TextInputType.emailAddress : TextInputType.text, inputFormatters: [LengthLimitingTextInputFormatter(maxLength), if (numeric || label == 'Phone') FilteringTextInputFormatter.digitsOnly], decoration: InputDecoration(labelText: label, hintText: label == 'Airline preference' ? 'Ethiopian Airlines' : null, suffixIcon: _isSearchable(label) ? const Icon(Icons.search_rounded) : null)).paddingBottom();
  }
  Future<void> _choose(String label) async {
    final options = label.contains('Airline') ? ['Ethiopian Airlines', 'Emirates', 'Qatar Airways', 'Turkish Airlines', 'Saudia'] : label == 'Cabin class' ? ['Economy', 'Premium Economy', 'Business', 'First'] : label == 'Package type' ? ['Economy', 'VIP', 'Honeymoon', 'Custom'] : label == 'Visa type' ? ['Visit', 'Educational', 'Merchant', 'Medical', 'Family'] : label == 'Tour type' ? ['School', 'Honeymoon', 'Friends', 'Corporate', 'Custom'] : label.contains('Hotel') ? ['3-star', '4-star', '5-star'] : label.contains('Room') ? ['Shared', 'Private'] : label.contains('Accommodation') ? ['Hotel', 'Apartment', 'Resort', 'Camping'] : ['Addis Ababa', 'Dubai', 'Jeddah', 'Istanbul', 'Nairobi', 'London', 'Makkah', 'Medina'];
    final value = await showSearch<String?>(context: context, delegate: _ChoiceSearch(label, options));
    if (value != null) { _field(label).text = value; setState(() {}); }
  }
  Widget _dateField(String label) => TextField(controller: _field(label), readOnly: true, onTap: () => _date(label), decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_month_rounded))).paddingBottom();
}

extension on Widget { Widget paddingBottom() => Padding(padding: const EdgeInsets.only(bottom: 16), child: this); }

class _ChoiceSearch extends SearchDelegate<String?> {
  _ChoiceSearch(this.titleText, this.options);
  final String titleText;
  final List<String> options;
  @override List<Widget>? buildActions(BuildContext context) => [IconButton(onPressed: () => query = '', icon: const Icon(Icons.clear))];
  @override Widget? buildLeading(BuildContext context) => BackButton(onPressed: () => close(context, null));
  @override Widget buildResults(BuildContext context) => _results(context);
  @override Widget buildSuggestions(BuildContext context) => _results(context);
  Widget _results(BuildContext context) { final matches = options.where((item) => item.toLowerCase().contains(query.toLowerCase())); return ListView(children: matches.map((item) => ListTile(title: Text(item), onTap: () => close(context, item))).toList()); }
}
