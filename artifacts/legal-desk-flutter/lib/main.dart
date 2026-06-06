import 'package:flutter/widgets.dart';

import 'src/app/bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bootstrap = await AppBootstrap.create();
  runApp(bootstrap.app);
}
