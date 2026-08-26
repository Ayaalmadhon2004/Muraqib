import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/app/page.tsx
// ❌ خطأ 1: استيراد مكتبة لوداش كاملة (سيطلق تحذير الـ 14KB Budget)
import _ from 'lodash';
import lodash from 'lodash';
// ❌ خطأ 2: استيراد كل أيقونات MUI دفعة واحدة (سيطلق تحذير تدمير البندل)
import * as Icons from '@mui/icons-material';
export default function Page() {
    // محاكاة لمكون يحتوي على كلمات ثقيلة أيضاً للتفتيش المبدئي
    return (_jsxs("div", { children: [_jsx("h1", { children: "Gaza Pulse Dashboard" }), _jsx(Comments, {}), _jsx(Map, {})] }));
}
//# sourceMappingURL=page.js.map