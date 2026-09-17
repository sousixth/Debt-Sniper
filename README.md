# 🎯 DebtSniper (เดบต์สไนเปอร์)
> **ระบบวางแผนสไนเปอร์ปลดหนี้สู่ชีวิตอิสระ (รองรับ Login & Cloud Auto-Sync)**

---

## ✨ จุดเด่นของ DebtSniper
1. **ระบบ Login & Cloud Auto-Sync:** ล็อกอินด้วย Email & Password บนคอมพิวเตอร์หรือมือถือ ข้อมูลจะตรงกันอัตโนมัติทันที
2. **กลยุทธ์ Snowball Sniper:** ระบบเล็งยิงหนี้ก้อนเล็กสุดให้แตกก่อน เพื่อปลดล็อกเงินค่างวดขั้นต่ำคืนสู่กระเป๋า
3. **ดีไซน์ iOS 27 Glassmorphism:** สวยหรูสไตล์กระจกฝ้า Apple VisionOS รองรับการสัมผัสสมูทแบบสปริงและเสียงคลิกสัมผัส
4. **PWA Ready:** รองรับการติดตั้งลงหน้าจอมือถือ (Add to Home Screen) เสมือนแอปแท้ 100%

---

## 🚀 วิธีเปิดใช้งาน

### วิธีที่ 1: เปิดใช้งานบนคอมพิวเตอร์ทันที (ออฟไลน์ / Local)
- ดับเบิลคลิกเปิดไฟล์ `index.html` ด้วย Google Chrome หรือ Microsoft Edge ใช้งานได้ทันที

### วิธีที่ 2: นำขึ้น GitHub Pages เพื่อเปิดใช้งานบนมือถือได้ทุกที่ (ฟรี 100%)
1. สร้าง New Repository บน GitHub ของคุณ (เช่น ตั้งชื่อว่า `debt-sniper`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป (`index.html`, `app.js`, `manifest.json`, `sw.js`)
3. ไปที่ **Settings** ของ Repository ➔ เมนู **Pages** ด้านซ้าย
4. ในส่วน **Branch** เลือก `main` และ `/root` แล้วกด **Save**
5. รอ 1 นาที คุณจะได้ลิงก์ เช่น `https://username.github.io/debt-sniper/`
6. เปิดลิงก์นี้บนมือถือ แล้วกด **"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"** จะได้แอปเต็มจอบนมือถือทันที!

---

## ☁️ วิธีเชื่อมต่อระบบ Login & Cloud Auto-Sync (Supabase ฟรี)

หากต้องการให้ล็อกอินบนคอมแล้วเปิดบนมือถือข้อมูลตรงกันอัตโนมัติ:

1. สมัครใช้งานฟรีที่ [supabase.com](https://supabase.com) แล้วกด **New Project**
2. ไปที่เมนู **SQL Editor** ด้านซ้าย วางคำสั่งด้านล่างนี้แล้วกด **Run**:

```sql
create table if not exists user_debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  debts jsonb default '[]'::jsonb,
  budget jsonb default '{}'::jsonb,
  history jsonb default '[]'::jsonb,
  strategy text default 'snowball',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_debts enable row level security;

create policy "Users can manage their own debts"
  on user_debts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

3. ไปที่ **Project Settings** ➔ **API** คัดลอก:
   - **Project URL**
   - **anon public key**
4. เปิดแอป DebtSniper ➔ กดปุ่ม **"👤 เข้าสู่ระบบ"** ➔ กด **"⚙️ ตั้งค่า Cloud"**
5. วาง URL และ Key ลงไป แล้วกด **"บันทึกการเชื่อมต่อ"**
6. คุณสามารถสมัครสมาชิก (Register) หรือเข้าสู่ระบบ (Sign In) ใช้งานและซิงก์ข้อมูลข้ามเครื่องได้ทันทีครับ!
