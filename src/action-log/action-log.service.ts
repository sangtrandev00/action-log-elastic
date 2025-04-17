// src/action-log/action-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
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

    // 2. Inject ElasticsearchService để gửi log đến ES
    private readonly elasticsearchService: ElasticsearchService,
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
  async createLog(createActionLogDto: CreateActionLogDto): Promise<ActionLog> {
    try {
      // 1. Tạo entity mới từ DTO
      const newLog = this.actionLogRepository.create(createActionLogDto);

      // 2. Lưu vào MariaDB (tùy chọn, bạn có thể chỉ muốn log vào ES)
      // const savedLog = await this.actionLogRepository.save(newLog);
      // this.logger.log(`ActionLog saved to DB with ID: ${savedLog.id}`);

      // 3. Gửi log đến Elasticsearch (sử dụng newLog vì nó đã có timestamp được tạo tự động)
      // Chúng ta không cần đợi Elasticsearch phản hồi (fire-and-forget) để tránh làm chậm request chính
      // Tuy nhiên, nên có cơ chế xử lý lỗi nếu gửi thất bại (e.g., retry, log lỗi)
      this.elasticsearchService
        .index({
          index: this.esIndex, // Chỉ định index
          // id: savedLog.id, // Tùy chọn: Sử dụng ID từ DB làm ID document trong ES
          document: {
            // Nội dung document gửi lên ES
            ...newLog,
            timestamp: newLog.timestamp || new Date(), // Đảm bảo có timestamp
          },
        })
        .then((res) =>
          this.logger.log(`ActionLog indexed to Elasticsearch: ${res._id}`),
        )
        .catch((err) =>
          this.logger.error('Failed to index ActionLog to Elasticsearch:', err),
        );

      // Trả về bản ghi đã tạo (chưa cần đợi ES)
      // return savedLog;
      return newLog; // Trả về log vừa tạo (chưa lưu DB trong ví dụ này)
    } catch (error) {
      this.logger.error('Error creating ActionLog:', error);
      // Xử lý lỗi (ví dụ: throw HttpException)
      throw error;
    }
  }

  // Bạn có thể thêm các phương thức khác để tìm kiếm log trong Elasticsearch tại đây
  // Ví dụ:
  // async searchLogs(query: string): Promise<any> {
  //   try {
  //     const { hits } = await this.elasticsearchService.search({
  //       index: this.esIndex,
  //       body: {
  //         query: {
  //           multi_match: { // Tìm kiếm trên nhiều trường
  //             query: query,
  //             fields: ['userId', 'actionType', 'targetId', 'details', 'ipAddress']
  //           }
  //         }
  //       }
  //     });
  //     return hits.hits.map(hit => hit._source); // Trả về mảng các document tìm thấy
  //   } catch (error) {
  //     this.logger.error('Error searching logs in Elasticsearch:', error);
  //     throw error;
  //   }
  // }
}
