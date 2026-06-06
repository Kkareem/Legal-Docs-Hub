import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../users/data/user_models.dart';
import '../../../users/data/users_repository.dart';
import '../../data/task_models.dart';
import '../../data/tasks_repository.dart';

class TasksViewModel extends ChangeNotifier {
  TasksViewModel(this._tasksRepository, this._casesRepository, this._usersRepository);

  final TasksRepository _tasksRepository;
  final CasesRepository _casesRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<TaskModel> _tasks = const [];
  List<CaseModel> _cases = const [];
  List<UserModel> _users = const [];
  String _search = '';
  String _status = 'all';
  String _priority = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<TaskModel> get tasks => _tasks;
  List<CaseModel> get cases => _cases;
  List<UserModel> get users => _users;
  String get status => _status;
  String get priority => _priority;

  List<TaskModel> get filteredTasks {
    final q = _search.trim().toLowerCase();
    if (q.isEmpty) return _tasks;
    return _tasks.where((item) => item.title.toLowerCase().contains(q)).toList(growable: false);
  }

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final tasks = await _tasksRepository.list(
        status: _status == 'all' ? null : _status,
        priority: _priority == 'all' ? null : _priority,
      );
      final results = await Future.wait([
        _casesRepository.list(),
        _usersRepository.list(),
      ]);
      _tasks = tasks;
      _cases = results[0] as List<CaseModel>;
      _users = results[1] as List<UserModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات المهام.';
    }

    notifyListeners();
  }

  void updateSearch(String value) {
    _search = value;
    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  void updatePriority(String value) {
    _priority = value;
    notifyListeners();
  }

  Future<void> create(CreateTaskInput input) async {
    await _tasksRepository.create(input);
    await load();
  }

  Future<void> markDone(TaskModel task) async {
    await _tasksRepository.updateStatus(task.id, 'done');
    await load();
  }

  Future<void> delete(TaskModel task) async {
    await _tasksRepository.delete(task.id);
    await load();
  }
}
