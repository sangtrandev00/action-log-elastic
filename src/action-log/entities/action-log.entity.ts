// src/action-log/entities/action-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('action_logs') // Tên bảng trong database
export class ActionLog {
  @PrimaryGeneratedColumn('uuid') // Khóa chính tự tăng dạng UUID
  id: string;

  @Index() // Đánh index cho trường userId để tăng tốc độ truy vấn
  @Column({ type: 'varchar', length: 255, nullable: true }) // Kiểu dữ liệu và độ dài
  userId: string | null; // ID của người dùng thực hiện hành động (có thể null)

  @Index()
  @Column({ type: 'varchar', length: 100 })
  actionType: string; // Loại hành động (e.g., 'CREATE_USER', 'UPDATE_POST', 'LOGIN')

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetId: string | null; // ID của đối tượng bị tác động (e.g., ID user mới tạo, ID bài viết)

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType: string | null; // Loại đối tượng bị tác động (e.g., 'User', 'Post')

  @Column({ type: 'text', nullable: true }) // Dùng kiểu 'text' cho dữ liệu dài
  details: string | null; // Chi tiết hành động (có thể là JSON stringify)

  @Column({ type: 'varchar', length: 45, nullable: true }) // Lưu địa chỉ IP
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true }) // Lưu User Agent
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamp' }) // Tự động thêm timestamp khi tạo record
  timestamp: Date;

  // Bạn có thể thêm các trường khác nếu cần
  // @Column({ type: 'varchar', length: 255, nullable: true })
  // status: string; // Trạng thái hành động (e.g., 'SUCCESS', 'FAILURE')

  // @Column({ type: 'text', nullable: true })
  // errorDetails: string | null; // Chi tiết lỗi nếu có
}
