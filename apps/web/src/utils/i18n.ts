import { useLanguageStore } from '../stores/languageStore';

const EXTRA_VI: Record<string, string> = {
  slot_gloves: "Găng tay",
  "item_t_wpn_rusty_staff": "Gậy sồi cũ",
  "item_t_wpn_mage_common_2": "Sách phép nát",
  "item_t_wpn_mage_common_3": "Gậy tập luyện",
  "item_t_wpn_mage_uncommon_1": "Susty Phép nát",
  "item_t_wpn_mage_uncommon_2": "Dady Phép nát",
  "item_t_wpn_mage_uncommon_3": "Hiding Phép nát",
  "item_t_wpn_mage_rare_1": "Ciame Phép sư",
  "item_t_wpn_mage_rare_2": "Biornet Phép nát",
  "item_t_wpn_mage_rare_3": "Slime Phép sư",
  "item_t_wpn_mage_epic_1": "Kẻ Diệt Tavuri",
  "item_t_wpn_mage_epic_2": "Kẻ Diệt Blanote",
  "item_t_wpn_mage_epic_3": "Kẻ Diệt Soarmon",
  "item_t_wpn_mage_legendary_1": "Kẻ Diệt Finpus",
  "item_t_wpn_mage_legendary_2": "Kẻ Diệt Gamson",
  "item_t_wpn_mage_legendary_3": "Kẻ Diệt Sao",
  "item_t_hel_cap_mage": "Khăn Choàng Canvas",
  "item_t_hel_mage_common_2": "Khăn Choàng Vastous",
  "item_t_hel_mage_common_3": "Khăn Choàng Dossing",
  "item_t_hel_mage_uncommon_1": "Mũ Cao Cấp Canvy",
  "item_t_hel_mage_uncommon_2": "Khăn Choàng Poatrous",
  "item_t_hel_mage_uncommon_3": "Khăn Choàng Hắc Hoàng Đế",
  "item_t_hel_mage_rare_1": "Mũ Deely",
  "item_t_hel_mage_rare_2": "Mũ Đốt Cháy Độc Nhất",
  "item_t_hel_mage_rare_3": "Mặt Nạ Hắc Diện",
  "item_t_hel_mage_epic_1": "Mặt Nạ Blot Iffuers",
  "item_t_hel_mage_epic_2": "Mặt Nạ Phẫn Nộ",
  "item_t_hel_mage_epic_3": "Mặt Nạ Gương Hắc Hoàng Đế",
  "item_t_hel_mage_legendary_1": "Mặt Nạ Isinokls",
  "item_t_hel_mage_legendary_2": "Mặt Nạ Gương Hắc Hoàng Đế Vua",
  "item_t_hel_mage_legendary_3": "Mặt Nạ Hắc Đế Gương Cổ",
  "item_t_arm_rag_robe": "Áo Choàng Vải Rách",
  "item_t_arm_mage_common_2": "Áo Choàng Vải Rách II",
  "item_t_arm_mage_common_3": "Áo Choàng Vảy Rồng",
  "item_t_arm_mage_uncommon_1": "Áo Choàng Vải Rách III",
  "item_t_arm_mage_uncommon_2": "Áo Choàng Vải Rách IV",
  "item_t_arm_mage_uncommon_3": "Giáp Vảy Rồng",
  "item_t_arm_mage_rare_1": "Giáp Sawidans",
  "item_t_arm_mage_rare_2": "Giáp Suvnitflure",
  "item_t_arm_mage_rare_3": "Hắc Giáp Dragoriosx",
  "item_t_arm_mage_epic_1": "Giáp Vảy Rồng II",
  "item_t_arm_mage_epic_2": "Giáp Vảy Rồng III",
  "item_t_arm_mage_epic_3": "Hắc Giáp Vảy Rồng",
  "item_t_arm_mage_legendary_1": "Giáp Tavone",
  "item_t_arm_mage_legendary_2": "Hắc Giáp Vảy Rồng II",
  "item_t_arm_mage_legendary_3": "Giáp Vảy Rồng Cổ Đại",
  "item_t_bts_worn_mage": "Giày Vải Rách",
  "item_t_bts_mage_common_2": "Giày Vải Rách II",
  "item_t_bts_mage_common_3": "Giày Vải Rách III",
  "item_t_bts_mage_uncommon_1": "Giày Vải Rách IV",
  "item_t_bts_mage_uncommon_2": "Giày Vải Rách V",
  "item_t_bts_mage_uncommon_3": "Giày Vải Rách VI",
  "item_t_bts_mage_rare_1": "Giày Vải Rách VII",
  "item_t_bts_mage_rare_2": "Giày Cõi Chết Detherworld",
  "item_t_bts_mage_rare_3": "Giày Chín Tầng Địa Ngục",
  "item_t_bts_mage_epic_1": "Giày Cõi Chết Nelnean",
  "item_t_bts_mage_epic_2": "Giày Cõi Chết Hithwau",
  "item_t_bts_mage_epic_3": "Giày Chín Tầng Aivay",
  "item_t_bts_mage_legendary_1": "Bước Chân Địa Ngục",
  "item_t_bts_mage_legendary_2": "Chín Bước Chân Địa Ngục",
  "item_t_bts_mage_legendary_3": "Bước Chân Địa Ngục Vũ Trụ",
  "item_t_rng_brass_mage": "Nhẫn Đồng Trơn",
  "item_t_rng_mage_common_2": "Nhẫn Đồng Trơn II",
  "item_t_rng_mage_common_3": "Nhẫn Đồng Trơn III",
  "item_t_rng_mage_uncommon_1": "Nhẫn Đồng Trơn IV",
  "item_t_rng_mage_uncommon_2": "Nhẫn Đồng Trơn V",
  "item_t_rng_mage_uncommon_3": "Nhẫn Đồng Xám",
  "item_t_rng_mage_rare_1": "Nhẫn Đồng Sử Thi",
  "item_t_rng_mage_rare_2": "Nhẫn Đồng Đáng Nguyền",
  "item_t_rng_mage_rare_3": "Nhẫn Đồng Sử Thi II",
  "item_t_rng_mage_epic_1": "Nhẫn Đồng Thế Giới",
  "item_t_rng_mage_epic_2": "Nhẫn Hủy Diệt Thế Giới",
  "item_t_rng_mage_epic_3": "Nhẫn Hủy Diệt Thế Giới II",
  "item_t_rng_mage_legendary_1": "Nhẫn Hủy Diệt Thế Giới",
  "item_t_rng_mage_legendary_2": "Nhẫn Sát Ý Hủy Diệt Thế Giới",
  "item_t_rng_mage_legendary_3": "Nhẫn Hủy Diệt Vũ Trụ",
  "item_t_glo_mage_common_1": "Găng Tay Vải Mỏng",
  "item_t_glo_mage_common_2": "Găng Tay Vải Mỏng II",
  "item_t_glo_mage_common_3": "Găng Tay Vải Máu",
  "item_t_glo_mage_uncommon_1": "Găng Tay Vải Mỏng III",
  "item_t_glo_mage_uncommon_2": "Găng Tay Vải Mỏng IV",
  "item_t_glo_mage_uncommon_3": "Găng Tay Stroalownem",
  "item_t_glo_mage_rare_1": "Găng Tay Vải Epin",
  "item_t_glo_mage_rare_2": "Găng Tay Vải Blsan",
  "item_t_glo_mage_rare_3": "Găng Tay Vải Máu II",
  "item_t_glo_mage_epic_1": "Găng Tay Nước Huyết Thần",
  "item_t_glo_mage_epic_2": "Bàn Tay Tàn Sát Huyết Thần",
  "item_t_glo_mage_epic_3": "Bàn Tay Tàn Sát Huyết Thần II",
  "item_t_glo_mage_legendary_1": "Bàn Tay Tàn Sát Huyết Thần III",
  "item_t_glo_mage_legendary_2": "Bàn Tay Tàn Sát Huyết Thần IV",
  "item_t_glo_mage_legendary_3": "Bàn Tay Tàn Sát Huyết Thần V"
};

const EXTRA_EN: Record<string, string> = {
  slot_gloves: "Gloves",
  "item_t_wpn_rusty": "Rusty Sword",
  "item_t_wpn_knight_common_2": "Lumberjack Axe",
  "item_t_wpn_knight_common_3": "Wooden Hammer",
  "item_t_wpn_steel": "Raw Steel Sword",
  "item_t_wpn_knight_uncommon_2": "Double Battle Axe",
  "item_t_wpn_knight_uncommon_3": "Heavy Iron Hammer",
  "item_t_wpn_knight": "Giant Claymore",
  "item_t_wpn_knight_rare_2": "Armor Piercing Axe",
  "item_t_wpn_knight_rare_3": "Iron Spear of God",
  "item_t_wpn_demonic": "Fire Dragon Sword",
  "item_t_wpn_knight_epic_2": "Sky Cleaving Battle Axe",
  "item_t_wpn_knight_epic_3": "Earthquake Hammer",
  "item_t_wpn_excalibur": "Destiny Divine Sword",
  "item_t_wpn_knight_legendary_2": "Heaven Splitting Divine Dragon Axe",
  "item_t_wpn_knight_legendary_3": "Demon Exterminating World Breaker Hammer",
  "item_t_hel_cap": "Plain Iron Helmet",
  "item_t_hel_knight_common_2": "Raw Leather Warrior Helmet",
  "item_t_hel_knight_common_3": "Iron Grate Helmet",
  "item_t_hel_iron": "Fortress Soldier Helmet",
  "item_t_hel_knight_uncommon_2": "Copper Studded Iron Helmet",
  "item_t_hel_knight_uncommon_3": "Bull Horn Helmet",
  "item_t_hel_great": "Heavy Armor Helmet",
  "item_t_hel_knight_rare_2": "Deep Forest Warrior Horn Helmet",
  "item_t_hel_knight_rare_3": "Sturdy Steel Helmet",
  "item_t_hel_dragon_horn": "Fire Dragon Helmet",
  "item_t_hel_knight_epic_2": "Iron Demon Horn Helmet",
  "item_t_hel_knight_epic_3": "Great War God Helmet",
  "item_t_hel_aegis_visor": "Golden King Helmet",
  "item_t_hel_knight_legendary_2": "Divine Dragon Warrior Helmet",
  "item_t_hel_knight_legendary_3": "Underworld King Immortal Helmet",
  "item_t_arm_rag": "Raw Leather Armor",
  "item_t_arm_knight_common_2": "Iron Chest Plate",
  "item_t_arm_knight_common_3": "Torn Chainmail",
  "item_t_arm_leather": "Soldier Chainmail",
  "item_t_arm_knight_uncommon_2": "Raw Steel Plate Armor",
  "item_t_arm_knight_uncommon_3": "Metal Shoulder Armor",
  "item_t_arm_plate": "Refined Heavy Steel Armor",
  "item_t_arm_knight_rare_2": "Sturdy Plate Armor",
  "item_t_arm_knight_rare_3": "Great Lion Armor",
  "item_t_arm_dragon": "Fire Dragon Scale Armor",
  "item_t_arm_knight_epic_2": "Invincible War God Armor",
  "item_t_arm_knight_epic_3": "Heavy Quartz Armor",
  "item_t_arm_god_plate": "Holy King Armor",
  "item_t_arm_knight_legendary_2": "Immortal Divine Dragon Armor",
  "item_t_arm_knight_legendary_3": "Ancient Xuanwu Armor",
  "item_t_bts_worn": "Heavy Raw Leather Boots",
  "item_t_bts_knight_common_2": "Wooden Sole Fabric Boots",
  "item_t_bts_knight_common_3": "Rusty Iron Boots",
  "item_t_bts_steel_greaves": "Soldier Iron Boots",
  "item_t_bts_knight_uncommon_2": "Cowhide Protective Boots",
  "item_t_bts_knight_uncommon_3": "Light Steel War Boots",
  "item_t_bts_guardian": "Refined Heavy Steel Boots",
  "item_t_bts_knight_rare_2": "Sturdy Bear Leather Boots",
  "item_t_bts_knight_rare_3": "Steel Spiked Boots",
  "item_t_bts_dragonscale": "Fire Dragon Greaves",
  "item_t_bts_knight_epic_2": "Indestructible Diamond Boots",
  "item_t_bts_knight_epic_3": "Great War God Boots",
  "item_t_bts_aegis": "Star King Boots",
  "item_t_bts_knight_legendary_2": "Immortal Divine Dragon Boots",
  "item_t_bts_knight_legendary_3": "Ancient Earth Shaking Boots",
  "item_t_rng_brass": "Wide Iron Ring",
  "item_t_rng_knight_common_2": "Rough Copper Ring",
  "item_t_rng_knight_common_3": "Copper Bracelet",
  "item_t_rng_silver": "Reinforced Steel Ring",
  "item_t_rng_knight_uncommon_2": "Tiger Eye Stone Ring",
  "item_t_rng_knight_uncommon_3": "Silver Warrior Bracelet",
  "item_t_rng_ruby": "Lion King Ring",
  "item_t_rng_knight_rare_2": "Giant Defense Stone Ring",
  "item_t_rng_knight_rare_3": "Earring of War Will",
  "item_t_rng_dragon_crest": "Fire Dragon Eye Ring",
  "item_t_rng_knight_epic_2": "Diamond Body Protection Ring",
  "item_t_rng_knight_epic_3": "Furious War God Ring",
  "item_t_rng_aegis": "Star King Heaven Shaking Ring",
  "item_t_rng_knight_legendary_2": "Immortal Divine Dragon Soul Ring",
  "item_t_rng_knight_legendary_3": "Ancient Wild Ring",
  "item_t_glo_knight_common_1": "Thick Leather Gloves",
  "item_t_glo_knight_common_2": "Rough Fabric Warrior Bracers",
  "item_t_glo_knight_common_3": "Chipped Iron Gloves",
  "item_t_glo_knight_uncommon_1": "Steel Soldier Gloves",
  "item_t_glo_knight_uncommon_2": "Rough Bear Leather Gloves",
  "item_t_glo_knight_uncommon_3": "Wrist Guard Gloves",
  "item_t_glo_knight_rare_1": "Refined Steel Gloves",
  "item_t_glo_knight_rare_2": "Lion Tempest Gloves",
  "item_t_glo_knight_rare_3": "Heavy Armor Piercing Gloves",
  "item_t_glo_knight_epic_1": "Fire Dragon Claw Gloves",
  "item_t_glo_knight_epic_2": "Indestructible Diamond Gloves",
  "item_t_glo_knight_epic_3": "War God Strength Gloves",
  "item_t_glo_knight_legendary_1": "Star King Overlord Gauntlet",
  "item_t_glo_knight_legendary_2": "Immortal Divine Dragon Claw Gauntlet",
  "item_t_glo_knight_legendary_3": "Ancient Heaven Opening Fist",
  "item_t_wpn_rusty_dagger": "Rusty Dagger",
  "item_t_wpn_assassin_common_2": "Short Wooden Sword",
  "item_t_wpn_assassin_common_3": "Iron Shuriken",
  "item_t_wpn_steel_daggers": "Sharp Double Blade",
  "item_t_wpn_assassin_uncommon_2": "Bronze Dagger",
  "item_t_wpn_assassin_uncommon_3": "Serrated Sword",
  "item_t_wpn_poison_dagger": "Poison Needle",
  "item_t_wpn_assassin_rare_2": "Night Hunter Short Sword",
  "item_t_wpn_assassin_rare_3": "Assassination Spiked Mace",
  "item_t_wpn_death_claws": "Blood Moon Blade",
  "item_t_wpn_assassin_epic_2": "Shadow Claw",
  "item_t_wpn_assassin_epic_3": "Soul Reaper Scythe",
  "item_t_wpn_asura_blades": "Wind Demon Claw",
  "item_t_wpn_assassin_legendary_2": "Calamity Sword",
  "item_t_wpn_assassin_legendary_3": "Star Slayer",
  "item_t_hel_cap_assassin": "Burlap Scarf",
  "item_t_hel_assassin_common_2": "Worn Leather Cap",
  "item_t_hel_assassin_common_3": "Rough Fabric Mask",
  "item_t_hel_leather_mask": "Dark Night Scarf",
  "item_t_hel_assassin_uncommon_2": "Wolf Leather Cap",
  "item_t_hel_assassin_uncommon_3": "Half Iron Mask",
  "item_t_hel_shadow_hood": "Deep Forest Hood",
  "item_t_hel_assassin_rare_2": "Night Hunter Mask",
  "item_t_hel_assassin_rare_3": "Bloodline Headband",
  "item_t_hel_death_cowl": "Invisible Hood",
  "item_t_hel_assassin_epic_2": "Night Demon Mask",
  "item_t_hel_assassin_epic_3": "Dark Night Crown",
  "item_t_hel_asura_hood": "Divine Eye Mirror",
  "item_t_hel_assassin_legendary_2": "Void Hand Mask",
  "item_t_hel_assassin_legendary_3": "Dark Emperor Mirror Mask",
  "item_t_arm_rag_cloak": "Torn Cloak",
  "item_t_arm_assassin_common_2": "Rough Leather Armor",
  "item_t_arm_assassin_common_3": "Hunter Short Coat",
  "item_t_arm_leather_cloak": "Night Walker Cloak",
  "item_t_arm_assassin_uncommon_2": "Tropical Forest Leather Armor",
  "item_t_arm_assassin_uncommon_3": "Steel Thread Armor",
  "item_t_arm_shadow_vest": "Frost Leopard Leather Armor",
  "item_t_arm_assassin_rare_2": "Invisibility Cloak",
  "item_t_arm_assassin_rare_3": "Silver Inlaid Light Armor",
  "item_t_arm_nether_cloak": "Blood Shadow Cloak",
  "item_t_arm_assassin_epic_2": "Night Serpent Armor",
  "item_t_arm_assassin_epic_3": "Shadow Demon Cloak",
  "item_t_arm_phantom_garb": "Thousand Year Night Cloak",
  "item_t_arm_assassin_legendary_2": "Ghost God Armor",
  "item_t_arm_assassin_legendary_3": "Black Dragon Scale Armor",
  "item_t_bts_worn_assassin": "Torn Fabric Shoes",
  "item_t_bts_assassin_common_2": "Fabric Leg Wraps",
  "item_t_bts_assassin_common_3": "Rough Leather Boots",
  "item_t_bts_leather": "Hunter Leather Boots",
  "item_t_bts_assassin_uncommon_2": "Durable Hemp Shoes",
  "item_t_bts_assassin_uncommon_3": "Light Night Walker Shoes",
  "item_t_bts_stealth_treads": "Light Hundred-Step Shoes",
  "item_t_bts_assassin_rare_2": "Clouded Leopard Speed Boots",
  "item_t_bts_assassin_rare_3": "Assassination Spiked Shoes",
  "item_t_bts_shadow_boots": "Wind Shadow Boots",
  "item_t_bts_assassin_epic_2": "Blood Shadow Footstep Boots",
  "item_t_bts_assassin_epic_3": "Mysterious Night Boots",
  "item_t_bts_asura": "Starry Sky Speed Footsteps",
  "item_t_bts_assassin_legendary_2": "Void Swift Wind Boots",
  "item_t_bts_assassin_legendary_3": "Nine Hells Steps",
  "item_t_rng_brass_assassin": "Plain Copper Ring",
  "item_t_rng_assassin_common_2": "Rough Stone Ring",
  "item_t_rng_assassin_common_3": "Chipped Iron Ring",
  "item_t_rng_silver_assassin": "Engraved Emblem Ring",
  "item_t_rng_assassin_uncommon_2": "Agate Ring",
  "item_t_rng_assassin_uncommon_3": "Silver Inlaid Iron Ring",
  "item_t_rng_ruby_assassin": "Poison Serpent Jade Ring",
  "item_t_rng_assassin_rare_2": "Real Bloodstone Ring",
  "item_t_rng_assassin_rare_3": "Light Speed Ring",
  "item_t_rng_death_band": "Demon Eye Locator Ring",
  "item_t_rng_assassin_epic_2": "Dark Shadow Demon Strength Ring",
  "item_t_rng_assassin_epic_3": "Blood Moon Essence Ring",
  "item_t_rng_asura": "Divine Blessing Ring",
  "item_t_rng_assassin_legendary_2": "Supreme Void Realm",
  "item_t_rng_assassin_legendary_3": "World Destroying Killing Intent Ring",
  "item_t_glo_assassin_common_1": "Thin Fabric Gloves",
  "item_t_glo_assassin_common_2": "Rough Leather Gloves",
  "item_t_glo_assassin_common_3": "Hemp Hand Wraps",
  "item_t_glo_assassin_uncommon_1": "Hunter Gloves",
  "item_t_glo_assassin_uncommon_2": "Copper Inlaid Leather Gloves",
  "item_t_glo_assassin_uncommon_3": "Night Walker Gloves",
  "item_t_glo_assassin_rare_1": "Poison Claw Gloves",
  "item_t_glo_assassin_rare_2": "Silver Inlaid Light Gloves",
  "item_t_glo_assassin_rare_3": "Speed Booster Gloves",
  "item_t_glo_assassin_epic_1": "Demon Claw Gloves",
  "item_t_glo_assassin_epic_2": "Deadly Night Gloves",
  "item_t_glo_assassin_epic_3": "Shadow Gloves",
  "item_t_glo_assassin_legendary_1": "Divine Claw Hand of God",
  "item_t_glo_assassin_legendary_2": "Void Destruction Hand",
  "item_t_glo_assassin_legendary_3": "Blood God Massacre Hand",
};

export const translations = {
  vi: {
    // Auth Screen
    auth_title: "LUMORIA ONLINE",
    auth_subtitle: "GAME IDLE RPG ĐA THIẾT BỊ",
    email_label: "Email",
    password_label: "Mật Khẩu",
    login_btn: "Bắt Đầu Cuộc Hành Trình",
    register_btn: "Tạo Anh Hùng Mới",
    auth_mode_toggle_register: "Chưa có tài khoản? Tạo Anh Hùng",
    auth_mode_toggle_login: "Đã có tài khoản? Đăng nhập",
    auth_success_register: "Tạo tài khoản thành công!",
    auth_success_login: "Đăng nhập thành công!",
    auth_error_pass_length: "Mật khẩu phải từ 6 ký tự trở lên.",

    // Header
    hero_level: "Cấp Anh Hùng",
    battle_stage: "Ải Chiến Đấu",
    stage: "Ải",
    prestige_points: "Điểm Trùng Sinh",
    exit_btn: "Thoát Game",
    clear_stage_first: "Hãy vượt ải hiện tại trước",
    select_class_label: "Chọn Lớp Nhân Vật",
    class_knight: "Chiến Binh",
    class_mage: "Pháp Sư",
    class_assassin: "Sát Thủ",
    class_desc_knight: "🛡️ Chiến Binh: HP & Phòng thủ cực cao. Kỹ năng nộ: [THẦN KIẾM TRẢM] chém lan tất cả Slime.",
    class_desc_mage: "🔮 Pháp Sư: Sát thương phép thuật dồi dào. Kỹ năng nộ: [BÃO THIÊN THẠCH] dội bom lửa lan toàn bộ quái.",
    class_desc_assassin: "🗡️ Sát Thủ: Tốc độ đánh & Chí mạng siêu cao. Kỹ năng nộ: [VÔ ẢNH BỘ] dồn sát thương đơn cực đại.",

    // Combat logs
    combat_feed: "Tin Chiến Sự",
    feed_silent: "Chiến trường đang im tiếng...",
    log_filter_all: "Tất cả",
    log_filter_combat: "Chiến đấu",
    log_filter_loot: "Rơi đồ",

    // Tabs
    tab_hero: "👤 Nhân vật",
    tab_bag: "🎒 Kho đồ",
    tab_quest: "📜 Nhiệm vụ",
    tab_guild: "🏰 Bang hội",
    tab_shop: "💰 Cửa hàng",
    tab_summon: "🎁 Triệu hồi",
    tab_guide: "📖 Sổ tay",
    tab_dungeon: "🏰 Phó Bản",
    tab_forge: "⚒️ Lò Rèn",
    hud_control_deck: "BẢNG ĐIỀU KHIỂN",

    // Hero Tab
    core_attributes: "Thuộc Tính Cơ Bản",
    max_health: "💖 HP Tối Đa",
    attack_power: "⚔️ Công Vật Lý",
    magic_attack: "🔮 Công Phép Thuật",
    defense_rating: "🛡️ Giáp Vật Lý",
    magic_resist: "🔮 Kháng Phép",
    attack_speed: "⚡ Tốc Độ Đánh",
    critical_rate: "🎯 Tỷ Lệ Chí Mạng",
    critical_damage: "💥 Sát Thương Chí Mạng",
    lifesteal: "🩸 Hút Máu Vật Lý",
    spell_vamp: "🔮 Hút Máu Phép",
    evasion: "💨 Tỷ Lệ Né Tránh",
    block: "🛡️ Tỷ Lệ Đỡ Đòn",
    stat_base: "Gốc",
    stat_cap: "Giới hạn",
    hero_tip: "💡 Trang bị, điểm trùng sinh, và cấp độ được tự động tính toán. Hãy nâng cấp trang bị hoặc triệu hồi vũ khí hiếm để gia tăng sức mạnh!",
    ascension_prestige: "Thức Tỉnh & Trùng Sinh",
    prestige_desc: "Thực hiện Thức Tỉnh sẽ đặt lại cấp độ của nhân vật, vàng, và tiến trình ải chiến đấu về ải 1. Đổi lại, bạn sẽ giữ nguyên tất cả trang bị trong hành lý và nhận Điểm Trùng Sinh để gia tăng sức mạnh vĩnh viễn theo cấp số nhân.",
    total_prestige_runs: "Số Lần Trùng Sinh",
    active_prestige_points: "Điểm Trùng Sinh Tích Lũy",
    active_buffs: "Bùa Lợi Kích Hoạt",
    damage_modifier: "⚔️ Tăng Sát Thương",
    hp_modifier: "💖 Tăng HP",
    defense_modifier: "🛡️ Tăng Phòng Thủ",
    ascend_now: "Thức Tỉnh Ngay",
    ascension_locked: "Thức Tỉnh Đang Khóa",
    ascension_locked_desc: "Bạn cần vượt qua ải 10 để mở khóa tính năng Thức Tỉnh. (Hiện tại: Ải {stage})",

    // Bag Tab
    inventory_capacity: "Ô chứa",
    equipped_label: "Đã trang bị",
    unequipped_label: "Chưa trang bị",
    equip_btn: "Trang bị",
    unequip_btn: "Tháo trang bị",
    sell_btn: "Bán",
    upgrade_btn: "Nâng cấp",
    upgrade_cost_label: "Phí nâng cấp",
    insufficient_gold: "Không đủ vàng",
    rarity_common: "Thường",
    rarity_uncommon: "Đặc biệt",
    rarity_rare: "Hiếm",
    rarity_epic: "Sử thi",
    rarity_legendary: "Huyền thoại",
    slot_weapon: "Vũ khí",
    slot_armor: "Giáp",
    slot_helmet: "Mũ",
    slot_boots: "Giày",
    slot_ring: "Nhẫn",
    slot_gloves: "Găng tay",
    no_items: "Không có vật phẩm nào.",
    bag_tip: "⚔️ Nhấp vào bất kỳ vật phẩm nào trong hành lý để kiểm tra, trang bị, bán hoặc nâng cấp.",
    bag_inspect_tip: "Nhấn vào bất kỳ vật phẩm nào để kiểm tra chi tiết và nâng cấp.",
    item_desc_legendary: "Thần khí huyền thoại được rèn trong lửa rồng, mang sức mạnh tối thượng.",
    item_desc_standard: "Trang bị {slot} tiêu chuẩn phù hợp cho cuộc hành trình chiến đấu.",
    slot_empty: "trống",
    sell_warn: "Hãy tháo trang bị trước khi bán",
    class_restriction_error: "Trang bị này chỉ dành cho lớp nhân vật {class}!",

    // Item Translations
    item_t_wpn_rusty: "Kiếm Rỉ Sét",
    item_t_wpn_rusty_staff: "Gậy Gỗ Rỉ Sét",
    item_t_wpn_rusty_dagger: "Dao Găm Rỉ Sét",
    item_t_wpn_steel: "Kiếm Thép",
    item_t_wpn_apprentice_staff: "Gậy Tập Sự",
    item_t_wpn_steel_daggers: "Song Dao Thép",
    item_t_wpn_knight: "Đại Kiếm Hiệp Sĩ",
    item_t_wpn_wizard_rod: "Sinh Mệnh Quyền Trượng",
    item_t_wpn_poison_dagger: "Độc Huyết Dao Găm",
    item_t_wpn_demonic: "Quỷ Kiếm Reaver",
    item_t_wpn_archmage_wand: "Đại Pháp Sư Trượng",
    item_t_wpn_death_claws: "Móng Vuốt Tử Thần",
    item_t_wpn_excalibur: "Thần Kiếm Excalibur",
    item_t_wpn_cosmos_staff: "Quyền Trượng Vô Cực",
    item_t_wpn_asura_blades: "Song Đao Asura",

    item_t_arm_rag: "Giáp Rách",
    item_t_arm_rag_robe: "Áo Vải Rách",
    item_t_arm_rag_cloak: "Áo Choàng Rách",
    item_t_arm_leather: "Giáp Da Gia Cố",
    item_t_arm_leather_robe: "Áo Choàng Tập Sự",
    item_t_arm_leather_cloak: "Áo Choàng Thợ Săn",
    item_t_arm_plate: "Giáp Ngực Sắt Tấm",
    item_t_arm_silk_robe: "Pháp Y Lụa Huyền Bí",
    item_t_arm_shadow_vest: "Giáp Da Sát Thủ",
    item_t_arm_dragon: "Giáp Vảy Rồng",
    item_t_arm_phoenix_robe: "Phượng Hoàng Lửa Bào",
    item_t_arm_nether_cloak: "Áo Choàng Hư Không",
    item_t_arm_god_plate: "Chiến Giáp Thiên Thần",
    item_t_arm_celestial_robe: "Cổ Y Đại Pháp Sư",
    item_t_arm_phantom_garb: "Huyễn Ảnh Sát Y",

    item_t_hel_cap: "Mũ Sắt Rỉ Sét",
    item_t_hel_cap_mage: "Mũ Vải Pháp Sư",
    item_t_hel_cap_assassin: "Mũ Trùm Rách",
    item_t_hel_iron: "Mũ Sắt Barbute",
    item_t_hel_apprentice_hood: "Mũ Trùm Pháp Sư",
    item_t_hel_leather_mask: "Mặt Nạ Da",
    item_t_hel_great: "Mũ Đại Hiệp Sĩ",
    item_t_hel_wizard_hat: "Mũ Phù Thủy",
    item_t_hel_shadow_hood: "Mặt Nạ Sát Thủ",
    item_t_hel_dragon_horn: "Mũ Sừng Rồng",
    item_t_hel_archmage_crown: "Vương Miện Đại Pháp Sư",
    item_t_hel_death_cowl: "Mũ Trùm Tử Thần",
    item_t_hel_aegis_visor: "Mũ Sắt Hộ Vệ Aegis",
    item_t_hel_cosmos_crown: "Vương Miện Thiên Hà",
    item_t_hel_asura_hood: "Mũ Trùm Asura",

    item_t_bts_worn: "Giày Sắt Nặng",
    item_t_bts_worn_mage: "Giày Vải Rách",
    item_t_bts_worn_assassin: "Băng Quấn Chân",
    item_t_bts_steel_greaves: "Xà Cạp Thép",
    item_t_bts_mage_sandals: "Dép Pháp Sư",
    item_t_bts_leather: "Giày Da Nhanh Nhẹn",
    item_t_bts_guardian: "Giày Hộ Vệ Thép",
    item_t_bts_sorcerer_boots: "Giày Pháp Sư",
    item_t_bts_stealth_treads: "Giày Sát Thủ",
    item_t_bts_dragonscale: "Xà Cạp Vảy Rồng",
    item_t_bts_archmage_slippers: "Hài Đại Pháp Sư",
    item_t_bts_shadow_boots: "Giày Huyễn Ảnh",
    item_t_bts_aegis: "Giày Chiến Thần Aegis",
    item_t_bts_cosmos: "Giày Vạn Trụ",
    item_t_bts_asura: "Chiến Hài Asura",

    item_t_rng_brass: "Nhẫn Đồng Thau",
    item_t_rng_brass_mage: "Nhẫn Thạch Anh",
    item_t_rng_brass_assassin: "Nhẫn Đồng",
    item_t_rng_silver: "Nhẫn Bạc",
    item_t_rng_silver_mage: "Nhẫn Opal",
    item_t_rng_silver_assassin: "Nhẫn Hắc Tinh",
    item_t_rng_ruby: "Nhẫn Hồng Ngọc",
    item_t_rng_ruby_mage: "Nhẫn Lam Bảo",
    item_t_rng_ruby_assassin: "Nhẫn Lục Bảo",
    item_t_rng_dragon_crest: "Nhẫn Gia Huy Rồng",
    item_t_rng_archmage_signet: "Ấn Ký Pháp Sư",
    item_t_rng_death_band: "Nhẫn Ấn Tử Thần",
    item_t_rng_aegis: "Nhẫn Hộ Vệ Aegis",
    item_t_rng_cosmos: "Nhẫn Tinh Tú",
    item_t_rng_asura: "Nhẫn Quyền Lực Asura",

    // Quest Tab
    active_bounties: "📜 Nhiệm vụ",
    progress_label: "Tiến trình",
    claim_btn: "Nhận Thưởng",
    no_quests: "Không có nhiệm vụ hoạt động nào.",
    quest_claimed: "Đã nhận",
    quest_reward: "Phần thưởng",
    quest_target_defeat: "Tiêu diệt quái vật",
    quest_target_gold: "Tích lũy vàng",
    quest_target_level: "Đạt cấp anh hùng",
    quest_target_upgrade: "Nâng cấp trang bị",
    quest_in_progress: "Đang làm",
    quest_ready: "Hoàn thành",

    // Guild Tab
    guild_realm: "🏰 Thành Trì Bang Hội",
    guild_desc: "Tạo hoặc gia nhập Bang hội để tham gia các cuộc đột kích săn Boss và tăng cường chỉ số của bạn.",
    guild_members: "Thành viên",
    guild_level: "Cấp Bang hội",
    guild_exp: "Kinh nghiệm Bang",
    guild_create_btn: "Thành Lập Bang Hội",
    guild_join_btn: "Gia Nhập Bang",
    guild_name_placeholder: "Nhập tên bang hội...",
    guild_features_locked: "Tính năng Bang hội đang phát triển. Hãy đón chờ ở các bản cập nhật tiếp theo!",
    guild_rank: "Hạng Bang hội",
    guild_leader: "Chủ bang",
    guild_contrib: "Cống hiến của bạn",
    guild_announcement: "📢 Thông báo: Boss Bang hội Behemoth sẽ mở vào tối nay! Hãy điểm danh và đóng góp để nhận vé tham gia.",
    guild_checkin: "Điểm Danh Bang Hội",
    guild_gold_donate: "Quyên góp Vàng",
    guild_diamond_donate: "Quyên góp Kim Cương",
    guild_yield_xp: "Nhận {xp} EXP Bang",
    guild_donated_today: "Đã quyên góp hôm nay",
    guild_donation_limit: "Mỗi ngày chỉ được quyên góp một lần.",
    guild_raid_boss: "Boss Bang Hội",
    guild_upcoming: "Sắp diễn ra",
    guild_raid_locked: "🔒 Phó bản đang khóa",
    hours: "Giờ",
    mins: "Phút",
    secs: "Giây",

    // Shop Tab
    gold_market: "💰 Chợ Vàng Phương Đông",
    shop_desc: "Sử dụng Kim cương thu được từ chiến đấu để mua Vàng hoặc các vật phẩm đặc biệt khác.",
    gold_pack_title: "Túi Vàng Tài Lộc",
    gold_pack_desc: "Nhận ngay {gold} Vàng (Tỉ lệ tăng theo ải hiện tại của bạn)",
    buy_btn: "Mua",
    insufficient_diamonds: "Không đủ kim cương",
    shop_success_buy: "Mua thành công!",
    shop_gold_desc_scales: "Vàng rơi và giá trị gói vàng sẽ tăng lên khi bạn vượt qua các ải cao hơn.",
    shop_boosters: "⚡ Bùa Lợi Chiến Đấu",
    shop_boosters_desc: "Sử dụng Kim cương để kích hoạt các bùa lợi phép thuật giúp tăng hiệu suất chiến đấu.",
    shop_speed_elixir: "Thuốc Tốc Độ",
    shop_speed_elixir_desc: "+50% tốc độ đánh trong 5 phút",
    shop_exp_charm: "Bùa EXP",
    shop_exp_charm_desc: "+100% kinh nghiệm quái vật trong 5 phút",
    shop_buff_simulated: "Thời gian bùa lợi là giả lập. Nhiều bùa lợi có thể cộng dồn.",
    shop_liquidation: "🧹 Dịch Vụ Thanh Lý",
    shop_liquidation_desc: "Kho đồ sắp đầy? Bán ngay lập tức toàn bộ trang bị Thường (Xám) chưa sử dụng để nhận vàng.",
    shop_common_count: "Số lượng trang bị Thường:",
    shop_sell_all_commons: "Dọn Dẹp Đồ Thường",
    shop_liquidation_note: "Trang bị đang mặc sẽ không bao giờ bị bán. Trang bị Đặc biệt trở lên phải bán thủ công.",
    log_shop_no_commons: "Không có trang bị Thường chưa sử dụng để bán.",
    log_shop_bulk_sold: "Bán hàng loạt: Đã dọn dẹp {count} trang bị Thường, nhận {gold} Vàng 💰!",
    log_shop_speed_elixir: "Đã mua Thuốc Tốc Độ! Anh Hùng di chuyển nhanh gấp đôi (hiệu ứng thử nghiệm).",
    log_shop_exp_charm: "Đã mua Bùa EXP! Nhân đôi kinh nghiệm nhận từ quái vật (hiệu ứng thử nghiệm).",

    // Summon Tab
    sacred_summon: "🎁 Triệu Hồi Thần Khí",
    summon_desc: "Mở khóa trang bị vũ khí, giáp, nhẫn hoặc giày huyền thoại cao cấp. Phẩm chất từ Thường đến Huyền thoại!",
    summon_btn: "Triệu Hồi Thần Khí (10 💎)",
    summon_rate_info: "Tỉ lệ triệu hồi: Thường (45%) | Đặc Biệt (30%) | Hiếm (18%) | Sử Thi (6%) | Huyền Thoại (1.2%)",
    summon_inventory_warning: "Hành lý đầy! Hãy dọn dẹp trước khi triệu hồi.",
    summon_chest_title: "Rương Thần Khí Aether",
    summon_x1: "Triệu Hồi x1",
    summon_x10: "Triệu Hồi x10",
    summon_results: "Kết Quả Triệu Hồi",
    summon_no_draws: "Chưa có lượt triệu hồi",
    summon_no_draws_desc: "Các vật phẩm nhận được sau khi triệu hồi rương Aether sẽ hiển thị ở đây.",
    summon_drop_rates: "Tỉ lệ rơi phẩm chất:",
    log_summon_ten: "TRIỆU HỒI 10x: {legendary} Huyền Thoại ⭐, {epic} Sử Thi 💜, {rare} Hiếm 💙, {uncommon} Đặc Biệt 💚, {common} Thường 🪨",
    summon_inventory_10x: "Hành lý không đủ chỗ trống! Bạn cần ít nhất 10 ô trống (Hiện tại: {space} ô trống).",

    // System Messages & Game Logs
    log_welcome: "Chào mừng trở lại, {email}! Dữ liệu game đã được tải.",
    log_engine_ready: "Hệ thống trò chơi đã sẵn sàng. Tự động chiến đấu đang kích hoạt.",
    log_wild_monster: "Ải {stage}: {monster} xuất hiện!",
    log_hero_strike: "{attacker} chém {monster} gây {damage} sát thương{crit}!",
    log_hero_ult_knight: "🌟 [{attacker}] bộc phá nộ khí tung [THẦN KIẾM TRẢM] chém lan {target} gây {damage} sát thương!",
    log_hero_ult_mage: "🔮 [{attacker}] hô vang thần chú gọi [BÃO THIÊN THẠCH] thiêu rụi {target} gánh {damage} sát thương!",
    log_hero_ult_assassin: "🗡️ [{attacker}] lướt đi kích hoạt [VÔ ẢNH BỘ] ám sát {target} chí mạng cực đại {damage} sát thương!",
    log_boss_sweep: "🐉 {boss} quét đuôi quật ngã {target} mất {damage} HP!",
    log_boss_apocalypse: "💥 {boss} bộc phá [THIÊN TAI HỦY DIỆT] càn quét toàn đội gánh {damage} sát thương!",
    log_slime_ult_fire: "🔥 {monster} phun trào [HỎA CẦU PHÚN TRÀO] đốt cháy Anh Hùng mất {damage} HP!",
    log_slime_ult_ice: "❄️ {monster} thi triển [BĂNG PHONG THUẬT] đóng băng Anh Hùng mất {damage} HP!",
    log_slime_ult_stone: "🛡️ {monster} kích hoạt [GIÁP CƯƠNG THẠCH] húc Anh Hùng mất {damage} HP!",
    log_slime_ult_king: "👑 VUA SLIME giáng đòn [THẬP VẠN THIÊN QUÂN] đập bẹp Anh Hùng mất {damage} HP!",
    log_slime_ult_common: "🟢 {monster} phóng [BONG BÓNG THẠCH] đập vào Anh Hùng gây {damage} sát thương!",
    log_monster_strike: "{monster} đánh Anh Hùng mất {damage} HP.",
    log_defeated_monster: "Đã tiêu diệt {monster}! Nhận {gold} Vàng, {exp} EXP.",
    log_loot_found: "TÌM THẤY VẬT PHẨM: [{name}] ({rarity})!",
    log_hero_defeated: "Anh Hùng đã gục ngã! Đang hồi phục HP...",
    log_prestige_complete: "TRÙNG SINH THÀNH CÔNG! Trở về cấp 1, nhận thêm +{points} Điểm Trùng Sinh.",
    log_class_changed: "🔄 Lớp nhân vật đã chuyển đổi thành {class}!",
    log_inventory_full: "Kho đồ đầy! Đánh rơi: [{name}]",
    log_level_up: "CẤP ĐỘ MỚI! Anh Hùng đã đạt Cấp {level}!",
    log_upgraded_item: "Cường hóa thành công [{name}] lên +{level}!",
    log_equipped_item: "Đã trang bị [{name}]",
    log_unequipped_item: "Đã tháo [{name}]",
    log_sold_item: "Đã bán [{name}] nhận {gold} Vàng",
    log_sold_multiple: "Thanh lý hàng loạt: Đã bán {count} trang bị, nhận được {gold} Vàng",
    log_guild_gold_donate: "Đóng góp Bang hội: Đã quyên góp 500 Vàng! Nhận +25 EXP Bang.",
    log_guild_diamond_donate: "Đóng góp Bang hội: Đã quyên góp 25 Kim Cương! Nhận +100 EXP Bang.",
    log_claimed_quest: "Nhận thưởng nhiệm vụ [{title}]: Nhận {gold} Vàng, {diamonds} Kim Cương.",
    log_bought_gold: "Mua Túi Vàng: Tiêu {cost} Kim Cương, nhận {gold} Vàng.",
    log_summon_success: "TRIỆU HỒI THÀNH CÔNG! Nhận được [{name}] ({rarity})!",
    log_item_evolved: "✨ TIẾN HÓA TRANG BỊ: [{name}] đã đạt mốc và tiến hóa thành {stage}!",
    log_identified: "🔍 GIÁM ĐỊNH THÀNH CÔNG: Mở khóa các chỉ số ẩn của [{name}]!",
    log_gem_inserted: "💎 KHẢM NGỌC THÀNH CÔNG: Đã khảm ngọc {gem} vào trang bị!",
    corrupted_upgrade_error: "👿 BỊ CHẶN: Trang bị Hư Hỏng [{name}] không thể nâng cấp!",
    unidentified_name: "Vật Phẩm Chưa Giám Định",



    // Quest Templates Translations
    quest_q1_title: "Chiến Công Đầu",
    quest_q1_desc: "Tiêu diệt 5 quái vật để chứng minh kỹ năng chiến đấu.",
    quest_q2_title: "Tích Lũy Tài Sản",
    quest_q2_desc: "Tích lũy tổng cộng 1.000 Vàng.",
    quest_q3_title: "Sẵn Sàng Chiến Đấu",
    quest_q3_desc: "Nâng cấp một trang bị bất kỳ lên Cấp 2.",

    // Monster Prefixes
    monster_pref_Stone: "Đá",
    monster_pref_Iron: "Sắt",
    monster_pref_Shadow: "Bóng Tối",
    monster_pref_Flame: "Lửa",
    monster_pref_Frost: "Băng",
    monster_pref_Void: "Hư Không",
    monster_pref_Chaos: "Hỗn Loạn",
    monster_pref_Abyssal: "Vực Thẳm",
    monster_pref_Undead: "Bất Tử",
    monster_pref_Spectral: "Linh Hồn",

    // Monster Bases
    monster_base_Slime: "Slime",
    monster_base_Goblin: "Goblin",
    monster_base_Skeleton: "Bộ Xương",
    monster_base_Orc: "Orc",
    monster_base_Golem: "Golem",
    monster_base_Wraith: "Bóng Ma",
    monster_base_Demon: "Ác Quỷ",
    monster_base_Drake: "Rồng Nhỏ",
    monster_base_Dragon: "Rồng",
    monster_base_Titan: "Khổng Lồ",

    // Hero Revival
    revive_title: "ANH HÙNG GỤC NGÃ",
    revive_subtitle: "Sinh lực đã cạn, vui lòng chọn phương án hồi sinh:",
    revive_gold: "Hồi sinh bằng Vàng",
    revive_diamonds: "Hồi sinh bằng Kim Cương",
    revive_time: "Hồi sinh miễn phí",
    revive_countdown: "Tự động hồi sinh miễn phí sau {seconds} giây",
    keep_stage_note: "(Giữ nguyên Ải hiện tại)",
    drop_stage_note: "(Giảm đi 1 Ải phạt)",
    log_hero_revived: "Anh Hùng đã hồi sinh và sẵn sàng chiến đấu!",
    ...EXTRA_VI
  },
  en: {
    // Auth Screen
    auth_title: "LUMORIA ONLINE",
    auth_subtitle: "CROSS-PLATFORM IDLE RPG GAME",
    email_label: "Email Address",
    password_label: "Password",
    login_btn: "Begin Journey",
    register_btn: "Create New Hero",
    auth_mode_toggle_register: "Need an account? Register Hero",
    auth_mode_toggle_login: "Have an account? Sign In",
    auth_success_register: "Account created successfully!",
    auth_success_login: "Login successful!",
    auth_error_pass_length: "Password must be at least 6 characters.",

    // Header
    hero_level: "Hero Level",
    battle_stage: "Battle Stage",
    stage: "Stage",
    prestige_points: "Prestige Points",
    exit_btn: "Sign Out",
    clear_stage_first: "Clear current stage first",
    select_class_label: "Choose Hero Class",
    class_knight: "Knight",
    class_mage: "Mage",
    class_assassin: "Assassin",
    class_desc_knight: "🛡️ Knight: Huge HP & Defense. Ultimate Skill: [AETHER STRIKE] strikes all slimes simultaneously.",
    class_desc_mage: "🔮 Mage: Extreme Magic Damage. Ultimate Skill: [METEOR STORM] rains fire over all enemies.",
    class_desc_assassin: "🗡️ Assassin: Ultra Attack Speed & Critical. Ultimate Skill: [SHADOW STRIKE] executes 5x single target blow.",

    // Combat logs
    combat_feed: "Combat Feed",
    feed_silent: "Feed is silent...",
    log_filter_all: "All",
    log_filter_combat: "Combat",
    log_filter_loot: "Loot",

    // Tabs
    tab_hero: "👤 Character",
    tab_bag: "🎒 Bag",
    tab_quest: "📜 Quest",
    tab_guild: "🏰 Guild",
    tab_shop: "💰 Shop",
    tab_summon: "🎁 Summon",
    tab_guide: "📖 Bestiary",
    tab_dungeon: "🏰 Dungeon",
    tab_forge: "⚒️ Forge",
    hud_control_deck: "HUD Control Deck",

    // Hero Tab
    core_attributes: "Core Attributes",
    max_health: "💖 Max Health",
    attack_power: "⚔️ Physical Attack",
    magic_attack: "🔮 Magic Attack",
    defense_rating: "🛡️ Physical Defense",
    magic_resist: "🔮 Magic Resistance",
    attack_speed: "⚡ Attack Speed",
    critical_rate: "🎯 Critical Rate",
    critical_damage: "💥 Critical Damage",
    lifesteal: "🩸 Physical Lifesteal",
    spell_vamp: "🔮 Spell Vamp",
    evasion: "💨 Evasion Rate",
    block: "🛡️ Block Rate",
    stat_base: "Base",
    stat_cap: "Cap",
    hero_tip: "💡 Equipment, prestige bonuses, and levels are calculated automatically. Upgrade equipment or summon rare weapons to boost stats!",
    ascension_prestige: "Ascension & Prestige",
    prestige_desc: "Perform an Ascension to reset your character level, gold, and stage progress back to 1. In return, you will keep all inventory items and receive **Prestige Points** which grant permanent multiplicative bonuses.",
    total_prestige_runs: "Total Prestige Runs",
    active_prestige_points: "Active Prestige Points",
    active_buffs: "Active Buffs",
    damage_modifier: "⚔️ Damage Modifier",
    hp_modifier: "💖 HP Modifier",
    defense_modifier: "🛡️ Defense Modifier",
    ascend_now: "Ascend Now",
    ascension_locked: "Ascension Locked",
    ascension_locked_desc: "You must clear stage 10 to unlock prestige benefits. (Current: Stage {stage})",

    // Bag Tab
    inventory_capacity: "Slots",
    equipped_label: "Equipped",
    unequipped_label: "Unequipped",
    equip_btn: "Equip",
    unequip_btn: "Unequip",
    sell_btn: "Sell",
    upgrade_btn: "Upgrade",
    upgrade_cost_label: "Upgrade Cost",
    insufficient_gold: "Insufficient Gold",
    rarity_common: "Common",
    rarity_uncommon: "Uncommon",
    rarity_rare: "Rare",
    rarity_epic: "Epic",
    rarity_legendary: "Legendary",
    slot_weapon: "Weapon",
    slot_armor: "Armor",
    slot_helmet: "Helmet",
    slot_boots: "Boots",
    slot_ring: "Ring",
    slot_gloves: "Gloves",
    no_items: "No items.",
    bag_tip: "⚔️ Click on any item in your bag to inspect, equip, sell or upgrade it.",
    bag_inspect_tip: "Tap on any item in your bag to inspect details and upgrade.",
    item_desc_legendary: "A legendary item forged in dragon fire, carrying supreme bonuses.",
    item_desc_standard: "A standard issue {slot} suited for combat adventures.",
    slot_empty: "empty",
    sell_warn: "Unequip item first to sell",
    class_restriction_error: "This equipment is restricted to character class {class}!",

    // Quest Tab
    active_bounties: "📜 Quests",
    progress_label: "Progress",
    claim_btn: "Claim Reward",
    no_quests: "No active quest bounties.",
    quest_claimed: "Claimed",
    quest_reward: "Reward",
    quest_target_defeat: "Defeat monsters",
    quest_target_gold: "Earn gold",
    quest_target_level: "Reach level",
    quest_target_upgrade: "Upgrade equipment",
    quest_in_progress: "In Progress",
    quest_ready: "Ready",

    // Guild Tab
    guild_realm: "🏰 Guild Realm",
    guild_desc: "Create or join a Guild to participate in boss raids and boost your attributes.",
    guild_members: "Members",
    guild_level: "Guild Level",
    guild_exp: "Guild EXP",
    guild_create_btn: "Create Guild",
    guild_join_btn: "Join Guild",
    guild_name_placeholder: "Enter guild name...",
    guild_features_locked: "Guild features are under development. Stay tuned for future updates!",
    guild_rank: "Guild Rank",
    guild_leader: "Guild Leader",
    guild_contrib: "Your Contribution",
    guild_announcement: "📢 Announcement: Guild Raid boss Behemoth starts tonight! Complete your check-ins and donations to earn raid tickets.",
    guild_checkin: "Guild Check-In",
    guild_gold_donate: "Gold Donation",
    guild_diamond_donate: "Elite Donation",
    guild_yield_xp: "Yields {xp} Guild XP",
    guild_donated_today: "Donated for Today",
    guild_donation_limit: "You can make one donation contribution per day.",
    guild_raid_boss: "Guild Raid Boss",
    guild_upcoming: "Upcoming Event",
    guild_raid_locked: "🔒 Raid Locked",
    hours: "Hours",
    mins: "Mins",
    secs: "Secs",

    // Shop Tab
    gold_market: "💰 Gold Market",
    shop_desc: "Spend Diamonds earned from combat to purchase Gold packs or other special boosters.",
    gold_pack_title: "Fortune Gold Pack",
    gold_pack_desc: "Instantly gain {gold} Gold (scales with your active stage progress)",
    buy_btn: "Buy",
    insufficient_diamonds: "Insufficient Diamonds",
    shop_success_buy: "Successfully purchased!",
    shop_gold_desc_scales: "Gold drops and pack values increase as you clear higher stages.",
    shop_boosters: "⚡ Combat Boosters",
    shop_boosters_desc: "Spend diamonds to activate magical buffs that increase your combat efficiency.",
    shop_speed_elixir: "Speed Elixir",
    shop_speed_elixir_desc: "+50% attack speed for 5m",
    shop_exp_charm: "EXP Charm",
    shop_exp_charm_desc: "+100% monster EXP for 5m",
    shop_buff_simulated: "Buff timers are simulated. Multiple buffs can accumulate.",
    shop_liquidation: "🧹 Liquidation Service",
    shop_liquidation_desc: "Running out of inventory space? Instantly sell all unequipped Common (Gray) items in your bag for immediate gold.",
    shop_common_count: "Common Items count:",
    shop_sell_all_commons: "Sell All Commons",
    shop_liquidation_note: "Equipped items are never sold. Rare, Epic and Legendary items must be sold individually.",
    log_shop_no_commons: "No unequipped common items in bag to sell.",
    log_shop_bulk_sold: "Bulk Sold: Cleared {count} common items for {gold} Gold 💰!",
    log_shop_speed_elixir: "Purchased Speed Elixir! Hero is moving with double speed (visual effect mock).",
    log_shop_exp_charm: "Purchased EXP Charm! Monster EXP reward doubled (visual effect mock).",

    // Summon Tab
    sacred_summon: "🎁 Sacred Summon",
    summon_desc: "Unlock high-grade legendary swords, plates, rings, or boots. Rarity ranges from Common to Legendary!",
    summon_btn: "Summon Equipment (10 💎)",
    summon_rate_info: "Pull Rates: Common (45%) | Uncommon (30%) | Rare (18%) | Epic (6%) | Legendary (1.2%)",
    summon_inventory_warning: "Inventory full! Clear items before summoning.",
    summon_chest_title: "Aetherial Armory Chest",
    summon_x1: "Summon x1",
    summon_x10: "Summon x10",
    summon_results: "Draw Results",
    summon_no_draws: "No Draws Yet",
    summon_no_draws_desc: "Pulls will show up here after opening Aetherial chests.",
    summon_drop_rates: "Rarities Drop Rate:",
    log_summon_ten: "10x SUMMON: {legendary} Legendary ⭐, {epic} Epic 💜, {rare} Rare 💙, {uncommon} Uncommon 💚, {common} Common 🪨",
    summon_inventory_10x: "Not enough inventory space! You need at least 10 free slots (Current space: {space}).",

    // System Messages & Game Logs
    log_welcome: "Welcome back, {email}! Game data loaded.",
    log_engine_ready: "Game engine initialized. Auto battle is ready.",
    log_wild_monster: "Stage {stage}: A wild {monster} appeared!",
    log_hero_strike: "{attacker} strikes {monster} for {damage} dmg{crit}!",
    log_hero_ult_knight: "🌟 [{attacker}] unleashes [AETHER STRIKE] slashing {target} for {damage} damage!",
    log_hero_ult_mage: "🔮 [{attacker}] chants spells calling [METEOR STORM] burning {target} for {damage} damage!",
    log_hero_ult_assassin: "🗡️ [{attacker}] glides into [SHADOW STRIKE] assassinating {target} for {damage} critical damage!",
    log_boss_sweep: "🐉 {boss} sweeps tail hitting {target} for {damage} dmg!",
    log_boss_apocalypse: "💥 {boss} unleashes [VOID APOCALYPSE] crushing the team for {damage} damage!",
    log_slime_ult_fire: "🔥 {monster} erupts with [FIRE BLAST] burning Hero for {damage} damage!",
    log_slime_ult_ice: "❄️ {monster} casts [FROSTBITE] freezing Hero for {damage} damage!",
    log_slime_ult_stone: "🛡️ {monster} activates [STONE ARMOR] and rams Hero for {damage} damage!",
    log_slime_ult_king: "👑 SLIME KING slams with [KING'S SLAM] crushing Hero for {damage} damage!",
    log_slime_ult_common: "🟢 {monster} fires [JELLY BUBBLE] splashing Hero for {damage} damage!",
    log_monster_strike: "{monster} hits Hero for {damage} dmg.",
    log_defeated_monster: "Defeated {monster}! Gained {gold} Gold, {exp} EXP.",
    log_loot_found: "LOOT FOUND: [{name}] ({rarity})!",
    log_hero_defeated: "Hero was defeated! Recovering health...",
    log_prestige_complete: "PRESTIGE COMPLETE! Reset level to 1, earned +{points} Prestige Points.",
    log_class_changed: "🔄 Character class changed to {class}!",
    log_inventory_full: "Inventory full! Loot lost: [{name}]",
    log_level_up: "LEVEL UP! Hero reached Level {level}!",
    log_upgraded_item: "Upgraded [{name}] to +{level}!",
    log_equipped_item: "Equipped [{name}]",
    log_unequipped_item: "Unequipped [{name}]",
    log_sold_item: "Sold [{name}] for {gold} Gold",
    log_sold_multiple: "Bulk Liquidation: Sold {count} items for {gold} Gold",
    log_guild_gold_donate: "Guild Contribution: Donated 500 Gold! Earned +25 Guild XP.",
    log_guild_diamond_donate: "Guild Contribution: Donated 25 Diamonds! Earned +100 Guild XP.",
    log_claimed_quest: "Claimed quest [{title}]: Gained {gold} Gold, {diamonds} Diamonds.",
    log_bought_gold: "Bought Gold Pack: Spent {cost} Diamonds, gained {gold} Gold.",
    log_summon_success: "SUMMON SUCCESS! Pulled [{name}] ({rarity})!",
    log_item_evolved: "✨ EQUIPMENT EVOLVED: [{name}] reached the kill goal and evolved to {stage}!",
    log_identified: "🔍 IDENTIFICATION SUCCESS: Revealed stats for [{name}]!",
    log_gem_inserted: "💎 GEM SLOTTED: Inserted gem {gem} into the item!",
    corrupted_upgrade_error: "👿 BLOCKED: Corrupted equipment [{name}] cannot be upgraded!",
    unidentified_name: "Unidentified Item",

    // Item Templates Translations
    item_t_wpn_rusty: "Rusty Sword",
    item_t_wpn_steel: "Steel Sword",
    item_t_wpn_knight: "Knightly Claymore",
    item_t_wpn_demonic: "Demonic Reaver",
    item_t_wpn_excalibur: "Excalibur",
    item_t_arm_rag: "Ragged Tunic",
    item_t_arm_leather: "Leather Jerkin",
    item_t_arm_plate: "Iron Platebody",
    item_t_arm_dragon: "Dragonscale Armor",
    item_t_hel_cap: "Leather Cap",
    item_t_hel_iron: "Iron Barbute",
    item_t_hel_great: "Steel Greathelm",
    item_t_bts_worn: "Worn Boots",
    item_t_bts_leather: "Swift Leather Boots",
    item_t_bts_guardian: "Guardian Sabatons",
    item_t_rng_brass: "Brass Ring",
    item_t_rng_silver: "Silver Ring",
    item_t_rng_ruby: "Ruby Signet Ring",

    // Quest Templates Translations
    quest_q1_title: "First Blood",
    quest_q1_desc: "Defeat 5 monsters to prove your combat skills.",
    quest_q2_title: "Accumulate Wealth",
    quest_q2_desc: "Gather 1,000 total gold.",
    quest_q3_title: "Ready for Battle",
    quest_q3_desc: "Upgrade an equipment item to Level 2.",

    // Monster Prefixes
    monster_pref_Stone: "Stone",
    monster_pref_Iron: "Iron",
    monster_pref_Shadow: "Shadow",
    monster_pref_Flame: "Flame",
    monster_pref_Frost: "Frost",
    monster_pref_Void: "Void",
    monster_pref_Chaos: "Chaos",
    monster_pref_Abyssal: "Abyssal",
    monster_pref_Undead: "Undead",
    monster_pref_Spectral: "Spectral",

    // Monster Bases
    monster_base_Slime: "Slime",
    monster_base_Goblin: "Goblin",
    monster_base_Skeleton: "Skeleton",
    monster_base_Orc: "Orc",
    monster_base_Golem: "Golem",
    monster_base_Wraith: "Wraith",
    monster_base_Demon: "Demon",
    monster_base_Drake: "Drake",
    monster_base_Dragon: "Dragon",
    monster_base_Titan: "Titan",

    // Hero Revival
    revive_title: "HERO DEFEATED",
    revive_subtitle: "Your HP reached 0, select a revival option:",
    revive_gold: "Revive with Gold",
    revive_diamonds: "Revive with Diamonds",
    revive_time: "Free Revive",
    revive_countdown: "Auto free revive in {seconds}s",
    keep_stage_note: "(Keep active Stage)",
    drop_stage_note: "(Drop 1 Stage penalty)",
    log_hero_revived: "Hero has revived and is ready to fight!",
    ...EXTRA_EN
  }
};

export const useTranslation = () => {
  const { language } = useLanguageStore();

  const t = (key: keyof typeof translations['en'] | string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations['en'];
    let val = (dict as any)[key] || (translations['en'] as any)[key] || String(key);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  return { t, language };
};

export const tStore = (key: keyof typeof translations['en'] | string, params?: Record<string, string | number>): string => {
  const language = useLanguageStore.getState().language;
  const dict = translations[language] || translations['en'];
  let val = (dict as any)[key] || (translations['en'] as any)[key] || String(key);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
};

// Item translate helper
export const getTranslatedItemName = (t: any, item: { templateId: string; name: string }) => {
  if (!item) return '';
  const key = `item_${item.templateId}`;
  const translated = t(key);
  return translated === key ? item.name : translated;
};

// Quest translate helpers
export const getTranslatedQuestTitle = (t: any, questId: string, fallback: string) => {
  const key = `quest_${questId}_title`;
  const translated = t(key);
  return translated === key ? fallback : translated;
};

export const getTranslatedQuestDesc = (t: any, questId: string, fallback: string) => {
  const key = `quest_${questId}_desc`;
  const translated = t(key);
  return translated === key ? fallback : translated;
};

export const getTranslatedMonsterName = (t: any, name: string) => {
  if (!name) return name;

  // Clean up parenthesis like " (Lvl 1)" if present
  let cleanName = name;
  let lvlSuffix = '';
  const lvlMatch = name.match(/(\s*\(Lvl \d+\))/i);
  if (lvlMatch) {
    cleanName = name.replace(lvlMatch[0], '').trim();
    lvlSuffix = lvlMatch[0];
  }

  if (cleanName.startsWith('👑 BOSS: ')) {
    const bossName = cleanName.replace('👑 BOSS: ', '').trim();
    const language = useLanguageStore.getState().language;
    const bossKeys: Record<string, string> = {
      'Slime King': language === 'vi' ? 'Vua Slime' : 'Slime King',
      'Goblin Emperor': language === 'vi' ? 'Hoàng Đế Goblin' : 'Goblin Emperor',
      'Skeleton Warlord': language === 'vi' ? 'Đại Tướng Bộ Xương' : 'Skeleton Warlord',
      'Orc Chieftain': language === 'vi' ? 'Tộc Trưởng Orc' : 'Orc Chieftain',
      'Golem Guardian': language === 'vi' ? 'Hộ Vệ Golem' : 'Golem Guardian',
      'Wraith Lord': language === 'vi' ? 'Chúa Tể Bóng Ma' : 'Wraith Lord',
      'Demon Commander': language === 'vi' ? 'Thống Lãnh Ác Quỷ' : 'Demon Commander',
      'Drake Sovereign': language === 'vi' ? 'Chúa Rồng Nhỏ' : 'Drake Sovereign',
      'Ancient Dragon': language === 'vi' ? 'Cổ Long' : 'Ancient Dragon',
      'Titan Overlord': language === 'vi' ? 'Chúa Tể Khổng Lồ' : 'Titan Overlord'
    };
    const translatedBoss = bossKeys[bossName] || bossName;
    return `👑 BOSS: ${translatedBoss}${lvlSuffix}`;
  }

  const parts = cleanName.trim().split(' ');
  let translatedName = cleanName;
  if (parts.length === 1) {
    const baseKey = `monster_base_${parts[0]}`;
    const baseTrans = t(baseKey);
    translatedName = baseTrans === baseKey ? parts[0] : baseTrans;
  } else if (parts.length === 2) {
    const prefKey = `monster_pref_${parts[0]}`;
    const baseKey = `monster_base_${parts[1]}`;
    const prefTrans = t(prefKey);
    const baseTrans = t(baseKey);
    const pStr = prefTrans === prefKey ? parts[0] : prefTrans;
    const bStr = baseTrans === baseKey ? parts[1] : baseTrans;

    const language = useLanguageStore.getState().language;
    if (language === 'vi') {
      // In Vietnamese, "Stone Slime" becomes "Slime Đá" (Base + Modifier)
      translatedName = `${bStr} ${pStr}`;
    } else {
      translatedName = `${pStr} ${bStr}`;
    }
  }

  return translatedName + lvlSuffix;
};

// Engine Log regex-based translator helper
export const translateEngineLog = (text: string): string => {
  if (!text) return text;

  // 1. Game engine initialized
  if (text.includes('Game engine initialized. Auto battle is ready.')) {
    return tStore('log_engine_ready');
  }

  // 2. Hero defeated
  if (text.includes('Hero was defeated! Recovering health...')) {
    return tStore('log_hero_defeated');
  }

  // 3. Stage wild monster
  // e.g. "Stage 1: A wild Slime appeared!"
  const wildMonsterMatch = text.match(/^Stage (\d+): A wild (.*?) appeared!$/i);
  if (wildMonsterMatch) {
    const stage = wildMonsterMatch[1];
    const monster = getTranslatedMonsterName(tStore, wildMonsterMatch[2]);
    return tStore('log_wild_monster', { stage, monster });
  }

  // 4. Hero/Ally strike
  // e.g. "Hero strikes Slime for 15 dmg" or "Hero strikes Slime for 45 dmg (CRITICAL!)"
  const strikeMatch = text.match(/^(.*?) strikes (.*?) for (\d+) dmg(\s*\(CRITICAL!\))?$/i);
  if (strikeMatch) {
    const rawAttacker = strikeMatch[1];
    const lang = useLanguageStore.getState().language;
    const attacker = rawAttacker === 'Hero' ? (lang === 'vi' ? 'Anh Hùng' : 'Hero') : rawAttacker;
    const monster = getTranslatedMonsterName(tStore, strikeMatch[2]);
    const damage = strikeMatch[3];
    const crit = strikeMatch[4] ? ' (CHÍ MẠNG!)' : '';
    return tStore('log_hero_strike', { attacker, monster, damage, crit });
  }

  // Hero/Ally Class Ultimate (can be AETHER STRIKE, METEOR STORM, or SHADOW STRIKE)
  // e.g. "Hero unleashes ultimate [AETHER STRIKE] on enemies for 50 damage!"
  // e.g. "Spellweaver unleashes ultimate [METEOR STORM] on enemies for 80 damage!"
  const classUltMatch = text.match(/^(.*?) unleashes ultimate \[(.*?)\] on (.*?) for (\d+) damage!$/i);
  if (classUltMatch) {
    const rawAttacker = classUltMatch[1];
    const lang = useLanguageStore.getState().language;
    const attacker = rawAttacker === 'Hero' ? (lang === 'vi' ? 'Anh Hùng' : 'Hero') : rawAttacker;
    const skill = classUltMatch[2].toUpperCase();
    const target = classUltMatch[3];
    const damage = classUltMatch[4];

    const translatedTarget = target.toLowerCase().includes('enemies')
      ? (lang === 'vi' ? 'kẻ địch' : 'enemies')
      : getTranslatedMonsterName(tStore, target);

    if (skill === 'AETHER STRIKE') {
      return tStore('log_hero_ult_knight', { attacker, target: translatedTarget, damage });
    } else if (skill === 'METEOR STORM') {
      return tStore('log_hero_ult_mage', { attacker, target: translatedTarget, damage });
    } else if (skill === 'SHADOW STRIKE') {
      return tStore('log_hero_ult_assassin', { attacker, target: translatedTarget, damage });
    }
  }

  // Boss Sweep
  // e.g. "Void Behemoth sweeps tail hitting Hero for 45 dmg."
  const bossSweepMatch = text.match(/^(Void Behemoth) sweeps tail hitting (.*?) for (\d+) dmg\.$/i);
  if (bossSweepMatch) {
    const boss = bossSweepMatch[1];
    const rawTarget = bossSweepMatch[2];
    const lang = useLanguageStore.getState().language;
    const target = rawTarget === 'Hero' ? (lang === 'vi' ? 'Anh Hùng' : 'Hero') : rawTarget;
    const damage = bossSweepMatch[3];
    return tStore('log_boss_sweep', { boss, target, damage });
  }

  // Boss Apocalypse
  // e.g. "Void Behemoth unleashes [VOID APOCALYPSE] crushing the team for 850 total damage!"
  const bossApocalypseMatch = text.match(/^(Void Behemoth) unleashes \[(.*?)\] on the team for (\d+) total damage!$/i);
  if (bossApocalypseMatch) {
    const boss = bossApocalypseMatch[1];
    const damage = bossApocalypseMatch[3];
    return tStore('log_boss_apocalypse', { boss, damage });
  }

  // Monster Ultimate
  // e.g. "Slime casts ultimate [FIRE BLAST] on Hero for 15 damage!"
  const monsterUltMatch = text.match(/^(.*?) casts ultimate \[(.*?)\] on Hero for (\d+) damage!$/i);
  if (monsterUltMatch) {
    const monster = getTranslatedMonsterName(tStore, monsterUltMatch[1]);
    const skill = monsterUltMatch[2].toUpperCase();
    const damage = monsterUltMatch[3];

    if (skill === 'FIRE BLAST') {
      return tStore('log_slime_ult_fire', { monster, damage });
    } else if (skill === 'FROSTBITE') {
      return tStore('log_slime_ult_ice', { monster, damage });
    } else if (skill === 'STONE ARMOR') {
      return tStore('log_slime_ult_stone', { monster, damage });
    } else if (skill === 'KINGS SLAM') {
      return tStore('log_slime_ult_king', { monster, damage });
    } else {
      return tStore('log_slime_ult_common', { monster, damage });
    }
  }

  // 5. Monster strike
  // e.g. "Slime hits Hero for 5 dmg."
  const monsterStrikeMatch = text.match(/^(.*?) hits Hero for (\d+) dmg\.$/i);
  if (monsterStrikeMatch) {
    const monster = getTranslatedMonsterName(tStore, monsterStrikeMatch[1]);
    const damage = monsterStrikeMatch[2];
    return tStore('log_monster_strike', { monster, damage });
  }

  // 6. Monster Defeated
  // e.g. "Defeated Slime! Gained 8 Gold, 8 EXP."
  const defeatedMonsterMatch = text.match(/^Defeated (.*?)! Gained (\d+) Gold, (\d+) EXP\.$/i);
  if (defeatedMonsterMatch) {
    const monster = getTranslatedMonsterName(tStore, defeatedMonsterMatch[1]);
    const gold = defeatedMonsterMatch[2];
    const exp = defeatedMonsterMatch[3];
    return tStore('log_defeated_monster', { monster, gold, exp });
  }

  // 7. Loot found
  // e.g. "LOOT FOUND: [Rusty Sword] (common)!"
  const lootFoundMatch = text.match(/^LOOT FOUND: \[(.*?)\] \((.*?)\)!$/i);
  if (lootFoundMatch) {
    const itemName = lootFoundMatch[1];
    const rarity = lootFoundMatch[2];

    // Map item name back to template translation if possible
    // Note: We can translate rarities as well
    const viRarityMap: Record<string, string> = {
      common: 'Thường',
      uncommon: 'Đặc Biệt',
      rare: 'Hiếm',
      epic: 'Sử Thi',
      legendary: 'Huyền Thoại'
    };
    const lang = useLanguageStore.getState().language;
    const rarityStr = lang === 'vi' ? (viRarityMap[rarity.toLowerCase()] || rarity) : rarity;

    return tStore('log_loot_found', { name: itemName, rarity: rarityStr });
  }

  return text;
};
