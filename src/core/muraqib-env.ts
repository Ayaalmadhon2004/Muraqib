import { isString } from '@sindresorhus/is'; // مكتبة الفحص النظيف اللي مستخدمها Renovate

export type EnvUpdateStrategy = 'replace' | 'keep-both' | 'merge';

export interface NewEnvConfig {
  currentValue: string;          // القيمة القديمة من ملف الـ .env الحالي
  newValue: string;              // القيمة الجديدة المراد تحديثها
  updateStrategy: EnvUpdateStrategy; // الاستراتيجية المختارة للتحديث
  secretKey: string;             // اسم المتغير (مثال: DATABASE_URL)
}

/**
 * دالة Muraqib لتطهير وصياغة قيم متغيرات البيئة بناءً على استراتيجيات هندسية مرنة
 */
export function getNewEnvValue({
  currentValue,
  newValue,
  updateStrategy,
  secretKey,
}: NewEnvConfig): string | null {
  
  // 1️⃣ تطهير المدخلات (Sanitization) من الفراغات وعلامات التنصيص الزائدة
  const cleanCurrent = currentValue ? currentValue.trim().replace(/^["']|["']$/g, '') : '';
  const cleanNew = newValue ? newValue.trim().replace(/^["']|["']$/g, '') : '';

  // صمام أمان: لحماية المطور، إذا كانت القيمة الجديدة فارغة لا نعدل شيئاً
  if (!cleanNew) {
    return currentValue;
  }

  // إذا كانت القيم متطابقة تماماً، نرجع نفس القيمة دون تعديل
  if (cleanCurrent === cleanNew) {
    return currentValue;
  }

  // 2️⃣ تنفيذ الـ Strategy Pattern بناءً على اختيار المطور وقت الـ Runtime
  switch (updateStrategy) {
    
    // استراتيجية الاستبدال الصريح والفوري
    case 'replace':
      return cleanNew;

    // استراتيجية التوسيع والحفاظ على القيمتين معاً كـ Fallback (Widen Strategy)
    case 'keep-both':
      return `"${cleanCurrent}" || "${cleanNew}"`;

    // استراتيجية الدمج الذكي للبيانات (مثل دمج المصفوفات أو الروابط المكملة)
    case 'merge':
      if (cleanCurrent.includes(',') || cleanNew.includes(',')) {
        // ندمج القيم ونحذف المكرر باستخدام Set لضمان نظافة الداتا
        const uniqueValues = Array.from(new Set([...cleanCurrent.split(','), ...cleanNew.split(',')]));
        return uniqueValues.filter(isString).join(',');
      }
      return `${cleanCurrent};${cleanNew}`;

    default:
      return cleanNew;
  }
}