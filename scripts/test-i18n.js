/**
 * Automated i18n Dictionary & DOM Coverage Test (Việc 2)
 * Ensures 100% of data-i18n and data-i18n-placeholder attributes in index.html
 * have valid, non-empty translations in both 'vi' and 'en'.
 */

const fs = require("fs");
const path = require("path");

function runI18nTest() {
  console.log("🌐 Bắt đầu kiểm tra hệ thống đa ngôn ngữ (i18n)...");

  const indexPath = path.join(__dirname, "..", "client", "index.html");
  const i18nPath = path.join(__dirname, "..", "client", "i18n.js");

  const htmlContent = fs.readFileSync(indexPath, "utf8");
  const i18nContent = fs.readFileSync(i18nPath, "utf8");

  // Extract keys from index.html
  const textKeyRegex = /data-i18n=["']([^"']+)["']/g;
  const placeholderKeyRegex = /data-i18n-placeholder=["']([^"']+)["']/g;

  const foundTextKeys = new Set();
  const foundPlaceholderKeys = new Set();

  let match;
  while ((match = textKeyRegex.exec(htmlContent)) !== null) {
    foundTextKeys.add(match[1]);
  }
  while ((match = placeholderKeyRegex.exec(htmlContent)) !== null) {
    foundPlaceholderKeys.add(match[1]);
  }

  const allHtmlKeys = new Set([...foundTextKeys, ...foundPlaceholderKeys]);
  console.log(`  ✓ Tìm thấy ${foundTextKeys.size} khóa văn bản và ${foundPlaceholderKeys.size} khóa placeholder trong index.html (tổng: ${allHtmlKeys.size} khóa).`);

  // Mock a window/global object to evaluate i18n.js
  const mockGlobal = {};
  const evalFn = new Function("window", "localStorage", i18nContent);
  const mockLocalStorage = {
    getItem: () => null,
    setItem: () => {},
  };
  evalFn(mockGlobal, mockLocalStorage);

  if (typeof mockGlobal.t !== "function" || typeof mockGlobal.setLanguage !== "function") {
    console.error("  ❌ client/i18n.js không export hàm t() hoặc setLanguage()!");
    process.exit(1);
  }

  const languages = ["vi", "en"];
  let hasError = false;

  for (const lang of languages) {
    mockGlobal.setLanguage(lang);
    console.log(`\n  🔍 Kiểm tra bộ từ điển [${lang.toUpperCase()}]:`);

    for (const key of allHtmlKeys) {
      const translation = mockGlobal.t(key);
      if (!translation || translation === key) {
        console.error(`  ❌ Thiếu bản dịch cho khóa "${key}" ở ngôn ngữ [${lang}]!`);
        hasError = true;
      }
    }

    if (!hasError) {
      console.log(`  ✓ Toàn bộ ${allHtmlKeys.size} khóa đều có bản dịch hợp lệ trong [${lang}].`);
    }
  }

  // Check toggleLanguage
  mockGlobal.setLanguage("vi");
  const switchedToEn = mockGlobal.toggleLanguage();
  if (switchedToEn !== "en" || mockGlobal.getLanguage() !== "en") {
    console.error("  ❌ toggleLanguage() không chuyển sang en đúng cách!");
    hasError = true;
  }
  const switchedBackToVi = mockGlobal.toggleLanguage();
  if (switchedBackToVi !== "vi" || mockGlobal.getLanguage() !== "vi") {
    console.error("  ❌ toggleLanguage() không chuyển về vi đúng cách!");
    hasError = true;
  }
  console.log("  ✓ Cơ chế toggleLanguage() hoạt động chuẩn xác (vi <-> en).");

  if (hasError) {
    console.error("\n❌ KIỂM TRA I18N THẤT BẠI: Phát hiện khóa thiếu!");
    process.exit(1);
  }

  console.log("\n🎉 KIỂM TRA I18N HOÀN TOÀN XANH! 100% KHÓA ĐƯỢC ĐỒNG BỘ.\n");
}

if (require.main === module) {
  runI18nTest();
}

module.exports = { runI18nTest };
