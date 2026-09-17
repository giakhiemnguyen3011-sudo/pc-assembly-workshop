# 🖥️ PC Assembly Workshop — Xưởng Lắp Ráp PC 3D

Tính năng FPS trong xưởng lắp ráp: đi nhặt linh kiện, cất vào túi đồ, chuẩn bị cho bước lắp vào thùng máy trống theo trình tự.

## 🎮 Điều khiển (đúng yêu cầu)

| Phím | Chức năng |
|---|---|
| `W A S D` / `← ↑ ↓ →` | Di chuyển quanh xưởng |
| `Chuột` (Pointer Lock) | Xoay camera / góc nhìn |
| `Click trái` | Nhặt vật phẩm khi crosshair `(+)` chỉ vào |
| `Click phải` | Cất vật đang cầm vào túi đồ |
| `E` | Mở / đóng túi đồ |
| `Shift` | Chạy nhanh |

## 🧱 Có gì trong scene

- Phòng xưởng 16×12m: sàn tile, tường, đèn neon, đèn trần, poster.
- Bàn workbench + **thùng máy trống** (khung open-case, chờ lắp ở bước sau).
- 6 bục linh kiện phát sáng, xoay lơ lửng + bảng tên:
  `CPU AMD Ryzen` (model thật `cpu.glb`), `Mainboard` (model thật `motherboard.glb`),
  `RAM Corsair RGB`, `SSD Samsung`, `Nguồn PSU`, `Tản nhiệt CPU`.
- Player = `THREE.Group` + `Capsule` bán trong suốt (vật thể đại diện) + `Camera` gắn trong `pitchHolder`.
  Chuột thay đổi `yaw` (player.rotation.y) và `pitch` (pitchHolder.rotation.x).
- Crosshair raycast trung tâm màn hình, highlight + prompt khi dí vào đồ (< 3.4m).
- Đồ đang cầm gắn vào camera (góc phải-dưới như game FPS).
- Túi đồ (Inventory): mảng JS + UI overlay, nút `Cầm lên` để lấy ra tay lại.

## 🚀 Chạy local

```bash
cd "D:/Crafter 3d/pc-assembly-workshop"
npm install
npm run dev      # mở http://localhost:5173
npm run build    # build ra dist/
```

## 📦 Model 3D Sketchfab

File `.glb` nhẹ đã copy vào `public/models/`:
- `cpu.glb` ← `Computer Hardware/amd-ryzen-7-5700x3d/source/cpu.glb`
- `motherboard.glb` ← `Computer Hardware/motherboard/source/motherboard.glb`

Muốn thêm model khác: convert `.fbx/.obj/.blend` → `.glb` (dùng Blender export),
bỏ vào `public/models/`, rồi thêm entry trong `PARTS` ở `src/main.js`.

## ⬆️ Upload GitHub (làm 1 lần)

```bash
cd "D:/Crafter 3d/pc-assembly-workshop"
git init
git add .
git commit -m "feat: workshop 3D + FPS pickup + inventory"
git branch -M main
git remote add origin https://github.com/<ten-ban>/<ten-repo>.git
git push -u origin main
```

## ▲ Deploy Vercel (2 cách)

**Cách 1 — Vercel Dashboard (khuyên dùng):**
1. Vào https://vercel.com/new, Import repo GitHub vừa push.
2. Framework Preset: `Vite`. Build Command: `npm run build`. Output: `dist`.
3. Bấm Deploy — xong, có URL `https://<repo>.vercel.app`.

**Cách 2 — Vercel CLI:**
```bash
npm i -g vercel
cd "D:/Crafter 3d/pc-assembly-workshop"
vercel        # lần đầu link project
vercel --prod # deploy production
```

File `vercel.json` đã cấu hình sẵn (`buildCommand`, `outputDirectory=dist`, framework vite).

## 🗺️ Bước tiếp theo (khi bạn sẵn sàng)

- [ ] Lắp linh kiện vào thùng máy theo trình tự (Mainboard → CPU → Cooler → RAM → SSD → PSU), snap vào đúng socket + kiểm tra đúng/sai thứ tự.
- [ ] Thanh tiến trình lắp ráp + lưu progress vào localStorage.
- [ ] Thêm âm thanh nhặt/cất, minimap, mobile joystick.
