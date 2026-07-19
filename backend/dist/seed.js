"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.create({
        data: { email: `test@example.com`, cashBalance: "100" },
    });
    console.log('Created user with $100 balance. ID:', user.id);
}
main().finally(() => prisma.$disconnect());
// 064ab827-5a4e-44b2-9dc2-93e42d7aaec5
//# sourceMappingURL=seed.js.map