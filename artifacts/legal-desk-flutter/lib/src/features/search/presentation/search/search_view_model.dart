import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../data/search_models.dart';
import '../../data/search_repository.dart';

class SearchViewModel extends ChangeNotifier {
  SearchViewModel(this._repository);

  final SearchRepository _repository;

  AsyncState _state = AsyncState.idle;
  String _query = '';
  String? _error;
  SearchResultModel? _result;

  AsyncState get state => _state;
  String get query => _query;
  String? get error => _error;
  SearchResultModel? get result => _result;

  Future<void> search(String query) async {
    _query = query;
    if (query.trim().isEmpty) {
      _state = AsyncState.idle;
      _result = null;
      notifyListeners();
      return;
    }

    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      _result = await _repository.search(query.trim());
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تنفيذ البحث.';
    }
    notifyListeners();
  }
}
