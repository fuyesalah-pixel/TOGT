enum UserRole { customer, worker, guide, admin, tech }

class TUser {
  const TUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = UserRole.customer,
    this.avatarUrl,
    this.phone,
    this.address,
    this.passportNumber,
    this.nationality,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? avatarUrl;
  final String? phone;
  final String? address;
  final String? passportNumber;
  final String? nationality;

  factory TUser.fromJson(Map<String, dynamic> j) {
    return TUser(
      id: j['id']?.toString() ?? '',
      name: (j['name'] ?? j['fullName'] ?? 'Traveler').toString(),
      email: j['email']?.toString() ?? '',
      role: UserRole.values.firstWhere(
        (r) => r.name == (j['role']?.toString().toLowerCase() ?? 'customer'),
        orElse: () => UserRole.customer,
      ),
      avatarUrl: j['avatar']?['url']?.toString() ?? j['avatarUrl']?.toString(),
      phone: j['phone']?.toString(),
      address: j['address']?.toString(),
      passportNumber: j['passportNumber']?.toString(),
      nationality: j['nationality']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role.name,
        'avatarUrl': avatarUrl,
        'phone': phone,
        'address': address,
        'passportNumber': passportNumber,
        'nationality': nationality,
      };

  factory TUser.fromJsonMap(Map<String, dynamic> j) => TUser.fromJson(j);

  TUser withRole(UserRole nextRole) => TUser(id: id, name: name, email: email, role: nextRole, avatarUrl: avatarUrl, phone: phone, address: address, passportNumber: passportNumber, nationality: nationality);
}
