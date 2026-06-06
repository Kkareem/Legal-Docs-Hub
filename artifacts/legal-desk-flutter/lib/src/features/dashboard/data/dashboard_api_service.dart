import 'package:dio/dio.dart';

import 'dashboard_models.dart';

class DashboardApiService {
  DashboardApiService(this._dio);

  final Dio _dio;

  Future<DashboardSummary> getSummary() async {
    final response = await _dio.get<Map<String, dynamic>>('/dashboard/summary');
    return DashboardSummary.fromJson(response.data!);
  }

  Future<List<HearingListItem>> getUpcomingHearings() async {
    final response = await _dio.get<List<dynamic>>('/dashboard/upcoming-hearings');
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(HearingListItem.fromJson)
        .toList(growable: false);
  }

  Future<List<OverdueTaskItem>> getOverdueTasks() async {
    final response = await _dio.get<List<dynamic>>('/dashboard/overdue-tasks');
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(OverdueTaskItem.fromJson)
        .toList(growable: false);
  }

  Future<List<ActivityItem>> getRecentActivity() async {
    final response = await _dio.get<List<dynamic>>('/dashboard/recent-activity');
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(ActivityItem.fromJson)
        .toList(growable: false);
  }
}
