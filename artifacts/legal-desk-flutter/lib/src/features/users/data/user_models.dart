class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.active,
    this.phone,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final bool active;
  final String? phone;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String? ?? 'lawyer',
      active: json['active'] as bool? ?? true,
      phone: json['phone'] as String?,
    );
  }
}
