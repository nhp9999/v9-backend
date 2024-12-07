const bcrypt = require('bcryptjs');

async function generateHash() {
    const passwords = ['admin123', 'staff123'];
    
    for (const password of passwords) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log(`Password: ${password} => Hash: ${hash}`);
    }
}

generateHash(); 