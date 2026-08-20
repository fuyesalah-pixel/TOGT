// Shared API types — mirrors the NestJS backend (togt-api) Prisma models.
// These types are the single source of truth for the frontend API layer.

export type Role = "CUSTOMER" | "WORKER" | "GUIDE" | "ADMIN" | "TECH";
export type Status = "ACTIVE" | "TERMINATED";

export type PackageType =
  | "UMRAH_ECONOMY"
  | "UMRAH_VIP"
  | "UMRAH_HONEYMOON"
  | "UMRAH_CUSTOM"
  | "DOMESTIC_PREBUILT"
  | "DOMESTIC_CUSTOM"
  | "TOURIST_PREBUILT"
  | "TOURIST_CUSTOM"
  | "FOREIGN_PREBUILT"
  | "FOREIGN_CUSTOM";

export type ServiceType =
  | "TICKET"
  | "UMRAH"
  | "DOMESTIC"
  | "TOURIST"
  | "VISA"
  | "CONSULTING"
  | "FOREIGN_TRAVEL";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type TicketStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REFUND_REQUESTED";
export type PaymentStatus = "PAID" | "UNPAID" | "REFUNDED";

export type GroupStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MemberRole = "MEMBER" | "GUIDE";

export type NotificationType =
  | "STATUS_UPDATE"
  | "NEW_PACKAGE"
  | "CHAT_MESSAGE"
  | "SYSTEM"
  | "ALERT";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  nationality?: string | null;
  passportIssueDate?: string | null;
  avatarUrl?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  role: Role;
  status: Status;
  languagePref: string;
  createdAt: string;
  updatedAt: string;
  _count?: { serviceRequests?: number; tickets?: number; groupMembers?: number };
}

export interface Package {
  id: string;
  title: string;
  description: string;
  type: PackageType;
  image?: string | null;
  images: string[];
  videoUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  duration?: string | null;
  maxMembers: number;
  includes: string[];
  excludes: string[];
  isActive: boolean;
  isCustom: boolean;
  destination?: string | null;
  createdById: string;
  groupId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  user?: User;
  serviceType: ServiceType;
  status: RequestStatus;
  formData: Record<string, unknown>;
  packageId?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;
  amount?: number | null;
  currency: string;
  paidAt?: string | null;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  user?: Pick<User, "id" | "fullName" | "email">;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt?: string | null;
  passengerName: string;
  passengerDetails: unknown[];
  seat?: string | null;
  cabinClass: string;
  paymentMethod?: string | null;
  totalAmount: number;
  currency: string;
  status: TicketStatus;
  refundReason?: string | null;
  refundRequestedAt?: string | null;
  bookedAt: string;
  completedAt?: string | null;
  history?: Array<{ id: string; statusFrom?: string | null; statusTo: string; changedByName?: string; reason?: string; note?: string | null; createdAt: string }>;
}

export interface ProgressHistoryItem {
  id: string;
  serviceRequestId: string;
  statusFrom: string;
  statusTo: string;
  changedById: string;
  changedBy?: User;
  notes?: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  packageId?: string | null;
  startDate: string;
  endDate: string;
  status: GroupStatus;
  createdById: string;
  members: GroupMember[];
  createdAt: string;
  isHidden?: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: User;
  role: MemberRole;
  assignmentStatus?: string;
  joinedAt: string;
}

export interface TourPlanStep {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  estimatedAt?: string | null;
  status: string;
  confirmationStatus?: string;
  rejectedReason?: string | null;
  priority?: string;
  notes?: string | null;
  completedAt?: string | null;
  actualAt?: string | null;
  confirmedAt?: string | null;
  confirmedById?: string | null;
  createdAt: string;
}

export interface GroupLocation {
  user: User;
  role: MemberRole;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  createdAt: string;
  distanceMeters: number;
}

export interface Review {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "fullName">;
  serviceRequestId?: string | null;
  rating: number;
  reviewText?: string | null;
  imageUrls: string[];
  isVisible: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  sender?: Pick<User, "id" | "fullName" | "role">;
  receiverId: string;
  message: string;
  fileUrl?: string | null;
  fileType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  user: Pick<User, "id" | "fullName" | "email" | "role">;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
}

export interface PaginatedConversations {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  sentAt: string;
}

export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalPackages: number;
  activePackages: number;
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalReviews: number;
  unreadNotifications: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export interface GalleryVideo {
  url: string;
  title: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  images: string[];
  videos: GalleryVideo[];
  date: string;
  location: string;
  videoUrl?: string | null;
}
