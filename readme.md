# SprintFlow Backend

## Kullanılan Teknolojiler
- Node.js
- Express.js
- TypeScript
- Firebase Firestore
- JWT Authentication
- Zod Validation

## API Endpointleri

### Authentication
- `POST /api/v1/auth/register` → Kullanıcı kaydı
- `POST /api/v1/auth/login` → Kullanıcı girişi

### Sprint Yönetimi
- `POST /api/v1/sprints/create` → Yeni sprint oluştur
- `POST /api/v1/sprints/join` → Sprint'e katıl

### Feedback
- `GET /api/v1/sprints/:id/feedbacks` → Sprint'e ait feedback'leri listele
- `POST /api/v1/feedback/submit` → Feedback gönder

### Voting
- `POST /api/v1/vote` → Feedback için oy ver

## Veritabanı Yapısı

- `users`: email, name, passwordHash, joinedRetros[]
- `sprints`: id, title, description, createdBy, createdAt, expiresAt, status
- `feedbacks`: id, sprintId, participantId, start, stop, continue, upvotes, downvotes, createdAt
- `votes`: id, sprintId, feedbackId, voter, vote

## Çalışma Akışı

1. Kullanıcı kayıt olur veya giriş yapar.
2. Dashboard ekranında retro oluşturur veya retroya katılır.
3. Retro içerisinde feedback verir.
4. Feedback'lere oy verilir.
5. Admin, feedback'leri görüntüleyip sıralayabilir.
