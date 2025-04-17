// src/action-log/action-log.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Ip,
} from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { CreateActionLogDto } from './dto/create-action-log.dto';
import { ActionLog } from './entities/action-log.entity';

@Controller('action-logs') // Định nghĩa route base là /action-logs
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) {}

  /**
   * Endpoint để tạo một log mới (ví dụ)
   * Sử dụng ValidationPipe để tự động validate body request dựa trên CreateActionLogDto
   */
  @Post() // HTTP POST /action-logs
  @HttpCode(HttpStatus.CREATED) // Trả về status code 201 Created
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // Bật validation và loại bỏ các thuộc tính không có trong DTO
  async create(
    @Body() createActionLogDto: CreateActionLogDto,
    @Ip() ip: string, // Lấy IP của client từ request
  ): Promise<ActionLog> {
    // Bổ sung IP và User Agent (nếu có) vào DTO trước khi log
    // User Agent thường lấy từ header 'User-Agent', bạn có thể inject @Headers() để lấy
    const logData: CreateActionLogDto = {
      ...createActionLogDto,
      ipAddress: ip,
      // userAgent: headers['user-agent'] // Ví dụ lấy user agent
    };
    return this.actionLogService.createLog(logData);
  }

  // Ví dụ endpoint để test tìm kiếm (nếu bạn đã implement hàm search trong service)
  // @Get('search')
  // async search(@Query('q') query: string): Promise<any> {
  //   if (!query) {
  //     return { message: 'Please provide a search query using ?q=' };
  //   }
  //   return this.actionLogService.searchLogs(query);
  // }
}
