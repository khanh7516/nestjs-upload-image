# Tăng performance cho API upload ảnh lên cloud storage

## Vấn đề
- API server bị quá tải khi xử lý nhiều ảnh lớn đồng thời
- Làm tăng độ trễ gây ảnh hưởng tới luồng xử lý chính

## Mục tiêu
- Tăng khả năng chịu tải khi nhiều người upload ảnh cùng lúc
- Đảm bảo hiệu năng ổn định, scale tốt

## Hướng giải quyết

Để tối ưu hiệu năng upload ảnh, giải pháp được áp dụng là:

### Stream Upload + Queue (BullMQ) + Worker xử lý

Thay vì xử lý toàn bộ ảnh trong API request, hệ thống được tách làm hai phần:

1. **API nhận ảnh (NestJS Controller)**
   - Sử dụng `Multer` kết hợp `stream.Readable` để nhận ảnh từ client mà không cần load toàn bộ ảnh vào RAM.
   - Tạm lưu ảnh (hoặc buffer) và đẩy job vào hàng đợi (BullMQ).

2. **Queue (BullMQ)**
   - API gửi job vào hàng đợi với các thông tin ảnh (tên file, đường dẫn tạm, buffer, metadata…).
   - Việc này giúp API phản hồi sớm, không chặn request.

3. **Worker xử lý upload (NestJS App khác hoặc module riêng)**
   - Worker lắng nghe queue `upload-image`.
   - Khi có job, worker:
     - Đọc dữ liệu ảnh (từ buffer hoặc file tạm)
     - Upload ảnh lên S3 hoặc MinIO bằng stream
     - Ghi log vào DB hoặc lưu metadata

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|----------|
| API Backend | [NestJS](https://nestjs.com/) |
| Upload handler | [Multer](https://github.com/expressjs/multer), `stream.Readable` |
| Queue | [BullMQ](https://docs.bullmq.io/), `@nestjs/bull` |
| Cloud Storage | AWS S3 (hoặc [MinIO](https://min.io/)) |
| Test hiệu năng | [k6](https://k6.io/) |
| Monitor Queue | [Bull Board](https://github.com/felixmosh/bull-board), custom log |


## Set up minio local

```
curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

```
sudo apt update && sudo apt install jq
```

### Set local minio 
```
mc alias set local http://localhost:9000 minioadmin minioadmin123
```

### Đếm số lượng object

```
mc ls --recursive --json local/my-bucket | jq -s 'length'
```