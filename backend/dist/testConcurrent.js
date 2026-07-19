"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/testConcurrent.ts
const trySpend_1 = require("./trySpend");
async function main() {
    const userId = "064ab827-5a4e-44b2-9dc2-93e42d7aaec5"; // pass the user id as a command-line argument
    if (!userId) {
        console.log('Usage: npx tsx src/testConcurrent.ts <userId>');
        return;
    }
    // Fire 10 requests, all at once, each trying to spend $80 from a $100 balance.
    // Only ONE of these should ever succeed — the rest must fail cleanly.
    const attempts = Array.from({ length: 10 }, () => (0, trySpend_1.trySpend)(userId, 80));
    const results = await Promise.all(attempts);
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    console.log(`Succeeded: ${succeeded.length}`);
    console.log(`Failed (correctly rejected): ${failed.length}`);
    console.log('Final balance:', results[results.length - 1]?.balance);
}
main();
//# sourceMappingURL=testConcurrent.js.map