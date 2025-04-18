// src/action-log/action-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
// Import the response type for better type safety
import { ActionLog } from './entities/action-log.entity';
import { CreateActionLogDto } from './dto/create-action-log.dto';

@Injectable()
export class ActionLogService {
  private readonly logger = new Logger(ActionLogService.name);
  private readonly esIndex = 'action_logs'; // Tên index trong Elasticsearch

  constructor(
    // 1. Inject TypeORM Repository để lưu vào MariaDB
    @InjectRepository(ActionLog)
    private readonly actionLogRepository: Repository<ActionLog>,
    private readonly elasticsearchService: ElasticsearchService,

    // 2. Inject ElasticsearchService để gửi log đến ES
  ) {
    // Tùy chọn: Kiểm tra và tạo index nếu chưa tồn tại khi service khởi tạo
    this.ensureIndexExists();
  }

  /**
   * Đảm bảo index 'action_logs' tồn tại trong Elasticsearch.
   * Nếu không, tạo index mới.
   */
  private async ensureIndexExists(): Promise<void> {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.esIndex,
      });
      if (!indexExists) {
        this.logger.log(`Index '${this.esIndex}' does not exist. Creating...`);
        await this.elasticsearchService.indices.create({
          index: this.esIndex,
          // Bạn có thể định nghĩa mappings (schema) cho index ở đây nếu muốn
          // body: {
          //   mappings: {
          //     properties: {
          //       timestamp: { type: 'date' },
          //       userId: { type: 'keyword' }, // Dùng keyword cho ID để tìm kiếm chính xác và aggregation
          //       actionType: { type: 'keyword' },
          //       targetId: { type: 'keyword' },
          //       targetType: { type: 'keyword' },
          //       details: { type: 'text' }, // Dùng text cho nội dung cần full-text search
          //       ipAddress: { type: 'ip' }, // Kiểu dữ liệu IP
          //       userAgent: { type: 'text' },
          //     }
          //   }
          // }
        });
        this.logger.log(`Index '${this.esIndex}' created successfully.`);
      } else {
        this.logger.log(`Index '${this.esIndex}' already exists.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure index '${this.esIndex}' exists:`,
        error,
      );
      // Xử lý lỗi phù hợp, ví dụ: throw error để dừng ứng dụng nếu ES là bắt buộc
    }
  }

  /**
   * Tạo một bản ghi ActionLog mới, lưu vào DB và gửi đến Elasticsearch.
   * @param createActionLogDto Dữ liệu log cần tạo
   * @returns Bản ghi ActionLog đã được tạo và lưu
   */
  // async createLog(createActionLogDto: CreateActionLogDto): Promise<ActionLog> {
  //   try {
  //     // 1. Tạo entity mới từ DTO
  //     const newLog = this.actionLogRepository.create(createActionLogDto);
  //     // Ensure timestamp is set if not automatically handled by TypeORM @CreateDateColumn before indexing
  //     if (!newLog.timestamp) {
  //       newLog.timestamp = new Date();
  //     }

  //     // 2. Lưu vào MariaDB (Optional, uncomment if needed)
  //     // const savedLog = await this.actionLogRepository.save(newLog);
  //     // this.logger.log(`ActionLog saved to DB with ID: ${savedLog.id}`);

  //     // 3. Gửi log đến Elasticsearch (v8 syntax)
  //     this.elasticsearchService
  //       .index<Record<string, any>>({
  //         index: this.esIndex,
  //         body: newLog, // Use 'body' instead of 'document' for v8.10.0
  //       })
  //       .then((res: any) =>
  //         // Access result differently in v8
  //         this.logger.log(`ActionLog indexed to Elasticsearch: ${res._id}`),
  //       )
  //       .catch((err) => {
  //         this.logger.error(
  //           'Failed to index ActionLog to Elasticsearch:',
  //           err.meta?.body || err,
  //         );
  //       });

  //     // Return the newly created log object
  //     return newLog; // Return newLog (or savedLog if you save to DB)
  //   } catch (error) {
  //     this.logger.error('Error creating ActionLog:', error);
  //     throw error;
  //   }
  // }

  // src/action-log/action-log.service.ts

  async createLog(createActionLogDto: CreateActionLogDto): Promise<ActionLog> {
    try {
      // 1. Create entity from DTO
      const newLog = this.actionLogRepository.create(createActionLogDto);

      // Ensure timestamp is set if not automatically handled by TypeORM
      if (!newLog.timestamp) {
        newLog.timestamp = new Date();
      }

      // 2. Save to MariaDB (optional)
      const savedLog = await this.actionLogRepository.save(newLog);
      this.logger.log(`ActionLog saved to DB with ID: ${savedLog.id}`);

      // 3. Check if Elasticsearch service is available
      if (!this.elasticsearchService) {
        this.logger.error('Elasticsearch service is not available');
        return savedLog;
      }

      // 4. Send log to Elasticsearch - check which version syntax to use
      try {
        // For Elasticsearch 8.x
        await this.elasticsearchService.index({
          index: this.esIndex,
          document: savedLog,
        });
        this.logger.log(`ActionLog indexed to Elasticsearch: ${savedLog.id}`);
      } catch (esError) {
        try {
          // Fallback for Elasticsearch 7.x
          await this.elasticsearchService.index({
            index: this.esIndex,
            body: savedLog,
          });
          this.logger.log(
            `ActionLog indexed to Elasticsearch with 7.x syntax: ${savedLog.id}`,
          );
        } catch (fallbackError) {
          this.logger.error('Failed to index to Elasticsearch:', fallbackError);
        }
      }

      // Return the saved log
      return savedLog;
    } catch (error) {
      this.logger.error('Error creating ActionLog:', error);
      throw error;
    }
  }

  // Bạn có thể thêm các phương thức khác để tìm kiếm log trong Elasticsearch tại đây
  // Ví dụ:
  async searchLogs(query: string): Promise<any> {
    try {
      const { hits } = await this.elasticsearchService.search({
        index: this.esIndex,
        body: {
          query: {
            multi_match: {
              // Tìm kiếm trên nhiều trường
              query: query,
              fields: [
                'userId',
                'actionType',
                'targetId',
                'details',
                'ipAddress',
              ],
            },
          },
        },
      });
      return hits.hits.map((hit) => hit._source); // Trả về mảng các document tìm thấy
    } catch (error) {
      this.logger.error('Error searching logs in Elasticsearch:', error);
      throw error;
    }
  }

  async searchLogsPagination(
    query: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{ data: any[]; total: number }> {
    try {
      // Calculate from based on page number (0-indexed)
      const from = (page - 1) * size;

      const response = await this.elasticsearchService.search({
        index: this.esIndex,
        body: {
          from: from, // Starting position (similar to skip)
          size: size, // Number of results to return (similar to take)
          query: {
            multi_match: {
              query: query,
              fields: [
                'userId',
                'actionType',
                'targetId',
                'details',
                'ipAddress',
              ],
            },
          },
          // Optionally add sorting
          sort: [
            { timestamp: { order: 'desc' } }, // Most recent logs first
          ],
        },
      });

      // Return both the results and the total count
      return {
        data: response.hits.hits.map((hit) => hit._source),
        total:
          typeof response.hits.total === 'number'
            ? response.hits.total
            : response.hits.total.value,
      };
    } catch (error) {
      this.logger.error('Error searching logs in Elasticsearch:', error);
      throw error;
    }
  }
}
