import 'dashboard_api_service.dart';
import 'dashboard_models.dart';

class DashboardRepository {
  DashboardRepository(this._service);

  final DashboardApiService _service;

  Future<DashboardSummary> getSummary() => _service.getSummary();

  Future<List<HearingListItem>> getUpcomingHearings() => _service.getUpcomingHearings();

  Future<List<OverdueTaskItem>> getOverdueTasks() => _service.getOverdueTasks();

  Future<List<ActivityItem>> getRecentActivity() => _service.getRecentActivity();
}
