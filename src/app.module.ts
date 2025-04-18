// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActionLogModule } from './action-log/action-log.module'; // Import module ActionLog
import { ActionLog } from './action-log/entities/action-log.entity'; // Import Entity

@Module({
  imports: [
    // 1. Cấu hình Module Config để đọc biến môi trường từ file .env
    ConfigModule.forRoot({
      isGlobal: true, // Biến ConfigModule thành global
      envFilePath: '.env', // Đường dẫn tới file .env
    }),

    // 2. Cấu hình TypeORM để kết nối MariaDB
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule để sử dụng ConfigService
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // Chỉ định loại database là mysql (tương thích MariaDB)
        host: configService.get<string>('DB_HOST', 'localhost'), // Lấy host từ .env, mặc định là localhost
        port: configService.get<number>('DB_PORT', 3306), // Port MariaDB
        username: configService.get<string>('DB_USERNAME', 'root'), // Username
        password: configService.get<string>('DB_PASSWORD', ''), // Password
        database: configService.get<string>('DB_DATABASE', 'test_log_db'), // Tên database
        entities: [ActionLog], // Danh sách các entity (Thêm ActionLog vào đây)
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // Tự động tạo/cập nhật schema DB (chỉ dùng cho dev)
        // logging: true, // Bật log SQL query (hữu ích khi debug)
      }),
    }),
    // 3. Elasticsearch Module Configuration
    // 3. Elasticsearch Module Configuration
    // ElasticsearchModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     node: configService.get<string>('ELASTICSEARCH_NODE'),
    //     maxRetries: 10,
    //     requestTimeout: 60000,
    //   }),
    // }),
    ElasticsearchModule.register({
      nodes: ['http://localhost:9200'],
    }),

    // 4. Import Module ActionLog
    ActionLogModule,
  ],
  controllers: [AppController], // Controller mặc định
  providers: [AppService], // Service mặc định
})
export class AppModule {}
