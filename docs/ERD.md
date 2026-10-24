# Rancangan Basis Data BengkelKu (SQLite)

```mermaid
erDiagram
  users ||--o{ vehicles : memiliki
  users ||--o{ bookings : membuat
  vehicles ||--o{ bookings : diservis
  services ||--o{ bookings : dipesan
  bookings ||--o| service_history : menghasilkan
  vehicles ||--o{ service_history : memiliki

  users { int id PK
          text name
          text email UK
          text phone
          text password_hash
          text role "customer | admin" }
  vehicles { int id PK
             int user_id FK
             text plate_number UK
             text brand
             text model
             int year
             text vehicle_type "motor | mobil"
             int odometer }
  services { int id PK
             text name UK
             int price
             int duration_minutes
             int interval_days
             int interval_km
             int is_active }
  bookings { int id PK
             text code UK
             int user_id FK
             int vehicle_id FK
             int service_id FK
             text booking_date
             text time_slot
             text status "pending | confirmed | in_progress | completed | cancelled" }
  service_history { int id PK
                    int booking_id FK,UK
                    int vehicle_id FK
                    int odometer
                    text work_done
                    int total_cost
                    text next_service_date
                    int next_service_km }
```

## Aturan bisnis utama

| Aturan | Penjelasan |
|---|---|
| Kuota slot | Maksimal `SLOT_CAPACITY` (default 2) booking aktif per tanggal dan jam; dicek di dalam transaksi |
| Hari libur | Booking pada hari Minggu dan tanggal lampau ditolak |
| Satu kendaraan | Tidak boleh punya dua booking aktif pada tanggal yang sama |
| Jenis layanan | Layanan motor tidak bisa dipesan untuk mobil (dan sebaliknya) |
| Alur status | pending → confirmed → in_progress → completed; pembatalan dari status aktif |
| Penyelesaian | Dalam satu transaksi: simpan riwayat, naikkan odometer, tandai booking selesai |
| Pengingat | Servis berikutnya = tanggal servis + `interval_days` atau kilometer + `interval_km`. `overdue` bila lewat, `soon` bila ≤ 14 hari atau ≤ 300 km |
| Hapus layanan | Layanan yang pernah dibooking dinonaktifkan agar riwayat tetap utuh |
