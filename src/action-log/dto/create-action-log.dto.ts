// src/action-log/dto/create-action-log.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIP,
} from 'class-validator';

export class CreateActionLogDto {
  @IsOptional() // Có thể null hoặc không có
  @IsString()
  @MaxLength(255)
  userId?: string | null;

  @IsNotEmpty() // Bắt buộc phải có
  @IsString()
  @MaxLength(100)
  actionType: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetType?: string | null;

  @IsOptional()
  @IsString()
  details?: string | null;

  @IsOptional()
  @IsIP() // Validate định dạng IP address
  ipAddress?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;

  // Không cần thêm timestamp vào DTO vì nó sẽ được tạo tự động
  // @IsOptional()
  // @IsDate()
  // @Type(() => Date) // Biến đổi thành kiểu Date để validate
  // timestamp?: Date;
}
