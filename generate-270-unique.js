const fs = require('fs');
const path = require('path');
const https = require('https');
const JimpLib = require('jimp');
const Jimp = JimpLib.Jimp || JimpLib;

const targetDir = path.join(__dirname, 'apps', 'web', 'public', 'assets', 'items');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Full ITEM_NAMES_DB from packages/shared/src/formulas.ts
const ITEM_NAMES_DB = {
  knight: {
    weapon: {
      common: ["Kiếm sắt rỉ", "Rìu tiều phu", "Búa gỗ"],
      uncommon: ["Kiếm thép thô", "Rìu chiến kép", "Búa sắt nặng"],
      rare: ["Đại kiếm khổng lồ", "Rìu xuyên giáp", "Thương Thần sắt"],
      epic: ["Kiếm Hỏa Long", "Rìu chiến phá trời", "Búa chấn động đất"],
      legendary: ["Kiếm Thần Thiên Mệnh", "Rìu Thần Long Phá Trời", "Búa Diệt Quỷ Hủy Thế"]
    },
    helmet: {
      common: ["Mũ sắt trơn", "Mũ chiến binh da thô", "Nía sắt"],
      uncommon: ["Mũ lính pháo đài", "Mũ sắt nạm đồng", "Mũ sừng bò"],
      rare: ["Mũ giáp nặng", "Mũ sừng chiến binh rừng sâu", "Mũ thép chắc chắn"],
      epic: ["Mũ Hỏa Long", "Mũ sừng Quỷ Thép", "Mũ Đại Chiến Thần"],
      legendary: ["Mũ Vua Vàng", "Mũ chiến Thần Long", "Mũ Bất tử Vua Âm phủ"]
    },
    armor: {
      common: ["Giáp da thô", "Đệm ngực sắt", "Giáp xích rách"],
      uncommon: ["Giáp xích lính", "Giáp tấm thép thô", "Giáp vai kim loại"],
      rare: ["Giáp thép nặng tinh chế", "Giáp tấm chắc chắn", "Giáp Sư tử lớn"],
      epic: ["Giáp vảy Hỏa Long", "Giáp Chiến Thần Vô địch", "Giáp nặng thạch anh"],
      legendary: ["Giáp Thánh Vương", "Giáp Thần Long Bất tử", "Giáp Huyền Vũ Cổ đại"]
    },
    boots: {
      common: ["Giày da thô nặng", "Giày vải đế gỗ", "Giày sắt rỉ"],
      uncommon: ["Giày sắt lính", "Giày bảo vệ da bò", "Giày chiến thép nhẹ"],
      rare: ["Giày thép nặng tinh chế", "Giày da gấu chắc chắn", "Giày đinh thép"],
      epic: ["Giày Hỏa Long Bộ", "Giày Kim cương Bất hoại", "Giày Đại Chiến Thần"],
      legendary: ["Giày Sao Thần Vương", "Giày Thần Long Bất tử", "Giày Trấn Địa Cổ đại"]
    },
    ring: {
      common: ["Nhẫn sắt rộng", "Nhẫn đồng thô bạo", "Vòng tay đồng"],
      uncommon: ["Nhẫn thép gia cố", "Nhẫn đá mắt hổ", "Vòng tay chiến binh bạc"],
      rare: ["Nhẫn Sư tử Vương", "Nhẫn phòng thủ đá khổng lồ", "Bông tai Ý chí Chiến tranh"],
      epic: ["Nhẫn mắt Hỏa Long", "Nhẫn bảo vệ cơ thể Kim cương", "Nhẫn Chiến Thần Cuồng nộ"],
      legendary: ["Nhẫn Thần Vương Rung chuyển Trời", "Nhẫn Linh hồn Thần Long Bất tử", "Nhẫn Hoang dã Cổ đại"]
    },
    gloves: {
      common: ["Găng tay da dày", "Băng tay chiến binh vải thô", "Găng tay sắt sứt mẻ"],
      uncommon: ["Găng tay lính thép", "Găng tay da gấu thô", "Găng tay bảo vệ cổ tay"],
      rare: ["Găng tay thép tinh chế", "Găng tay Bão Sư tử", "Găng tay Phá giáp nặng"],
      epic: ["Găng tay móng vuốt Hỏa Long", "Găng tay Kim cương Bất hoại", "Găng tay Sức mạnh Chiến thần"],
      legendary: ["Tay Bá chủ Thần Vương", "Tay móng vuốt Thần Long Bất tử", "Nắm đấm Khai Thiên Cổ đại"]
    }
  },
  mage: {
    weapon: {
      common: ["Gậy sồi cũ", "Sách phép nát", "Gậy tập luyện"],
      uncommon: ["Susty Phép nát", "Dady Phép nát", "Hiding Phép nát"],
      rare: ["Ciame Phép sư", "Biornet Phép nát", "Slime Phép sư"],
      epic: ["Tavuri Slayer", "Blanote Slayer", "Soarmon Slayer"],
      legendary: ["Finpus Slayer", "Gamson Slayer", "Star Slayer"]
    },
    helmet: {
      common: ["Canvas Scarf", "Vastous Scarf", "Dossing Scarf"],
      uncommon: ["Higher Canvy", "Poatrous Scarf", "Dark Emperor Scarf"],
      rare: ["Deely Hats", "Unique Burn Hats", "Dark Genhle Mask"],
      epic: ["Blot Iffuers Mask", "The Warth Mask", "Dark Emperor Mirror Mask"],
      legendary: ["The Isinokls Mask", "Dark Emperor Mirror Mask", "Grand Dark Emperor Mirror Mask"]
    },
    armor: {
      common: ["Torn Cloth Cloak", "Torn Cloth Cloak II", "Dragon Scale Cloak"],
      uncommon: ["Torn Cloth Cloak III", "Torn Cloth Cloak IV", "Dragon Scale Armor"],
      rare: ["Sawidans Armor", "Suvnitflure Armor", "Dragoriosx Dark Armor"],
      epic: ["Dragon Scale Armor II", "Dragon Scale Armor III", "Dragon Scale Dark Armor"],
      legendary: ["The Tavone Armor", "Dragon Scale Dark Armor II", "Ancient Dragon Scale Armor"]
    },
    boots: {
      common: ["Torn Cloth Shoes", "Torn Cloth Shoes II", "Torn Cloth Shoes III"],
      uncommon: ["Torn Cloth Shoes IV", "Torn Cloth Shoes V", "Torn Cloth Shoes VI"],
      rare: ["Torn Cloth Shoes VII", "Detherworld Shoes", "Nine Netherworld Shoes"],
      epic: ["Nelneanworld Shoes", "Hithwauworld Shoes", "Nine Aivay Shoes"],
      legendary: ["Netherworld Steps", "Nine Netherworld Steps", "Cosmic Netherworld Steps"]
    },
    ring: {
      common: ["Plain Copper Ring", "Plain Copper Ring II", "Plain Copper Ring III"],
      uncommon: ["Plain Copper Ring IV", "Plain Copper Ring V", "Gray Copper Ring"],
      rare: ["Epic Copper Ring", "Damn Copper Ring", "Epic Copper Ring II"],
      epic: ["World-Copper Ring", "World-Destroyer Ring", "World-Destroyer Ring II"],
      legendary: ["World-Destroying Ring", "World-Destroying Killing Intent Rings", "Universe-Destroying Ring"]
    },
    gloves: {
      common: ["Thin Cloth Gloves", "Thin Cloth Gloves II", "Blood Cloth Gloves"],
      uncommon: ["Thin Cloth Gloves III", "Thin Cloth Gloves IV", "Stroalownem Gloves"],
      rare: ["Epin Cloth Gloves", "Blsan Cloth Gloves", "Blood Coth Gloves"],
      epic: ["Blood God Water Gloves", "Blood God Slaughter Hand", "Blood God Slaughter Hand II"],
      legendary: ["Blood God Slaughter Hand III", "Blood God Slaughter Hand IV", "Blood God Slaughter Hand V"]
    }
  },
  assassin: {
    weapon: {
      common: ["Dao Găm Gỉ Sét", "Kiếm Ngắn Gỗ", "Shuriken Sắt"],
      uncommon: ["Lưỡi Kép Thép Sắc Bén", "Dao Găm Đồng", "Kiếm Răng Cưa"],
      rare: ["Kim Độc", "Kiếm Ngắn Săn Đêm", "Cây Chùy Gai Ám Sát"],
      epic: ["Lưỡi Trăng Máu", "Móng Vuốt Bóng Tối", "Lưỡi Hái Linh Hồn"],
      legendary: ["Móng Vuốt Phong Ma", "Gương Thảm Họa", "Kẻ Diệt Sao"]
    },
    helmet: {
      common: ["Khăn Quàng Cổ Vải Bố", "Mũ Da Mòn", "Mặt Nạ Vải Thô"],
      uncommon: ["Khăn Quàng Đêm Đen", "Mũ Da Sói", "Mặt Nạ Sắt Nửa Mặt"],
      rare: ["Mũ Trùm Rừng Sâu", "Mặt Nạ Thợ Săn Đêm", "Băng Đeo Đầu Huyết Tộc"],
      epic: ["Mũ Trùm Vô Hình", "Mặt Nạ Quỷ Đêm", "Vương Miện Bóng Đêm"],
      legendary: ["Gương Mắt Thần", "Mặt Nạ Tay Hư Không", "Mặt Nạ Gương Hắc Hoàng Đế"]
    },
    armor: {
      common: ["Áo Choàng Vải Rách", "Giáp Da Thô", "Áo Khoác Ngắn Thợ Săn"],
      uncommon: ["Áo Choàng Người Đi Đêm", "Giáp Da Rừng Nhiệt Đới", "Giáp Sợi Thép"],
      rare: ["Giáp Da Báo Băng", "Áo Choàng Tàng Hình", "Giáp Nhẹ Khảm Bạc"],
      epic: ["Áo Choàng Bóng Huyết", "Giáp Rắn Đêm", "Áo Choàng Bóng Quỷ"],
      legendary: ["Áo Choàng Đêm Ngàn Năm", "Giáp Bóng Ma Thần", "Giáp Vảy Rồng Đen"]
    },
    boots: {
      common: ["Giày Vải Rách", "Băng Quấn Chân Vải", "Giày Da Thô"],
      uncommon: ["Giày Da Thợ Săn", "Giày Vải Gai Bền", "Giày Người Đi Đêm Nhẹ"],
      rare: ["Giày Trăm Bước Chân Nhẹ", "Ủng Tốc Độ Báo Gấm", "Đinh Giày Ám Sát"],
      epic: ["Ủng Bóng Gió", "Bước Chân Ủng Bóng Huyết", "Ủng Đêm Bí Ẩn"],
      legendary: ["Bước Chân Tốc Bầu Trời Sao", "Ủng Gió Nhanh Hư Không", "Chín Bước Chân Địa Ngục"]
    },
    ring: {
      common: ["Nhẫn Đồng Trơn", "Nhẫn Đá Thô", "Nhẫn Sắt Sứt Mẻ"],
      uncommon: ["Nhẫn Khắc Biểu Tượng", "Nhẫn Mã Não", "Nhẫn Sắt Ý Bạc"],
      rare: ["Nhẫn Ngọc Rắn Độc", "Nhẫn Huyết Thạch Thật", "Nhẫn Tốc Độ Ánh Sáng"],
      epic: ["Nhẫn Định Vị Mắt Quỷ", "Nhẫn Sức Mạnh Quỷ Bóng Tối", "Nhẫn Tinh Hoa Trăng Máu"],
      legendary: ["Nhẫn Phước Lành Thần Thánh", "Cõi Hư Không Tối Cao", "Nhẫn Sát Ý Hủy Diệt Thế Giới"]
    },
    gloves: {
      common: ["Găng Tay Vải Mỏng", "Găng Tay Da Thô", "Băng Quấn Tay Vải Gai"],
      uncommon: ["Găng Tay Thợ Săn", "Găng Tay Da Khảm Đồng", "Găng Tay Người Đi Đêm"],
      rare: ["Găng Tay Móng Vuốt Độc", "Găng Tay Nhẹ Khảm Bạc", "Găng Tay Tăng Tốc"],
      epic: ["Găng Tay Móng Vuốt Quỷ", "Găng Tay Đêm Chết Chóc", "Găng Tay Bóng Tối"],
      legendary: ["Móng Vuốt Thần Thánh Bàn Tay Thần", "Bàn Tay Hủy Diệt Hư Không", "Bàn Tay Tàn Sát Huyết Thần"]
    }
  }
};

const LEGACY_ID_MAP = {
  "knight_weapon_common_0": "t_wpn_rusty",
  "knight_weapon_uncommon_0": "t_wpn_steel",
  "knight_weapon_rare_0": "t_wpn_knight",
  "knight_weapon_epic_0": "t_wpn_demonic",
  "knight_weapon_legendary_0": "t_wpn_excalibur",
  "mage_weapon_common_0": "t_wpn_rusty_staff",
  "mage_weapon_uncommon_0": "t_wpn_apprentice_staff",
  "mage_weapon_rare_0": "t_wpn_wizard_rod",
  "mage_weapon_epic_0": "t_wpn_archmage_wand",
  "mage_weapon_legendary_0": "t_wpn_cosmos_staff",
  "assassin_weapon_common_0": "t_wpn_rusty_dagger",
  "assassin_weapon_uncommon_0": "t_wpn_steel_daggers",
  "assassin_weapon_rare_0": "t_wpn_poison_dagger",
  "assassin_weapon_epic_0": "t_wpn_death_claws",
  "assassin_weapon_legendary_0": "t_wpn_asura_blades",
  "knight_armor_common_0": "t_arm_rag",
  "knight_armor_uncommon_0": "t_arm_leather",
  "knight_armor_rare_0": "t_arm_plate",
  "knight_armor_epic_0": "t_arm_dragon",
  "knight_armor_legendary_0": "t_arm_god_plate",
  "mage_armor_common_0": "t_arm_rag_robe",
  "mage_armor_uncommon_0": "t_arm_leather_robe",
  "mage_armor_rare_0": "t_arm_silk_robe",
  "mage_armor_epic_0": "t_arm_phoenix_robe",
  "mage_armor_legendary_0": "t_arm_celestial_robe",
  "assassin_armor_common_0": "t_arm_rag_cloak",
  "assassin_armor_uncommon_0": "t_arm_leather_cloak",
  "assassin_armor_rare_0": "t_arm_shadow_vest",
  "assassin_armor_epic_0": "t_arm_nether_cloak",
  "assassin_armor_legendary_0": "t_arm_phantom_garb",
  "knight_helmet_common_0": "t_hel_cap",
  "knight_helmet_uncommon_0": "t_hel_iron",
  "knight_helmet_rare_0": "t_hel_great",
  "knight_helmet_epic_0": "t_hel_dragon_horn",
  "knight_helmet_legendary_0": "t_hel_aegis_visor",
  "mage_helmet_common_0": "t_hel_cap_mage",
  "mage_helmet_uncommon_0": "t_hel_apprentice_hood",
  "mage_helmet_rare_0": "t_hel_wizard_hat",
  "mage_helmet_epic_0": "t_hel_archmage_crown",
  "mage_helmet_legendary_0": "t_hel_cosmos_crown",
  "assassin_helmet_common_0": "t_hel_cap_assassin",
  "assassin_helmet_uncommon_0": "t_hel_leather_mask",
  "assassin_helmet_rare_0": "t_hel_shadow_hood",
  "assassin_helmet_epic_0": "t_hel_death_cowl",
  "assassin_helmet_legendary_0": "t_hel_asura_hood",
  "knight_boots_common_0": "t_bts_worn",
  "knight_boots_uncommon_0": "t_bts_steel_greaves",
  "knight_boots_rare_0": "t_bts_guardian",
  "knight_boots_epic_0": "t_bts_dragonscale",
  "knight_boots_legendary_0": "t_bts_aegis",
  "mage_boots_common_0": "t_bts_worn_mage",
  "mage_boots_uncommon_0": "t_bts_mage_sandals",
  "mage_boots_rare_0": "t_bts_sorcerer_boots",
  "mage_boots_epic_0": "t_bts_archmage_slippers",
  "mage_boots_legendary_0": "t_bts_cosmos",
  "assassin_boots_common_0": "t_bts_worn_assassin",
  "assassin_boots_uncommon_0": "t_bts_leather",
  "assassin_boots_rare_0": "t_bts_stealth_treads",
  "assassin_boots_epic_0": "t_bts_shadow_boots",
  "assassin_boots_legendary_0": "t_bts_asura",
  "knight_ring_common_0": "t_rng_brass",
  "knight_ring_uncommon_0": "t_rng_silver",
  "knight_ring_rare_0": "t_rng_ruby",
  "knight_ring_epic_0": "t_rng_dragon_crest",
  "knight_ring_legendary_0": "t_rng_aegis",
  "mage_ring_common_0": "t_rng_brass_mage",
  "mage_ring_uncommon_0": "t_rng_silver_mage",
  "mage_ring_rare_0": "t_rng_ruby_mage",
  "mage_ring_epic_0": "t_rng_archmage_signet",
  "mage_ring_legendary_0": "t_rng_cosmos",
  "assassin_ring_common_0": "t_rng_brass_assassin",
  "assassin_ring_uncommon_0": "t_rng_silver_assassin",
  "assassin_ring_rare_0": "t_rng_ruby_assassin",
  "assassin_ring_epic_0": "t_rng_death_band",
  "assassin_ring_legendary_0": "t_rng_asura"
};

const getTemplateId = (cls, slot, rarity, idx) => {
  const key = `${cls}_${slot}_${rarity}_${idx}`;
  if (LEGACY_ID_MAP[key]) return LEGACY_ID_MAP[key];
  
  const slotShorthands = {
    weapon: "wpn",
    armor: "arm",
    helmet: "hel",
    boots: "bts",
    ring: "rng",
    gloves: "glo"
  };
  const sh = slotShorthands[slot] || slot;
  return `t_${sh}_${cls}_${rarity}_${idx + 1}`;
};

// Keyword English Translations
const KEYWORDS = {
  // Knight
  "Kiếm": "broadsword",
  "Rìu": "battle axe",
  "Búa": "war hammer",
  "Thương": "halberd spear",
  "Mũ": "knight helmet",
  "Nía": "iron visor cap",
  "Giáp": "knight plate armor",
  "Đệm ngực": "knight chestplate breastplate",
  "Giày": "knight plate boots",
  "Nhẫn": "knight signet ring",
  "Vòng tay": "knight bracelet wristband",
  "Bông tai": "knight earring",
  "Găng tay": "knight plate gauntlets",
  "Băng tay": "knight arm wraps",
  "Tay": "knight gauntlets",
  "Nắm đấm": "heavy steel fist weapon",
  
  // Mage
  "Gậy": "wizard magic staff",
  "Sách": "wizard magical spellbook",
  "Canvas Scarf": "purple canvas scarf cowl",
  "Vastous Scarf": "purple wizard scarf",
  "Dossing Scarf": "purple wizard head wrap",
  "Higher Canvy": "purple high mage hood",
  "Poatrous Scarf": "purple apprentice cowl",
  "Dark Emperor Scarf": "dark purple sorcerer hood",
  "Deely Hats": "pointed wizard hat",
  "Unique Burn Hats": "glowing purple wizard hat",
  "Dark Genhle Mask": "glowing purple mage mask",
  "Blot Iffuers Mask": "glowing violet archmage crown",
  "The Warth Mask": "glowing purple warlock mask",
  "Dark Emperor Mirror Mask": "purple demonic mirror mask",
  "The Isinokls Mask": "cosmic galaxy wizard crown",
  "Grand Dark Emperor Mirror Mask": "cosmic purple emperor crown",
  "Torn Cloth Cloak": "apprentice wizard robes",
  "Dragon Scale Cloak": "purple dragon scale cloak",
  "Dragon Scale Armor": "purple dragon scale robes",
  "Sawidans Armor": "purple wizard silk robes",
  "Suvnitflure Armor": "purple magician tunic",
  "Dragoriosx Dark Armor": "dark purple sorcerer robes",
  "The Tavone Armor": "cosmic celestial star robes",
  "Ancient Dragon Scale Armor": "ancient purple dragon scale robes",
  "Torn Cloth Shoes": "apprentice wizard shoes",
  "Detherworld Shoes": "dark purple sorcerer boots",
  "Nine Netherworld Shoes": "purple phantom steps boots",
  "Nelneanworld Shoes": "glowing purple archmage slippers",
  "Hithwauworld Shoes": "glowing purple magic boots",
  "Nine Aivay Shoes": "violet warlock boots",
  "Netherworld Steps": "cosmic galaxy mage boots",
  "Nine Netherworld Steps": "cosmic galaxy phantom slippers",
  "Cosmic Netherworld Steps": "ancient cosmic star boots",
  "Plain Copper Ring": "simple magic ring",
  "Gray Copper Ring": "silver apprentice ring",
  "Epic Copper Ring": "glowing purple sorcerer ring",
  "Damn Copper Ring": "dark purple warlock ring",
  "World-Copper Ring": "glowing purple world-destroyer ring",
  "World-Destroyer Ring": "glowing violet celestial ring",
  "World-Destroying Ring": "cosmic galaxy destroyer ring",
  "World-Destroying Killing Intent Rings": "cosmic black hole ring",
  "Universe-Destroying Ring": "ancient cosmic star ring",
  "Thin Cloth Gloves": "apprentice wizard gloves",
  "Blood Cloth Gloves": "purple magical wraps",
  "Stroalownem Gloves": "purple magic silk wraps",
  "Epin Cloth Gloves": "glowing purple sorcerer gloves",
  "Blsan Cloth Gloves": "glowing purple warlock wraps",
  "Blood Coth Gloves": "violet warlock gloves",
  "Blood God Water Gloves": "glowing purple archmage wraps",
  "Blood God Slaughter Hand": "glowing purple warlock gauntlets",
  "Blood God Slaughter Hand II": "glowing purple warlock gauntlets II",
  "Blood God Slaughter Hand III": "cosmic galaxy wizard wraps",
  "Blood God Slaughter Hand IV": "cosmic galaxy wizard wraps IV",
  "Blood God Slaughter Hand V": "ancient cosmic star wraps",
  
  // Assassin
  "Dao Găm": "assassin dagger",
  "Kiếm Ngắn": "assassin shortsword",
  "Shuriken": "assassin shuriken throwing star",
  "Lưỡi Kép": "assassin twin curved daggers",
  "Kiếm Răng Cưa": "assassin serrated blade",
  "Kim Độc": "assassin poison blowpipe needle weapon",
  "Cây Chùy Gai": "assassin spiky mace bludgeon",
  "Lưỡi Trăng Máu": "assassin crimson blood-crescent blade",
  "Móng Vuốt": "assassin shadow claws",
  "Lưỡi Hái": "assassin soul reaper scythe weapon",
  "Gương Thảm Họa": "assassin disaster mirror shield dagger",
  "Kẻ Diệt Sao": "assassin star-slayer phantom blade",
  "Khăn Quàng Cổ Vải Bố": "assassin cloth scarf face mask",
  "Mũ Da Mòn": "assassin worn leather hood",
  "Mặt Nạ Vải Thô": "assassin simple cloth face mask",
  "Khăn Quàng Đêm Đen": "assassin dark shadow cowl",
  "Mũ Da Sói": "assassin wolf leather hood",
  "Mặt Nạ Sắt Nửa Mặt": "assassin half-face iron mask",
  "Mũ Trùm Rừng Sâu": "assassin deep forest green hood",
  "Mặt Nạ Thợ Săn Đêm": "assassin night hunter mask",
  "Băng Đeo Đầu Huyết Tộc": "assassin red blood headband",
  "Mũ Trùm Vô Hình": "assassin purple stealth hood",
  "Mặt Nạ Quỷ Đêm": "assassin night demon mask",
  "Vương Miện Bóng Đêm": "assassin dark shadow crown",
  "Gương Mắt Thần": "assassin divine eye visor helmet",
  "Mặt Nạ Tay Hư Không": "assassin void portal face mask",
  "Mặt Nạ Gương Hắc Hoàng Đế": "assassin dark emperor mirror mask",
  "Áo Choàng": "assassin stealth cloak cape",
  "Giáp Da": "assassin leather vest armor",
  "Áo Khoác Ngắn": "assassin short leather jacket",
  "Giáp Sợi Thép": "assassin steel wire mesh armor",
  "Giáp Nhẹ": "assassin light silver armor",
  "Giáp Rắn Đêm": "assassin shadow snake scales armor",
  "Giáp Vảy Rồng Đen": "assassin black dragon scale cloak",
  "Giày Vải Rách": "assassin worn cloth shoes",
  "Băng Quấn Chân": "assassin foot wraps wraps",
  "Giày Da": "assassin leather stealth boots",
  "Giày Người Đi Đêm": "assassin dark night boots",
  "Giày Trăm Bước": "assassin light wind boots",
  "Ủng Tốc Độ": "assassin fast cheetah boots",
  "Đinh Giày": "assassin spiked boots",
  "Ủng Bóng Gió": "assassin wind phantom boots",
  "Ủng Đêm": "assassin dark night boots",
  "Chín Bước Chân": "assassin hellfire phantom boots",
  "Nhẫn Đồng Trơn": "assassin copper band ring",
  "Nhẫn Đá": "assassin rough stone ring",
  "Nhẫn Sắt": "assassin iron ring",
  "Nhẫn Khắc Biểu Tượng": "assassin engraved emblem ring",
  "Nhẫn Mã Não": "assassin onyx signet ring",
  "Nhẫn Ngọc Rắn": "assassin green snake ring",
  "Nhẫn Huyết Thạch": "assassin red bloodstone ring",
  "Nhẫn Tốc Độ": "assassin glowing speed ring",
  "Nhẫn Định Vị Mắt Quỷ": "assassin glowing demon eye ring",
  "Nhẫn Sức Mạnh Quỷ": "assassin dark demon power ring",
  "Nhẫn Tinh Hoa Trăng Máu": "assassin blood moon gem ring",
  "Nhẫn Phước Lành Thần Thánh": "assassin divine holy blessing ring",
  "Cõi Hư Không": "assassin dark void portal ring",
  "Nhẫn Sát Ý": "assassin dark red killing intent ring",
  "Găng Tay Vải Mỏng": "assassin thin cloth gloves",
  "Găng Tay Da": "assassin leather gloves",
  "Băng Quấn Tay": "assassin hand wraps wraps",
  "Găng Tay Thợ Săn": "assassin hunter leather gloves",
  "Găng Tay Người Đi Đêm": "assassin dark night gloves",
  "Găng Tay Móng Vuốt": "assassin shadow claw gauntlets",
  "Găng Tay Nhẹ": "assassin light silver gauntlets",
  "Găng Tay Tăng Tốc": "assassin wind gloves",
  "Găng Tay Đêm Chết Chóc": "assassin deathly night gloves",
  "Găng Tay Bóng Tối": "assassin dark shadow wraps",
  "Bàn Tay Hủy Diệt": "assassin void destruction claws",
  "Bàn Tay Tàn Sát Huyết Thần": "assassin blood god slaughter gauntlets",
  "Gương": "assassin mirror shield"
};

const MODIFIERS = {
  "rỉ": "rusty, old",
  "tiều phu": "woodcutter",
  "gỗ": "wooden",
  "thô": "coarse, rough",
  "kép": "double, twin",
  "nặng": "heavy, weight",
  "khổng lồ": "giant, massive",
  "xuyên giáp": "armor-piercing",
  "Thần sắt": "iron god",
  "Hỏa Long": "fiery red dragon, burning lava",
  "phá trời": "sky-cleaving",
  "chấn động đất": "earthquake",
  "Thần Thiên Mệnh": "divine holy destiny, glowing gold aura",
  "Thần Long": "sacred dragon, gold scales",
  "Diệt Quỷ": "demon-slaying",
  "Hủy Thế": "world-destroying",
  "trơn": "plain, simple",
  "da thô": "coarse leather",
  "da bò": "cowhide leather",
  "da gấu": "bearskin leather",
  "đế gỗ": "wooden sole",
  "chiến thép nhẹ": "light steel battle",
  "nạm đồng": "bronze-studded",
  "sừng bò": "cow horns",
  "sừng": "horned",
  "rừng sâu": "deep forest",
  "thép chắc chắn": "sturdy steel",
  "Đại Chiến Thần": "grand war god",
  "Bất tử": "immortal, deathless",
  "Vua Âm phủ": "underworld king, shadow skulls",
  "Thánh Vương": "holy saint king, golden wings",
  "Huyền Vũ Cổ đại": "ancient black tortoise",
  "Vương Miện": "crown",
  "Vương": "king",
  "Sao Thần Vương": "star king, cosmic stardust",
  "Trấn Địa Cổ đại": "ancient earthquake-tremor",
  "cuồng nộ": "furious, rage",
  "Bão": "storm",
  "Phá giáp": "armor-shredding",
  "Bá chủ": "overlord, supreme",
  "Khai Thiên Cổ đại": "ancient sky-opening",
  
  // Mage suffixes / extras
  "Staff": "wizard staff",
  "Staffs": "wizard staffs",
  "Slayer": "glowing purple slayer weapon",
  "Cosmic": "cosmic star",
  
  // Assassin extra modifiers
  "Sát Sứt Mẻ": "chipped, damaged",
  "Gỉ Sét": "rusty",
  "Lưỡi Kép Thép Sắc Bén": "sharp twin steel blades",
  "Kim Độc": "poison needle",
  "Săn Đêm": "night-hunting",
  "Trăng Máu": "crimson blood-moon",
  "Bóng Tối": "shadow, dark",
  "Linh Hồn": "soul, phantom",
  "Phong Ma": "demonic wind, purple smoke",
  "Thảm Họa": "disaster, cataclysm",
  "Mặt Thần": "divine god-eye",
  "Hư Không": "dark purple void",
  "Hắc Hoàng Đế": "black emperor, dark gold",
  "Người Đi Đêm": "nightstalker, shadow",
  "Nhiệt Đới": "tropical jungle",
  "Báo Băng": "frost leopard, ice blue",
  "Tàng Hình": "invisible, transparent shadow",
  "Khảm Bạc": "silver-plated",
  "Bóng Huyết": "crimson blood shadow",
  "Rắn Đêm": "night serpent",
  "Bóng Quỷ": "demon shadow",
  "Ngàn Năm": "thousand-year-old, ancient",
  "Bóng Ma Thần": "phantom god",
  "Vảy Rồng Đen": "black dragon scale",
  "Gai Bền": "sturdy spikes",
  "Trăm Bước Chân Nhẹ": "hundred-light-steps",
  "Ủng Tốc Độ Báo Gấm": "swift leopard boots",
  "Ám Sát": "assassination",
  "Bí Ẩn": "mysterious",
  "Bầu Trời Sao": "starry sky, cosmic",
  "Địa Ngục": "hellfire, inferno",
  "Đồng Trơn": "plain copper",
  "Đá Thô": "rough stone",
  "Sứt Mẻ": "chipped",
  "Khắc Biểu Tượng": "engraved symbol",
  "Mã Não": "onyx",
  "Ý Bạc": "silver-lined",
  "Ngọc Rắn Độc": "venomous snake jade",
  "Huyết Thạch Thật": "genuine bloodstone",
  "Tốc Độ Ánh Sáng": "lightspeed glowing",
  "Định Vị Mắt Quỷ": "demon eye finder",
  "Tinh Hoa": "essence",
  "Phước Lành Thần Thánh": "divine holy blessing",
  "Tối Cao": "supreme",
  "Hủy Diệt Thế Giới": "world-destroyer",
  "Vải Mỏng": "thin cloth",
  "Da Khảm Đồng": "bronze-plated leather",
  "Móng Vuốt Độc": "poison claws",
  "Tăng Tốc": "speed-up",
  "Móng Vuốt Quỷ": "demon claws",
  "Chết Chóc": "deadly",
  "Bàn Tay Thần Thánh Bàn Tay Thần": "divine god claws",
  "Bàn Tay Hủy Diệt Hư Không": "void destruction fist",
  "Bàn Tay Tàn Sát Huyết Thần": "blood god slaughter claws"
};

function getPrompt(cls, slot, rarity, name) {
  let translatedBase = '';
  for (const [key, val] of Object.entries(KEYWORDS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      translatedBase = val;
      break;
    }
  }
  
  let modifierList = [];
  for (const [key, val] of Object.entries(MODIFIERS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      modifierList.push(val);
    }
  }
  
  if (!translatedBase) {
    translatedBase = `${cls} ${slot}`;
  }

  // Adjust theme colors based on rarity
  let rarityTheme = "";
  if (rarity === "common") rarityTheme = "rustic steel bronze copper wood metal, ancient dull look";
  else if (rarity === "uncommon") rarityTheme = "polished steel iron silver metal, glowing magic blue runes";
  else if (rarity === "rare") rarityTheme = "glowing emerald green jade obsidian gold brass metal, magical green aura";
  else if (rarity === "epic") rarityTheme = "glowing fiery orange sapphire ruby crimson red crystal, radiant warm fire aura";
  else if (rarity === "legendary") rarityTheme = "glowing cosmic stardust galaxy violet purple gold, divine supreme stellar aura";

  const mods = modifierList.length > 0 ? modifierList.join(', ') + ', ' : '';
  const finalDesc = `${mods}${translatedBase}, ${rarityTheme}`;
  
  return `flat 2d game icon of a ${finalDesc}, rpg ${slot} asset, centered, crisp borders, isolated on solid white background, high details, premium vector graphic, no character, no human, no animal`;
}

function downloadPollinationsImage(prompt, destPath) {
  return new Promise((resolve, reject) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&model=flux&nologo=true`;
    
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`STATUS_${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('Scanning existing files in public/assets/items...');

  const classes = ["knight", "mage", "assassin"];
  const slots = ["weapon", "helmet", "armor", "boots", "ring", "gloves"];
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];

  const allItems = [];
  for (const cls of classes) {
    for (const slot of slots) {
      for (const rarity of rarities) {
        const names = ITEM_NAMES_DB[cls]?.[slot]?.[rarity] || [];
        names.forEach((name, idx) => {
          const templateId = getTemplateId(cls, slot, rarity, idx);
          const prompt = getPrompt(cls, slot, rarity, name);
          allItems.push({
            templateId,
            prompt,
            name,
            cls,
            slot,
            rarity
          });
        });
      }
    }
  }

  // Filter out already completed items
  const queue = allItems.filter(item => {
    const finalPath = path.join(targetDir, `${item.templateId}.png`);
    return !fs.existsSync(finalPath);
  });

  const totalItems = allItems.length;
  let completed = totalItems - queue.length;
  console.log(`Resuming queue: ${completed}/${totalItems} items already generated. ${queue.length} items remaining.`);

  // Sequential execution
  for (const item of queue) {
    console.log(`[${completed + 1}/${totalItems}] Generating ${item.templateId} (${item.name})...`);
    const tempPath = path.join(targetDir, `temp_${item.templateId}.png`);
    const finalPath = path.join(targetDir, `${item.templateId}.png`);

    let success = false;
    let attempts = 0;
    let backoffTime = 2000;

    while (!success && attempts < 3) {
      try {
        attempts++;
        await downloadPollinationsImage(item.prompt, tempPath);

        // Downscale to 64x64 using Jimp to ensure absolute sharp premium quality
        const jimpImg = await Jimp.read(tempPath);
        
        // Remove white background and make it transparent with smooth antialiased edges
        jimpImg.scan(0, 0, jimpImg.bitmap.width, jimpImg.bitmap.height, function (x, y, idx) {
          const r = this.bitmap.data[idx + 0];
          const g = this.bitmap.data[idx + 1];
          const b = this.bitmap.data[idx + 2];
          
          const whiteness = Math.min(r, g, b);
          const t1 = 200; // start blending at 200
          const t2 = 254; // fully transparent at 254
          
          if (whiteness > t1) {
            if (whiteness >= t2) {
              this.bitmap.data[idx + 3] = 0;
            } else {
              const alphaFactor = 1 - (whiteness - t1) / (t2 - t1);
              const newAlpha = Math.floor(alphaFactor * 255);
              this.bitmap.data[idx + 3] = newAlpha;
              
              const a = newAlpha / 255;
              if (a > 0) {
                this.bitmap.data[idx + 0] = Math.max(0, Math.min(255, Math.round((r - (1 - a) * 255) / a)));
                this.bitmap.data[idx + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - a) * 255) / a)));
                this.bitmap.data[idx + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - a) * 255) / a)));
              }
            }
          }
        });

        jimpImg.resize({ w: 64, h: 64 });
        await jimpImg.write(finalPath);

        // Delete temp
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        success = true;
      } catch (err) {
        console.error(`Attempt ${attempts} failed for ${item.templateId} (${item.name}): ${err.message}`);
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch(_) {}
        }
        if (attempts < 3) {
          await new Promise(r => setTimeout(r, backoffTime));
          backoffTime *= 2;
        }
      }
    }

    if (success) {
      completed++;
      console.log(`[${completed}/${totalItems}] Successfully saved: ${item.templateId}`);
      await new Promise(r => setTimeout(r, 500)); // Short delay
    } else {
      console.error(`Permanently failed to generate: ${item.templateId}`);
    }
  }
}

main().catch(console.error);
