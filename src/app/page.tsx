// src/app/page.tsx

// ❌ خطأ 1: استيراد مكتبة لوداش كاملة (سيطلق تحذير الـ 14KB Budget)
import _ from 'lodash';
import lodash from 'lodash';

// ❌ خطأ 2: استيراد كل أيقونات MUI دفعة واحدة (سيطلق تحذير تدمير البندل)
import * as Icons from '@mui/icons-material';

export default function Page() {
    // محاكاة لمكون يحتوي على كلمات ثقيلة أيضاً للتفتيش المبدئي
    return (
        <div>
            <h1>Gaza Pulse Dashboard</h1>
            <Comments />
            <Map />
        </div>
    );
}