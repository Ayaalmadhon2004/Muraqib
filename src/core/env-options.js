const muraqibOptions = [
    { name: "dbUrl", type: "string", isSensitive: true },
    { name: "allowEmpty", type: "boolean", isSensitive: false },
    { name: "serverPort", type: "number", isSensitive: false },
];
function toEnvKey(optionName) {
    return `MURAQIB_${optionName.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
}
export function getMuraqibEnvMap() {
    const map = {};
    for (const option of muraqibOptions) {
        map[toEnvKey(option.name)] = {
            configName: option.name,
            type: option.type,
            isSensitive: option.isSensitive,
        };
    }
    return map;
}
export function getSensitiveMuraqibEnvKeys() {
    return Object.entries(getMuraqibEnvMap())
        .filter(([, info]) => info.isSensitive)
        .map(([envKey]) => envKey);
}
//# sourceMappingURL=env-options.js.map