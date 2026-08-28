import '../dashboard_list_screen.dart';
class HistoryScreen extends DashboardListScreen { const HistoryScreen({super.key}) : super(title: 'History', endpoint: '/service-requests?status=COMPLETED'); }
