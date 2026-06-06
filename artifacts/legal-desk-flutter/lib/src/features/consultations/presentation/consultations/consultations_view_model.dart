import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../../users/data/user_models.dart';
import '../../../users/data/users_repository.dart';
import '../../data/consultation_models.dart';
import '../../data/consultations_repository.dart';

class ConsultationsViewModel extends ChangeNotifier {
  ConsultationsViewModel(this._repository, this._clientsRepository, this._usersRepository);

  final ConsultationsRepository _repository;
  final ClientsRepository _clientsRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<ConsultationModel> _consultations = const [];
  List<ClientModel> _clients = const [];
  List<UserModel> _users = const [];
  String _status = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<ConsultationModel> get consultations => _consultations;
  List<ClientModel> get clients => _clients;
  List<UserModel> get users => _users;
  String get status => _status;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.list(status: _status == 'all' ? null : _status),
        _clientsRepository.list(),
        _usersRepository.list(),
      ]);
      _consultations = results[0] as List<ConsultationModel>;
      _clients = results[1] as List<ClientModel>;
      _users = results[2] as List<UserModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات الاستشارات.';
    }

    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> create(CreateConsultationInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> respond(ConsultationModel item, String responseText) async {
    await _repository.update(item.id, {
      'response': responseText,
      'status': 'responded',
    });
    await load();
  }

  Future<void> delete(ConsultationModel item) async {
    await _repository.delete(item.id);
    await load();
  }
}
