function ensureSynchronous(value, errorMessage) {
    if (value instanceof Promise || (value && typeof value.then === "function")) {
        throw new Error(errorMessage);
    }
    return value;
}
export function parseWithDictionary(dictionary, value) {
    const result = {};
    const issues = [];
    for (const key in dictionary) {
        if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
            const schema = dictionary[key];
            if (!schema) {
                continue;
            }
            const propResult = schema["~standard"].validate(value[key]);
            const syncResult = ensureSynchronous(propResult, `Validation must be synchronous, but \`${key}\` returned a Promise.`);
            if (syncResult.issues) {
                const mappedIssues = syncResult.issues.map((issue) => ({
                    ...issue,
                    path: issue.path ? [key, ...issue.path] : [key],
                }));
                issues.push(...mappedIssues);
            }
            else {
                result[key] = syncResult.value;
            }
        }
    }
    if (issues.length > 0) {
        return { issues };
    }
    return { value: result };
}
//# sourceMappingURL=parser.js.map