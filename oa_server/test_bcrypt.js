const bcrypt = require('bcryptjs');

const hash = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi';
const candidates = ['123456', '123456'];

async function test() {
  for (const plain of candidates) {
    const isMatch = await bcrypt.compare(plain, hash);
    console.log(`密文密码与明文 '${plain}' 是否匹配:`, isMatch);
  }
}

test();
