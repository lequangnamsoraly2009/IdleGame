import React from 'react';
import { useLanguageStore } from '../stores/languageStore';

interface GuideModalProps {
  topic: string;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ topic, onClose }) => {
  const { language } = useLanguageStore();
  const isVi = language === 'vi';

  const renderGuideContent = () => {
    switch (topic) {
      case 'character':
        return (
          <div className="space-y-3 leading-relaxed text-slate-305">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '👤 TRẠNG THÁI SLIME:' : '👤 SLIME STATUS:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Cấp độ nhân vật tăng dần thông qua tích lũy EXP khi tiêu diệt quái vật ở ải cốt truyện.' : 'Hero levels increase by accumulating EXP from defeating monsters in stage battles.'}</li>
              <li>{isVi ? 'Sử dụng Vàng nhận được để cường hóa vĩnh viễn các chỉ số Tấn Công, HP, Hồi Phục, và Chí mạng ở bảng Cường Hóa Vàng tại trang chủ.' : 'Spend Gold earned from battles to permanently enhance Attack, Max HP, HP Regen, and Critical Damage at the Gold Upgrades section.'}</li>
              <li>{isVi ? 'Bạn có thể tự do thay đổi chức nghiệp bất kỳ lúc nào tại menu cài đặt (Hiệp Sĩ, Pháp Sư, Sát Thủ).' : 'You can freely switch between hero classes (Knight, Mage, Assassin) at any time in settings.'}</li>
              <li>{isVi ? 'Trùng sinh (Prestige) khi đạt cấp độ cao sẽ đặt cấp độ về 1 và nhận Điểm Trùng Sinh để nhân chỉ số vô hạn.' : 'Prestige resets hero level to 1 in exchange for permanent prestige multipliers.'}</li>
            </ul>
          </div>
        );
      case 'bag':
        return (
          <div className="space-y-3 leading-relaxed text-slate-305">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '🎒 HÀNH TRANG & TRANG BỊ:' : '🎒 INVENTORY & GEAR:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Nhân vật có 6 vị trí trang bị gồm: Vũ khí, Giáp, Mũ, Giày, Nhẫn, Găng tay.' : 'Slime has 6 slots: Weapon, Armor, Helmet, Boots, Ring, and Gloves.'}</li>
              <li>{isVi ? 'Trang bị có 5 cấp phẩm chất: Thường (Trắng), Tốt (Xanh lá), Hiếm (Xanh lam), Sử Thi (Tím), Truyền Thuyết (Cam).' : 'Equipment has 5 rarities: Common (White), Uncommon (Green), Rare (Blue), Epic (Purple), Legendary (Orange).'}</li>
              <li>{isVi ? 'Trang bị cấp cao có thể sở hữu tiền tố/hậu tố tăng chỉ số đặc biệt như chí mạng, tốc độ chạy, tăng vàng.' : 'Higher rarity gear rolls special affixes like crit, speed, or gold bonuses.'}</li>
              <li>{isVi ? 'Phân rã (Dismantle) trang bị không dùng để đổi lấy Mảnh Aether sử dụng cho Lò Rèn.' : 'Dismantle unused equipment to get Aether Shards for shard upgrades and gear chests.'}</li>
            </ul>
          </div>
        );
      case 'trait':
        return (
          <div className="space-y-3.5 leading-relaxed text-slate-305">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '🧬 HỆ THỐNG THIÊN PHÚ (TRAITS):' : '🧬 TRAIT & TALENT SYSTEM:'}</h4>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
              <span className="font-bold text-slate-200 block text-[10px]">{isVi ? 'Tỷ Lệ Phẩm Chất:' : 'Grade Roll Rates:'}</span>
              <div className="grid grid-cols-5 text-center text-[10px] font-bold font-mono">
                <span className="text-red-400">SS: 1%</span>
                <span className="text-orange-400">S: 4%</span>
                <span className="text-purple-400">A: 10%</span>
                <span className="text-blue-400">B: 25%</span>
                <span className="text-slate-400">C: 60%</span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
              <span className="font-bold text-slate-200 block text-[10px]">{isVi ? 'Khoảng Chỉ Số Cộng Thêm (Random Range):' : 'Random Stat Value Ranges:'}</span>
              <div className="space-y-0.5 font-mono text-[9.5px]">
                <div className="flex justify-between"><span className="text-red-400 font-extrabold">SS:</span> <span>+250% ~ +400%</span></div>
                <div className="flex justify-between"><span className="text-orange-400 font-extrabold">S:</span> <span>+100% ~ +200%</span></div>
                <div className="flex justify-between"><span className="text-purple-400 font-extrabold">A:</span> <span>+50% ~ +95%</span></div>
                <div className="flex justify-between"><span className="text-blue-400 font-extrabold">B:</span> <span>+20% ~ +45%</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-extrabold">C:</span> <span>+5% ~ +15%</span></div>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
              <span className="font-bold text-slate-200 block text-[10px]">🧬 {isVi ? 'Hiệu Ứng Cộng Hưởng (Synergy):' : 'Resonance & Synergy:'}</span>
              <div className="space-y-1.5 text-[10px] text-slate-400">
                <div>
                  <span className="font-bold text-indigo-400">{isVi ? '• Cộng hưởng Phẩm chất:' : '• Grade Synergy:'}</span>
                  <p>{isVi ? 'Có 3 hoặc 5 ô cùng cấp phẩm chất (SS, S, hoặc A) sẽ kích hoạt cộng hưởng phẩm chất tăng toàn bộ các chỉ số phòng thủ và tấn công (+25% / +75% cho SS, +15% / +45% cho S, +8% / +20% cho A).' : 'Having 3 or 5 slots of the same grade (SS, S, or A) grants a multipliers to all combat stats (+25%/+75% for SS, +15%/+45% for S, +8%/+20% for A).'}</p>
                </div>
                <div>
                  <span className="font-bold text-indigo-400">{isVi ? '• Cộng hưởng Thuộc tính:' : '• Stat Synergy:'}</span>
                  <p>{isVi ? 'Có 3 hoặc 5 ô cùng một loại chỉ số (ATK/HP/Crit/Gold) sẽ kích hoạt hiệu ứng thuộc tính tăng mạnh chỉ số đó (+50% / +150% chỉ số đó).' : 'Having 3 or 5 slots of the same stat type (ATK, HP, Crit, Gold) boosts the efficiency of that specific stat by +50% / +150%.'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'dungeon':
        return (
          <div className="space-y-3 leading-relaxed text-slate-350">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '💀 PHỤ BẢN KHIÊU CHIẾN:' : '💀 DUNGEON CHALLENGES:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Vào phụ bản tiêu tốn Vé Phụ Bản (🎫). Bạn có tối đa 3 vé. Vé tự hồi phục theo thời gian hoặc có thể mua nhanh bằng Vàng.' : 'Entering dungeons costs tickets (🎫). You can hold up to 3 tickets, which regenerate or can be bought using Gold.'}</li>
              <li>{isVi ? 'Mỗi phụ bản cung cấp tài nguyên chuyên biệt: Phó bản Đá ngọc (Gems), Phó bản Vàng (Gold), Phó bản Kim cương (Diamonds), và Phó bản Phôi rèn (Forge Materials).' : 'Each dungeon grants specific materials: Gems, Gold, Diamonds, and Forge materials.'}</li>
              <li>{isVi ? 'Hạ gục Boss phụ bản trong thời gian giới hạn để chiến thắng và mở khóa cấp độ khó cao hơn.' : 'Defeat the dungeon Boss within the time limit to unlock higher difficulty levels.'}</li>
            </ul>
          </div>
        );
      case 'guild':
        return (
          <div className="space-y-3 leading-relaxed text-slate-350">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '🏰 BANG HỘI & BOSS RAID:' : '🏰 GUILD BOSS RAID:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Nơi bạn liên minh với các hiệp sĩ đồng hành AI (Hiệp sĩ, Pháp sư, Sát thủ) để khiếu chiến Rồng Bóng Tối Behemoth.' : 'Team up with three AI companions (Knight, Mage, Assassin) to raid the Shadow Behemoth Dragon.'}</li>
              <li>{isVi ? 'Sát thương bang hội gây ra được lưu trữ lại. Boss có lượng máu rất lớn để thử thách lực chiến tối đa.' : 'Accumulate maximum guild raid damage. The boss has massive HP to test your synergy and power.'}</li>
            </ul>
          </div>
        );
      case 'forge':
        return (
          <div className="space-y-3 leading-relaxed text-slate-350">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '⚒️ LÒ RÈN & NGỌC KHẢM:' : '⚒️ FORGE & GEM SOCKETING:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Sử dụng phôi rèn nhận được từ Phó bản để chế tác và cường hóa chỉ số trang bị.' : 'Use materials from the Gear Dungeon to draft and upgrade equipment levels.'}</li>
              <li>{isVi ? 'Khảm ngọc vào các ô trống của trang bị đã giám định để nhận thêm cực nhiều thuộc tính chiến đấu.' : 'Socket Gemstones into sockets on identified gear for huge combat enhancements.'}</li>
              <li>{isVi ? 'Ghép 3 viên ngọc cùng cấp và loại để nâng lên cấp ngọc cao hơn (ví dụ: 3 viên Lục Bảo Cấp 1 ghép thành 1 viên Lục Bảo Cấp 2).' : 'Merge 3 gems of the same type and tier to upgrade to the next tier (e.g. 3 Emerald T1 -> 1 Emerald T2).'}</li>
            </ul>
          </div>
        );
      case 'guide':
        return (
          <div className="space-y-3 leading-relaxed text-slate-300">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '📖 SỔ TAY & BẢN ĐỒ PHÂN BỐ:' : '📖 BESTIARY & SPAWN MAP:'}</h4>
            <div className="space-y-2 text-slate-400 text-[10.5px]">
              <p>
                {isVi 
                  ? 'Sổ tay lưu trữ toàn bộ thông tin của 43 sinh vật, chỉ số quái vật và các khu vực xuất hiện của chúng.' 
                  : 'Contains the complete database of 43 creatures, combat statistics, weaknesses, and spawn locations.'}
              </p>
              
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                <span className="font-bold text-slate-200 block text-[9.5px] mb-1">
                  ⭐ {isVi ? '8 CẤP ĐỘ SỨC MẠNH (TIERS):' : '8 POWER RANKS (TIERS):'}
                </span>
                <ul className="list-disc pl-3.5 space-y-0.5 text-[9px]">
                  <li><strong className="text-slate-300">Normal</strong> ({isVi ? 'Quái Thường' : 'Common'})</li>
                  <li><strong className="text-indigo-400">Elite</strong> ({isVi ? 'Tinh Anh' : 'Elite'})</li>
                  <li><strong className="text-emerald-400">Champion</strong> ({isVi ? 'Quán Quân' : 'Champion'})</li>
                  <li><strong className="text-amber-400">King</strong> ({isVi ? 'Vua / Hoàng Gia' : 'Royal King'})</li>
                  <li><strong className="text-rose-400">Legend</strong> ({isVi ? 'Truyền Thuyết' : 'Legendary'})</li>
                  <li><strong className="text-fuchsia-400">Mythic</strong> ({isVi ? 'Thần Thoại' : 'Mythical'})</li>
                  <li><strong className="text-cyan-400">Ancient</strong> ({isVi ? 'Cổ Đại' : 'Ancient Construct'})</li>
                  <li><strong className="text-yellow-500">World Boss</strong> ({isVi ? 'Boss Thế Giới' : 'World Colossus'})</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                <span className="font-bold text-slate-200 block text-[9.5px] mb-1">
                  🗺️ {isVi ? 'BẢN ĐỒ PHÂN BỐ XUẤT HIỆN:' : 'SPAWN DISTRIBUTION MAP:'}
                </span>
                <p className="text-[9px] leading-relaxed">
                  {isVi
                    ? 'Xem khu vực xuất hiện của quái vật theo 6 vùng địa hình (Thảo Nguyên, Đền Cổ, Đỉnh Băng, Vực Lửa, Hư Không, Thượng Giới). Nhấp vào quái vật để mở bảng Xem trước (Preview) chi tiết kỹ năng và truyền thuyết.'
                    : 'Track monster spawns across 6 maps (Grassland, Stone Temple, Frost Peaks, Lava Rift, Void, Titan Realm). Click any row/icon for a detailed preview window.'}
                </p>
              </div>
            </div>
          </div>
        );
      case 'summon':
      case 'shop':
        return (
          <div className="space-y-3 leading-relaxed text-slate-350">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '💰 TRIỆU HỒI & CỬA HÀNG:' : '💰 SUMMON & SHOP:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Sử dụng Kim cương để triệu hồi trang bị x1 hoặc x10.' : 'Spend Diamonds to summon random equipment x1 or x10.'}</li>
              <li>{isVi ? 'Triệu hồi nhiều giúp tăng cấp Triệu hồi (Summon Level), từ đó tăng cơ hội nhận được trang bị Sử Thi và Truyền Thuyết.' : 'Accumulate summons to increase your Summon Level and boost Epic/Legendary spawn rates.'}</li>
              <li>{isVi ? 'Tại Cửa Hàng, đổi Mảnh Aether lấy Rương Thần Khí chứa trang bị xịn chưa giám định.' : 'At the store, swap Aether Shards for mysterious unidentified gear chests.'}</li>
            </ul>
          </div>
        );
      case 'quest':
        return (
          <div className="space-y-3 leading-relaxed text-slate-355">
            <h4 className="font-extrabold text-white text-xs">{isVi ? '📜 NHIỆM VỤ TUẦN HOÀN:' : '📜 BOUNTY QUESTS:'}</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
              <li>{isVi ? 'Bao gồm các nhiệm vụ cốt truyện, nhiệm vụ hằng ngày, và nhiệm vụ hằng tuần.' : 'Includes main campaign quests, daily tasks, and weekly bounties.'}</li>
              <li>{isVi ? 'Hoàn thành để nhận lượng lớn Vàng và Kim Cương hữu ích cho việc nâng cấp.' : 'Complete tasks to earn huge Gold and Diamond payouts.'}</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] select-none">
      <div className="bg-slate-900 border-2 border-slate-805 rounded-3xl p-5 w-[92%] max-w-xs shadow-2xl absolute top-1/2 left-1/2 flex flex-col max-h-[85%] overflow-hidden animate-success-pop">
        {/* Close button X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-950 border border-slate-805 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-90 font-bold z-20 shadow-md"
        >
          ✕
        </button>

        {/* Header info icon & Title */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <span className="text-xl">📖</span>
          <h3 className="text-[11px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 font-display">
            {isVi ? 'HƯỚNG DẪN CHI TIẾT' : 'GAMEPLAY GUIDE'}
          </h3>
        </div>

        {/* Glowing line divider */}
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-slate-800 to-transparent shrink-0 mb-4" />

        {/* Guide contents body */}
        <div className="flex-grow overflow-y-auto space-y-4 text-xs pr-1">
          {renderGuideContent()}
        </div>
      </div>
    </div>
  );
};
