import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../data/dashboard_models.dart';
import '../../data/dashboard_repository.dart';

class DashboardViewModel extends ChangeNotifier {
  DashboardViewModel(this._repository);

  final DashboardRepository _repository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  DashboardSummary? _summary;
  List<HearingListItem> _hearings = const [];
  List<OverdueTaskItem> _overdueTasks = const [];
  List<ActivityItem> _recentActivity = const [];

  AsyncState get state => _state;
  String? get error => _error;
  DashboardSummary? get summary => _summary;
  List<HearingListItem> get hearings => _hearings;
  List<OverdueTaskItem> get overdueTasks => _overdueTasks;
  List<ActivityItem> get recentActivity => _recentActivity;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      _summary = await _repository.getSummary();
      _hearings = await _repository.getUpcomingHearings();
      _overdueTasks = await _repository.getOverdueTasks();
      _recentActivity = await _repository.getRecentActivity();
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل لوحة التحكم.';
    }

    notifyListeners();
  }
}
