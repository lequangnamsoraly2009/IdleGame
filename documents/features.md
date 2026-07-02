# Hệ Thống Tính Năng Chi Tiết (Detailed Features Specification)

Tài liệu này liệt kê toàn bộ các tính năng của game Idle RPG, được phân chia theo trạng thái hoàn thành:
* `[x]` Đã hoàn thành (Completed)
* `[/]` Đang phát triển/Cần tối ưu thêm (In Progress / Optimization Needed)
* `[ ]` Lên kế hoạch sắp làm (Planned)

---

## 1. Hệ Thống Chiến Đấu & Cốt Lõi (Core Combat & Stage System)
* `[x]` **Vòng Lặp Chiến Đấu Tự Động (Auto Combat Loop):** Người chơi tự động tấn công quái vật theo chu kỳ giây, tính toán sát thương, thuộc tính chí mạng và né tránh.
* `[x]` **Tiến Trình Ải (Stage Progression):** Vượt qua đủ số lượng quái vật yêu cầu ở mỗi ải để mở khóa nút khiêu chiến Ải tiếp theo hoặc tự động qua ải.
* `[x]` **Tích Lũy Kinh Nghiệm & Lên Cấp (Level & Experience Scaling):** Hệ thống tăng cấp độ nhân vật khi đủ điểm kinh nghiệm, gia tăng thuộc tính cơ bản tùy theo phân lớp.
* `[x]` **Nhật Ký Chiến Đấu (Visual Battle Feed):** Bảng ghi logs thời gian thực chia làm các bộ lọc: Tất cả (All), Chiến đấu (Combat), Nhặt đồ (Loot).
* `[/]` **Tích Lũy Ngoại Tuyến (Offline Idle Gains):** Nhận tài nguyên (Vàng, EXP, Trang bị) tương ứng với thời gian ngoại tuyến. *Cần tối ưu giao diện tổng kết tài nguyên khi đăng nhập lại.*
* `[x]` **Trùng Sinh / Chuyển Sinh (Prestige System):** Đặt lại cấp độ và ải về 1 để nhận Điểm Trùng Sinh, dùng để tăng vĩnh viễn các chỉ số sát thương, máu và lượng vàng rơi ra.

---

## 2. Lớp Nhân Vật & Thuộc Tính (Hero Classes & Attributes)
* `[x]` **Phân Lớp Nhân Vật (Hero Classes):** Lựa chọn 1 trong 3 class khi khởi tạo:
  * **Hiệp Sĩ (Knight):** Trọng máu, thủ cao, tốc độ trung bình.
  * **Pháp Sư (Mage):** Công phép mạnh, chí mạng cao, máu giấy.
  * **Sát Thủ (Assassin):** Tốc độ đánh cực nhanh, tỉ lệ chí mạng và sát thương chí mạng vượt trội.
* `[x]` **Cường Hóa Chỉ Số Bằng Vàng (Gold Upgrades):** Tiêu vàng để cộng điểm nâng cấp chỉ số cơ bản trực tiếp: Tấn công (Attack), HP, Hồi HP (HP Recovery), Sát thương Chí mạng (Crit Damage).
* `[x]` **Hệ Thống Thiên Phú (Hero Traits System):**
  * Tối đa 5 dòng thiên phú ngẫu nhiên từ phẩm chất C đến SS.
  * Hỗ trợ **Khóa dòng thiên phú** để giữ lại các chỉ số tốt khi quay (Roll) lại các dòng còn lại.
  * Tích hợp tính toán các kích hoạt kích duyên thiên phú đồng bộ để cộng thêm chỉ số cộng dồn.
* `[x]` **Bộ Đệm Trạng Thái Bổ Trợ (Active Buff Tracker):** Hiển thị danh sách các thuốc/bùa đang kích hoạt (Thuốc Tốc Độ, Bùa EXP) kèm đồng hồ đếm ngược thời gian hiệu lực trực tiếp trên tab thuộc tính.

---

## 3. Hòm Đồ & Trang Bị (Inventory & Equipment)
* `[x]` **6 Ô Trang Bị Nhân Vật:** Vũ Khí (Weapon), Áo Giáp (Armor), Mũ (Helmet), Giày (Boots), Nhẫn (Ring), Găng Tay (Gloves).
* `[x]` **Phân Cấp Phẩm Chất (Rarity Tiers):** Thường (Common), Đặc Biệt (Uncommon), Hiếm (Rare), Sử Thi (Epic), Huyền Thoại (Legendary).
* `[x]` **Chỉ Số Theo Độ Thuần Khiết (Quality Scaling):** Chỉ số trang bị được scale ngẫu nhiên từ 1% đến 100% độ thuần khiết (Quality).
* `[x]` **Phân Tách Trang Bị (Dismantle):** Phân tách các trang bị không dùng tới thành vàng và Thần Khí Aether Shards.
* `[x]` **Tự Động Phân Tách (Auto Dismantle Switches):** Cấu hình tự động phân tách ngay lập tức các trang bị Thường, Đặc biệt, hoặc Hiếm khi nhặt được để tránh đầy rương.
* `[x]` **Khóa Rương Đầy Cảnh Báo:** Ngăn chặn nhặt thêm trang bị hoặc triệu hồi khi hòm đồ đã đạt giới hạn tối đa.

---

## 4. Thanh Phím Tắt Trận Đấu (Battle Action Bar & Shortcut Slots)
* `[x]` **7 Ô Phím Tắt Tùy Chỉnh (7 Customizable Shortcut Slots):** Người chơi có thể tự do gán bất kỳ vật phẩm tiêu hao nào vào các ô này.
* `[x]` **Chế Độ Chỉnh Sửa (Edit Mode):** Nút chỉnh sửa tròn (✏️ / ✓) để bật/tắt chế độ quản lý phím tắt:
  * Khi bật: Hiển thị nút đỏ dấu trừ (`-`) trên mỗi ô để gỡ bỏ nhanh. Click vào ô trống hiển thị danh sách trang bị sẵn có để lắp.
* `[x]` **Hiển Thị Số Lượng Rõ Ràng (Badge Quantity):** Badge số lượng màu nền đỏ/tím/hoàng kim tương phản cao, căn giữa dưới vòng tròn phím tắt giúp người chơi dễ nhìn con số.
* `[x]` **Vòng Cooldown SVG Chuyển Động (Dynamic SVG Ring):** Hiển thị đếm ngược thời gian hoạt động của thuốc hoặc bùa hiệu ứng thông qua vòng tròn vẽ SVG mịn màng, loại bỏ các viền đúp xấu xí.
* `[x]` **Hiệu Ứng Làm Mờ & Gạch Chéo Khi Hết (Depletion Indicators):** Khi số lượng vật phẩm bằng 0, phím tắt sẽ bị vô hiệu hóa, hình ảnh icon mờ đi 20% kèm một đường gạch chéo màu đỏ để hiển thị trực quan trạng thái hết hàng.
* `[x]` **Vòng Sáng Nhấp Nháy Sẵn Sàng (Ready Pulsing Halo Glow):** Ô phím tắt có lượng vật phẩm > 0 và đã hồi chiêu sẽ có vòng sáng nhịp thở nhấp nháy (Đỏ cho Máu, Vàng cho Thuốc Tốc Độ, Tím cho Bùa EXP) nhằm kích thích người chơi nhấn sử dụng.

---

## 5. Cửa Hàng & Triệu Hồi (Shop & Summon System)
* `[x]` **Shop Vàng (Gold Shop):** Mua gói vàng tăng trưởng quy đổi bằng Kim cương (quy mô vàng nhận được tăng dần theo tiến trình Ải hiện tại).
* `[x]` **Shop Kim Cương (Diamond Shop):**
  * **Rương Bình Máu:** Mở khóa 30 Bình HP tự động hồi phục.
  * **Thuốc Tốc Độ (Speed Elixir):** Tăng 50% tốc độ đánh trong 15 phút.
  * **Bùa EXP (EXP Charm):** Nhân đôi lượng kinh nghiệm nhận được từ quái vật trong 15 phút.
* `[x]` **Mua Nhiều (Bulk Purchase Modal):** 
  * Cửa sổ popup mua nhiều tích hợp nút tăng giảm nhanh (`+` / `-`) hoặc cho phép nhập trực tiếp số lượng tùy chỉnh.
  * Phím tắt chọn nhanh số lượng gợi ý sẵn: `10`, `20`, `50`, `100`.
  * Tự động tính toán tổng số tiền tiêu hao và kiểm tra số dư của người chơi.
  * Được thiết kế xếp dọc gọn gàng giúp giao diện thông thoáng, không bị khuất chữ.
* `[x]` **Triệu Hồi Thần Khí (Sacred Summon):** Tiêu kim cương để gacha mở khóa các trang bị ngẫu nhiên (Vũ khí, Giáp, Giày, Nhẫn) từ Thường đến Huyền Thoại với bảng tỷ lệ rơi công khai.

---

## 6. Lò Rèn & Khảm Ngọc (Forge & Gem Crafting)
* `[x]` **Lò Ghép Ngọc (Gem Crafting Formula):** Ghép 3 viên ngọc cùng loại và cùng cấp độ để nâng lên cấp độ tiếp theo (Tối đa Cấp 5). Tỉ lệ ghép thành công giảm dần theo cấp độ ngọc (100%, 50%, 10%, 1%).
* `[x]` **Ngọc Thuộc Tính (Attribute Gems):** Có 5 hệ ngọc:
  * **Hồng Ngọc (Ruby):** Tăng Công (ATK).
  * **Hoàng Ngọc (Topaz):** Tăng Công Phép (M.ATK).
  * **Lục Bảo (Emerald):** Tăng HP.
  * **Lam Bảo (Sapphire):** Tăng Giáp (DEF).
  * **Thạch Anh (Amethyst):** Tăng Chí Mạng (CRIT).
* `[x]` **Cường Hóa Thiết Bị (Quick Reforge):** Nâng cấp cấp độ cường hóa của các trang bị đang mặc trên người (+1, +2, ...) tiêu tốn lượng Vàng tăng dần.

---

## 7. Phó Bản & Hầm Ngục (Dungeon Challenge Portal)
* `[x]` **Bốn Cổng Phó Bản Phân Loại:**
  * Phó bản Ngọc Thuộc Tính (Gem Dungeon).
  * Phó bản Vàng (Gold Dungeon).
  * Phó bản Kim Cương (Diamond Dungeon).
  * Phó bản Trang Bị (Gear Dungeon).
* `[x]` **Độ Khó Cấp Độ Yêu Cầu (Level Gate & Bosses):** Mỗi cổng gồm 3 độ khó: Dễ (Easy), Thường (Normal), Khó (Hard) yêu cầu cấp độ nhân vật khác nhau và sở hữu các Boss riêng biệt với lượng máu khủng.
* `[x]` **Hệ Thống Vé Vào Cổng (Dungeon Tickets):** Tiêu tốn 1 vé mỗi lượt đi, hỗ trợ mua thêm vé bằng vàng trực tiếp ngay tại header của phó bản.

---

## 8. Bang Hội & Đột Kích Boss (Guild & Raid System)
* `[x]` **Điểm Danh Hàng Ngày (Guild Check-In):** Quyên góp Vàng hoặc Kim Cương để nhận điểm cống hiến đóng đóng góp nâng cấp cấp độ Bang Hội.
* `[x]` **Thành Viên Đội Raid (Raid Team CP calculation):** Hiển thị lực chiến tổng hợp của bản thân và các thành viên AI trong Bang Hội để cùng nhau khiêu chiến.
* `[x]` **Đột Kích Boss Bang (Guild Raid Boss):** Khiêu chiến Rồng Hư Không Void Behemoth sở hữu 25.000.000 HP cùng cả Bang Hội để nhận các phần thưởng cao cấp.

---

## 9. Sổ Tay Lữ Khách (Traveler Wiki / Guide)
* `[x]` **Bảng Tra Cứu Tỉ Lệ (Drop Tables):** Tra cứu tỉ lệ rơi phẩm chất, tỉ lệ nâng cấp ngọc thuộc tính chi tiết.
* `[x]` **Hướng Dẫn Thuộc Tính (Attributes Guide):** Giải thích cặn kẽ ý nghĩa các chỉ số thuộc tính trong game để hỗ trợ người chơi xây dựng nhân vật tối ưu.
