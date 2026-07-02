# Hệ Thống Tính Năng Chi Tiết (Detailed Features Specification)

Tài liệu này đặc tả chi tiết toàn bộ cấu trúc dữ liệu, thuật toán công thức, và trạng thái triển khai của game **Idle RPG**.

---

## 1. Công Thức & Thuật Toán Cốt Lõi (Core Mathematical Formulas)

Hệ thống tính toán toàn bộ chỉ số nhân vật, lực chiến (CP) và phần thưởng dựa trên các công thức dưới đây:

### A. Công Thức Tính Lực Chiến (CP Calculation Formula)
Quy định trong [formulas.ts](file:///e:/Code/IdleGame/packages/shared/src/formulas.ts#L1132-L1215):
* **Lực chiến vật phẩm (Item CP):**
  $$\text{Item CP} = \text{ATK} \times 6.0 + \text{M.ATK} \times 6.0 + \text{HP} \times 0.5 + \text{DEF} \times 4.0 + \text{M.RES} \times 4.0 + \text{SPD} \times 5.0 + \text{CRIT\_Rate}\% \times 15.0 + \text{CRIT\_Dmg}\% \times 8.0 + \text{Lifesteal}\% \times 10.0 + \text{SpellVamp}\% \times 10.0 + \text{Evasion}\% \times 12.0 + \text{Block}\% \times 12.0 + \text{Rarity\_Bonus} + (\text{Gems} \times 100)$$
  * *Rarity Bonus:* Thường (0), Đặc biệt (50), Hiếm (150), Sử Thi (400), Huyền Thoại (1000).
  * *Gems:* Cộng thêm 100 điểm CP cho mỗi ô đã khảm ngọc thuộc tính.
* **Lực chiến nhân vật (Hero CP):**
  $$\text{Hero CP} = \text{Final Stats CP} + \sum \text{Equipped Items CP}$$

### B. Công Thức Tạo Chỉ Số Quái Vật Theo Ải (Monster Scaling Formula)
Quy định trong [formulas.ts](file:///e:/Code/IdleGame/packages/shared/src/formulas.ts#L903-L1130):
* **Cấp độ Quái vật (Level):**
  $$\text{Level} = \text{Base Species Level} + (\text{Stage} - 1) + \lfloor\text{Stage} - 10\rfloor \times 0.1 + \text{World Modifier} + \text{Rank Modifier}$$
* **Thuộc tính cơ bản của quái vật:**
  $$\text{Max HP} = \text{Round}\left(120 \times 1.15^{\text{Level} - 1} \times \text{Species HP Mult} \times \text{Rank HP Mult} \times (1 + \text{Mutation Bonus})\right)$$
  $$\text{Attack} = \text{Round}\left(6 \times 1.08^{\text{Level} - 1} \times \text{Species Atk Mult} \times \text{Rank Atk Mult}\right)$$
  $$\text{Defense} = \text{Round}\left(2 \times 1.05^{\text{Level} - 1} \times \text{Species Def Mult} \times \text{Rank Def Mult}\right)$$
  $$\text{Attack Speed (Speed)} = 80 + \min(50, \text{Level} \times 0.5)$$
* **Phần thưởng nhận được:**
  $$\text{EXP Reward} = \text{Round}\left(8 \times 1.11^{\text{Stage} - 1} \times \text{Species HP Mult} \times \text{Rank Mult}\right)$$
  $$\text{Gold Drop (Min)} = \text{Round}\left(6 \times 1.12^{\text{Stage} - 1} \times \text{Species Atk Mult} \times \text{Rank Mult}\right)$$
  * *Biến dị (Mutated):* Tăng 3x HP, 2x Công, 4x Vàng rơi ra.

### C. Công Thức Rèn Ngọc & Cường Hóa (Forge Formulas)
Quy định trong [ForgeTab.tsx](file:///e:/Code/IdleGame/apps/web/src/components/tabs/ForgeTab.tsx#L70-L87):
* **Ghép Ngọc thuộc tính:**
  * Nguyên liệu: 3x Ngọc cùng Loại và cùng Cấp độ $\rightarrow$ 1x Ngọc Cấp độ + 1. Chi phí: 500 Vàng.
  * Tỉ lệ thành công theo Cấp độ ngọc nguồn:
    * Cấp 1 ➡️ Cấp 2: **100%**
    * Cấp 2 ➡️ Cấp 3: **50%**
    * Cấp 3 ➡️ Cấp 4: **10%**
    * Cấp 4 ➡️ Cấp 5: **1%**
* **Thu hồi phân tách trang bị (Dismantle Reward):**
  $$\text{Aether Shards} = \text{Round}\left(\text{Base Rarity Shards} \times (1 + (\text{Item Level} - 1) \times 0.1) \times \text{Kill Count Bonus}\right)$$
  * *Base Shards:* Đặc biệt (3), Hiếm (10), Sử Thi (30), Huyền Thoại (100).
  * *Kill Count Bonus:* Cộng thêm 0.2 nếu diệt $\ge 10.000$ quái; cộng thêm 0.5 nếu diệt $\ge 100.000$ quái.

---

## 2. Giao Diện Trạng Thái & Cấu Trúc Schema Dữ Liệu (TypeScript Types)

Các cấu trúc cốt lõi định nghĩa trạng thái lưu trữ của nhân vật và vật phẩm trong [game.ts](file:///e:/Code/IdleGame/packages/shared/src/types/game.ts):

```typescript
export interface BaseStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;        // Tốc độ đánh
  critRate: number;     // Tỉ lệ chí mạng (0 - 1)
  critDamage: number;   // Sát thương chí mạng (ví dụ 1.5 đại diện cho 150%)
  lifesteal?: number;   // Hút máu vật lý (0 - 1)
  spellVamp?: number;   // Hút máu phép thuật (0 - 1)
  evasion?: number;     // Tỉ lệ né tránh (0 - 1)
  block?: number;       // Tỉ lệ đỡ đòn (0 - 1)
  magicAttack?: number; // Công phép thuật
  magicResist?: number; // Kháng phép
  hpRecovery?: number;  // Hồi máu mỗi giây
}

export interface EquipmentItem {
  id: string;           // Instance ID duy nhất sinh ra ngẫu nhiên
  templateId: string;   // Liên kết với ItemTemplate
  name: string;
  slot: EquipmentSlot;  // 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'gloves'
  rarity: ItemRarity;   // 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  stats: BaseStats;
  quality?: number;     // Độ thuần khiết ngẫu nhiên (Common: 80-100%, Legendary: 110-160%)
  level: number;        // Cấp độ cường hóa (+1, +2, ...)
  upgradeCost: number;  // Giá vàng để nâng cấp
  equipped: boolean;    // Đã mặc lên người hay chưa
  affixes?: ItemAffix[];// Dòng thuộc tính phụ ngẫu nhiên (Prefix/Suffix)
  isIdentified?: boolean; // Đã giám định hay chưa (5% chưa giám định khi nhặt)
  isCorrupted?: boolean;  // Bị hỏng/Biến dị (0.2% cơ hội nhận thuộc tính lớn nhưng khóa nâng cấp)
  isCursed?: boolean;     // Bị nguyền rủa (1% cơ hội làm giảm chỉ số)
  sockets?: Array<string | null>; // Các ô khảm ngọc thuộc tính
}

export interface HeroState {
  name?: string;
  level: number;
  exp: number;
  maxExp: number;
  baseStats: BaseStats;
  currentStats: BaseStats;
  currentHp: number;
  gold: number;
  diamonds: number;
  aetherShards?: number;
  prestigePoints: number;
  prestigeCount: number;
  heroClass?: 'knight' | 'mage' | 'assassin';
  potions?: number;
  autoUsePotion?: boolean;
  speedElixirs?: number;
  expCharms?: number;
  equippedBoosters?: (string | null)[]; // Mảng 7 ô phím tắt chứa: 'potion', 'speed_elixir', 'exp_charm', null
  speedElixirActiveUntil?: number;       // Thời gian hết hạn của thuốc tốc độ (Timestamp ms)
  expCharmActiveUntil?: number;          // Thời gian hết hạn của bùa tăng EXP (Timestamp ms)
  goldUpgrades?: {
    attack?: number;
    hp?: number;
    hpRecovery?: number;
    critDamage?: number;
  };
  traits?: Array<{
    id: number;
    grade: 'C' | 'B' | 'A' | 'S' | 'SS';
    stat: 'atk' | 'hp' | 'crit' | 'gold';
    value: number;
    locked: boolean;
  }>;
}
```

---

## 3. Quy Tắc Bảo Mật Cơ Sở Dữ Liệu (Firebase Security Rules)

Cấu hình phân quyền đọc/ghi và xác thực kiểm tra kiểu dữ liệu trong [database.rules.json](file:///e:/Code/IdleGame/firebase/database.rules.json):

```json
{
  "rules": {
    "idleRpg": {
      "users": {
        "$uid": {
          ".read": "auth != null && auth.uid == $uid",
          ".write": "auth != null && auth.uid == $uid",
          "hero": {
            ".validate": "newData.hasChildren(['level', 'exp', 'maxExp', 'gold', 'diamonds'])",
            "speedElixirs": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "expCharms": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "speedElixirActiveUntil": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "expCharmActiveUntil": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "equippedBoosters": {
              "$index": {
                ".validate": "newData.val() == null || newData.val() == 'potion' || newData.val() == 'speed_elixir' || newData.val() == 'exp_charm'"
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 4. Đặc Tả Chi Tiết Trạng Thái Triển Khai Tính Năng (Detailed Features Checklists)

### A. Hệ Thống Thanh Phím Tắt Trận Đấu (Action Bar System)
* `[x]` **Trang Bị Bất Kỳ Cứu Thương/Bổ Trợ:** Lắp bình HP máu, thuốc tốc độ, bùa EXP vào bất kỳ ô nào trong 7 ô phím tắt.
* `[x]` **Chế độ Chỉnh Sửa Trực Quan:** Bật tắt Edit Mode bằng nút tròn bút chì. Khi bật, xuất hiện nút đỏ dấu trừ `-` định vị tuyệt đối `top-[-3px] right-[-3px]` trên mỗi ô để unequip tức thì. Bấm vào ô trống mở Popup lựa chọn các vật phẩm đang có sẵn trong túi đồ.
* `[x]` **SVG Hiển Thị Hồi Chiêu & Sử Dụng:**
  * Vẽ vòng tròn tiến trình chạy thông qua thuộc tính `strokeDashoffset` của phần tử `<circle r="18" />`.
  * Hết hiệu lực cooldown làm mờ icon đi còn `opacity-35` và hiển thị nhãn đếm ngược thời gian (Ví dụ: `14m`).
* `[x]` **Hình Ảnh Khi Kiệt Quệ Dữ Liệu (Depleted visual overlay):** Khi số lượng vật phẩm trong túi bằng 0, phím tắt hiển thị dấu gạch chéo chéo màu đỏ vẽ bằng thẻ SVG `<line x1="8" y1="30" x2="30" y2="8" stroke="#ef4444" strokeWidth="2" />` và biểu tượng icon chuyển thang màu xám (grayscale) với độ mờ cực cao để người chơi biết cần vào Shop mua thêm.
* `[x]` **Vòng Sáng Nhấp Nháy (Halo Pulsing Glow):** Khi vật phẩm có sẵn số lượng > 0 và trạng thái rảnh (không cooldown), hệ thống tạo vòng sáng màu nền thở nhịp điệu (pulse animation) tương ứng với từng hệ màu của vật phẩm để thu hút sự chú ý.

### B. Hệ Thống Cửa Hàng & Mua Nhiều (Bulk Shop System)
* `[x]` **Xếp Dọc Toàn Bộ Nút Giao Dịch:** Nút Mua mặc định và nút Mua Nhiều được xếp chồng dọc để giải quyết triệt để lỗi khuất chữ và vỡ khung layout trên màn hình nhỏ.
* `[x]` **Giao Diện Mua Nhiều Cao Cấp:**
  * Cho phép người chơi tăng/giảm số lượng thông qua phím bấm cộng trừ hoặc click trực tiếp vào ô input để nhập con số tùy thích.
  * Phím chọn nhanh thiết lập trước số lượng: `10`, `20`, `50`, `100` để tiết kiệm thao tác.
  * Tự động hiển thị và cập nhật tổng chi phí theo thời gian thực.
  * Nút xác nhận tự động vô hiệu hóa nếu số dư Vàng/Kim Cương của người chơi không đủ để giao dịch.

### C. Đồng Bộ & Chuẩn Hóa Save Tải Game (Firebase Array Restoration)
* `[x]` **Phục Hồi Dữ Liệu Mảng Thưa:** Firebase Realtime DB chuyển đổi các mảng chứa null thành đối tượng JSON keys khi lưu trữ. Tại [client.ts](file:///e:/Code/IdleGame/packages/firebase/src/client.ts#L150-L163) và [mockDb.ts](file:///e:/Code/IdleGame/packages/firebase/src/mockDb.ts#L335-L348), hàm khôi phục dữ liệu sẽ tự động chuyển đổi định dạng `{ "0": "potion", "2": "speed_elixir" }` về mảng 7 phần tử tuần tự chuẩn nhằm ngăn ngừa lỗi crash giao diện map/filter ở phía Client.
