class ClientModel {
  const ClientModel({
    required this.id,
    required this.name,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.phone,
    this.email,
    this.nationalId,
    this.address,
    this.serviceType,
    this.notes,
    this.userId,
  });

  final int id;
  final String name;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String? phone;
  final String? email;
  final String? nationalId;
  final String? address;
  final String? serviceType;
  final String? notes;
  final int? userId;

  factory ClientModel.fromJson(Map<String, dynamic> json) {
    return ClientModel(
      id: json['id'] as int,
      name: json['name'] as String,
      status: json['status'] as String? ?? 'new',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      nationalId: json['nationalId'] as String?,
      address: json['address'] as String?,
      serviceType: json['serviceType'] as String?,
      notes: json['notes'] as String?,
      userId: json['userId'] as int?,
    );
  }
}

class ClientSummaryModel {
  const ClientSummaryModel({
    required this.clientId,
    required this.totalPaid,
    required this.totalDue,
    required this.activeCases,
    required this.totalCases,
    required this.pendingTasks,
  });

  final int clientId;
  final num totalPaid;
  final num totalDue;
  final int activeCases;
  final int totalCases;
  final int pendingTasks;

  factory ClientSummaryModel.fromJson(Map<String, dynamic> json) {
    return ClientSummaryModel(
      clientId: json['clientId'] as int,
      totalPaid: json['totalPaid'] as num? ?? 0,
      totalDue: json['totalDue'] as num? ?? 0,
      activeCases: json['activeCases'] as int? ?? 0,
      totalCases: json['totalCases'] as int? ?? 0,
      pendingTasks: json['pendingTasks'] as int? ?? 0,
    );
  }
}

class CreateClientInput {
  const CreateClientInput({
    required this.name,
    this.phone,
    this.email,
    this.nationalId,
    this.serviceType,
    this.status = 'new',
  });

  final String name;
  final String? phone;
  final String? email;
  final String? nationalId;
  final String? serviceType;
  final String status;

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
        'nationalId': nationalId,
        'serviceType': serviceType,
        'status': status,
      };
}
