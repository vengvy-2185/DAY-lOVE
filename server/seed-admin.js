require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("./src/config/prisma");

async function main() {
    const phone = "015448174"; // 📱 លេខទូរស័ព្ទ Admin របស់អ្នក (អាចដូរបាន)
    const plainCode = "2185506206";  // 🔑 លេខកូដ Login Code (អាចដូរបាន)

    // 1. Hash លេខកូដ
    const codeHash = await bcrypt.hash(plainCode, 10);

    // 2. បង្កើត ឬ Upate គណនី Admin
    const admin = await prisma.user.upsert({
        where: { phone },
        update: { approved: true, isAdmin: true, disabled: false },
        create: {
            phone,
            name: "Super Admin",
            approved: true,
            isAdmin: true,
            disabled: false,
        },
    });

    // 3. បង្កើត Login Code សម្រាប់ Admin (ផុតកំណត់ក្នុងរយៈពេល ៣០ ថ្ងៃ)
    await prisma.loginCode.create({
        data: {
            userId: admin.id,
            codeHash: codeHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            used: false,
        },
    });

    console.log("-----------------------------------------");
    console.log("✅ បង្កើត Admin ជោគជ័យហើយ!");
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 One-Time Code: ${plainCode}`);
    console.log("-----------------------------------------");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());