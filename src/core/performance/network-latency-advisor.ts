import axios from 'axios';

export const performLiveLatencyAudit = async (url: string) => {
    const startTime = Date.now(); 

    try {
        const response = await axios.get(url); 
        const endTime = Date.now();
        const requestTimeMs = endTime - startTime; 
        const contentLength = response.headers['content-length'];
        const payloadSizeKb = contentLength 
            ? parseInt(contentLength) / 1024 
            : Buffer.byteLength(JSON.stringify(response.data)) / 1024;
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

export const analyzeLatency = (requestTimeMs: number, payloadSizeKb: number) => {
    const reports = [];

    if (payloadSizeKb > 14) { 
        reports.push('تحذير: حجم الاستجابة الأولى يتجاوز 14KB. هذا سيسبب رحلة إضافية (Round Trip) بناءً على قيود TCP.');
    }

    if (requestTimeMs > 300) { 
        reports.push('تنبيه: التأخير يتجاوز 300ms. الـ Interaction أصبح بطيئاً (Sluggish) من منظور المستخدم.');
    }

    return {
        isOptimized: reports.length === 0,
        reports
    };
};