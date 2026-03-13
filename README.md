# RecoilStrafeTrainer

RecoilStrafeTrainer 是一个基于 Electron、React 和 Vite 构建的 Windows 桌面训练工具，用于练习压枪节奏、横移方向提示和悬浮小窗辅助。

它支持原生全局键鼠监听、悬浮小窗、置顶、点击穿透、武器配置编辑，以及 Light / Dark 主题切换。

## 功能列表

- 全局键鼠监听，不依赖网页焦点
- 按住触发、松开停止、再次按下重新开始的一轮训练逻辑
- 自定义监听键，支持键盘按键和常见鼠标按键
- 悬浮小窗模式，支持置顶和点击穿透
- 武器新增、删除、编辑
- 拐点配置与横移节奏时间轴
- 配置导入 / 导出
- Light / Dark 双主题

## 直接下载使用

如果你只是想直接运行软件，不需要拉源码。

发布后可在这里下载：

- [GitHub Releases](https://github.com/oceancourier/RecoilStrafeTrainer/releases)

常见下载文件有两种：

### 1. Portable 单文件版

文件名类似：

```text
RecoilStrafeTrainer-x.x.x-x64.exe
```

说明：

- 下载后直接双击运行
- 不需要安装
- 适合大多数普通用户

### 2. 解压即用版

文件名类似：

```text
RecoilStrafeTrainer-x.x.x-x64-unpacked.zip
```

说明：

- 先解压压缩包
- 进入解压后的目录
- 双击其中的 `RecoilStrafeTrainer.exe` 运行

如果你更在意“下载一个文件直接用”，选 `portable exe`；如果你更希望保留完整程序目录，选 `unpacked zip`。

## 从源码运行 / 自己编译

如果你想自己修改功能、参与开发，或者自己重新打包，可以按下面的方式进行。

### 环境要求

- Windows
- Node.js 20 或更高版本
- npm

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
npm run dev
```

这会启动前端开发服务，并自动打开 Electron 桌面窗口。

### 构建前端资源

```bash
npm run build
```

### 本地启动 Electron

```bash
npm run start
```

### 生成 Windows 可分发版本

生成单文件 portable 版：

```bash
npm run dist:portable
```

生成解压即用版目录：

```bash
npm run dist:win
```

把解压目录打成 zip：

```bash
npm run dist:zip
```

生成的文件默认位于：

```text
release/
```

## 基本使用

### 1. 选择或编辑武器

- 在左侧选择当前武器
- 可以新增武器、删除武器
- 点击编辑后可修改名称、RPM、弹匣容量和拐点

### 2. 设置监听键

- 在控制区点击重新设置
- 按下你想作为触发键的键盘或鼠标按键

### 3. 开始训练

- 点击开始后进入监听状态
- 按下监听键时触发一轮提示
- 松开后停止
- 再次按下会重新开始一轮

### 4. 使用小窗

- 点击小窗进入悬浮模式
- 默认快捷键：
  - `F8`：退出小窗
  - `F7`：切换置顶
  - `F6`：切换点击穿透

## 配置导入导出

- 可以导出当前武器配置为 JSON
- 可以导入已有 JSON 配置
- 已存在的 `id` 会被覆盖，不存在的 `id` 会被追加

## 项目结构

```text
electron/
  main.mjs
  preload.mjs
  native-input.mjs

src/
  components/
  data.ts
  overlay.ts
  store.tsx
  theme.tsx

scripts/
  dev-electron.mjs
  package-win.mjs
```

## License

MIT
