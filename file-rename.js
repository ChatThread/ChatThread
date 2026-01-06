const fs = require("fs");
const path = require("path");
const _ = require("lodash");

// 检查是否提供了目录参数
if (process.argv.length < 3) {
  console.error("请提供目录路径作为参数");
  process.exit(1);
}

const directoryPath = process.argv[2];

// 检查目录是否存在
if (!fs.existsSync(directoryPath)) {
  console.error("提供的目录路径不存在");
  process.exit(1);
}

try {
  // 读取目录内容
  const files = fs.readdirSync(directoryPath);

  // 使用 lodash 将文件名转换为 kebab-case
  const kebabCaseNames = files.map((fileName) => {
    // 移除文件扩展名，转换文件名，然后重新添加扩展名
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    return _.kebabCase(nameWithoutExt) + ext;
  });

  // 输出结果
  console.log("转换后的文件名：");
  kebabCaseNames.forEach((name) => console.log(name));
} catch (error) {
  console.error("处理文件时发生错误：", error.message);
  process.exit(1);
}