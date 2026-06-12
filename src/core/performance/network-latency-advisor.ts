import axios from 'axios';

/**
 * 🚀 أولاً: الدالة الجديدة (المحرك الفعلي الذي يقيس ويحسب أرقام الشبكة الحية)
 */
export const performLiveLatencyAudit = async (url: string) => {
    const startTime = Date.now(); // تسجيل وقت الانطلاق

    try {
        // إطلاق طلب شبكة حقيقي لقراءة البيانات
        const response = await axios.get(url);

        const endTime = Date.now();
        const requestTimeMs = endTime - startTime; // حساب الـ Latency الفعلي

        // حساب الـ Payload الفعلي من الـ Response Headers
        const contentLength = response.headers['content-length'];
        const payloadSizeKb = contentLength 
            ? parseInt(contentLength) / 1024 
            : Buffer.byteLength(JSON.stringify(response.data)) / 1024;

        // 👇 هنا نقوم بتمرير القياسات الحقيقية لدالتكِ الأصلية بالأسفل!
        const auditResult = analyzeLatency(requestTimeMs, payloadSizeKb);

        console.log(`\n🌐 [Muraqib Network Audit] Results for: ${url}`);
        console.log(`⏱️ Real Latency Measured: ${requestTimeMs}ms`);
        console.log(`📦 Real Payload Size: ${payloadSizeKb.toFixed(2)}KB`);
        
        if (!auditResult.isOptimized) {
            auditResult.reports.forEach(report => console.warn(`⚠️ ${report}`));
        } else {
            console.log("✅ [Muraqib]: Target URL is highly optimized and fast!");
        }

        return auditResult;

    } catch (error) {
        console.error(`❌ [Muraqib Audit Error]: Failed to fetch or measure the URL: ${url}`);
        return { isOptimized: false, reports: ["خطأ في الاتصال بالشبكة أو الرابط غير صالح."] };
    }
};

/**
 * 🛠️ ثانياً: كودكِ الأصلي (مختبر التحليل واتخاذ القرار وإصدار التحذيرات)
 */
export const analyzeLatency = (requestTimeMs: number, payloadSizeKb: number) => {
    const reports = [];

    // فحص الـ Payload اللي حسبته الدالة الأولى
    if (payloadSizeKb > 14) { 
        reports.push('تحذير: حجم الاستجابة الأولى يتجاوز 14KB. هذا سيسبب رحلة إضافية (Round Trip) بناءً على قيود TCP.');
    }

    // فحص الـ Latency اللي حسبته الدالة الأولى
    if (requestTimeMs > 300) { 
        reports.push('تنبيه: التأخير يتجاوز 300ms. الـ Interaction أصبح بطيئاً (Sluggish) من منظور المستخدم.');
    }

    return {
        isOptimized: reports.length === 0,
        reports
    };
};