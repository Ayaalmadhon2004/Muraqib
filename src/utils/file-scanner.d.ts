/**
 * FileScanner: أداة مركزية لقراءة ملفات المشروع والبحث فيها.
 * الهدف: منع تكرار كود قراءة الملفات واستخدام الـ glob عبر أدوات الفحص المختلفة.
 */
export interface ScannedFile {
    path: string;
    relativePath: string;
    content: string;
}
export declare function scanProjectFiles(targetPath: string, fileExtensions?: string[]): ScannedFile[];
//# sourceMappingURL=file-scanner.d.ts.map