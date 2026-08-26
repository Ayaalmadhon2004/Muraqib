// @ts-ignore
// 👆 قمنا بتعطيل فحص الأنواع لهذا السطر فقط لأن الحزمة مكسورة داخلياً، مع الحفاظ على الـ import المتوافق مع Node.js 22
import cronParser from 'cron-parser';
export function isWithinSchedule(scheduleString) {
    if (!scheduleString || scheduleString.trim() === '') {
        return true;
    }
    const now = new Date();
    const currentDay = now.getDay();
    if (scheduleString.toLowerCase() === 'on weekends') {
        return currentDay === 5 || currentDay === 6 || currentDay === 0;
    }
    try {
        // استدعاء الدالة مباشرة من الحزمة المستوردة
        const interval = cronParser.parseExpression(scheduleString);
        const prevExecution = interval.prev().toDate();
        const diffInMinutes = Math.abs(now.getTime() - prevExecution.getTime()) / (1000 * 60);
        if (diffInMinutes <= 60) {
            return true;
        }
        return false;
    }
    catch (error) {
        console.warn(`⚠️  [Muraqib Schedule]: Invalid cron expression [${scheduleString}]. Defaulting to run immediately.`);
        return true;
    }
}
//# sourceMappingURL=schedule-validator.js.map