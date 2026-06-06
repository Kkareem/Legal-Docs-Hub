import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../data/notification_models.dart';
import '../../data/notifications_repository.dart';

class NotificationsViewModel extends ChangeNotifier {
  NotificationsViewModel(this._repository);

  final NotificationsRepository _repository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<NotificationModel> _notifications = const [];

  AsyncState get state => _state;
  String? get error => _error;
  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _notifications.where((item) => !item.read).length;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      _notifications = await _repository.list();
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل الإشعارات.';
    }

    notifyListeners();
  }

  Future<void> markRead(NotificationModel item) async {
    await _repository.markRead(item.id);
    await load();
  }

  Future<void> markAllRead() async {
    await _repository.markAllRead();
    await load();
  }
}
