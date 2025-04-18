// src/action-log/action-log.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ActionLog } from './entities/action-log.entity';
import { ActionLogController } from './action-log.controller';
import { ActionLogService } from './action-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActionLog]), // Đăng ký ActionLog entity với TypeORM
    ElasticsearchModule.register({
      nodes: ['http://localhost:9200'],
    }), // Đảm bảo ElasticsearchModule đã được import ở AppModule (hoặc import lại ở đây nếu cần cấu hình riêng)
  ],
  controllers: [ActionLogController], // Thêm controller
  providers: [ActionLogService], // Thêm service
  exports: [ActionLogService], // Export service để có thể sử dụng ở các module khác
})
export class ActionLogModule {}
