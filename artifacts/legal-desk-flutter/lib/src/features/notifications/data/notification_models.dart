class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
    this.userId,
    this.refId,
    this.refType,
  });

  final int id;
  final String type;
  final String title;
  final String body;
  final bool read;
  final String createdAt;
  final int? userId;
  final int? refId;
  final String? refType;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as int,
      type: json['type'] as String? ?? 'general',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
      userId: json['userId'] as int?,
      refId: json['refId'] as int?,
      refType: json['refType'] as String?,
    );
  }
}
