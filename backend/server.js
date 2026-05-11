const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_VK_ID = Number(process.env.ADMIN_VK_ID || 0);
const dataRoot = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : __dirname;
const uploadsDir = path.join(dataRoot, "uploads");
const dbPath = path.join(dataRoot, "dormswap.db");
const frontendBuildDir = path.join(__dirname, "..", "build");

if (!fs.existsSync(dataRoot)) {
  fs.mkdirSync(dataRoot, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const db = new sqlite3.Database(dbPath);

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getVkUserId(req) {
  return String(req.body?.vk_user_id ?? req.query?.vk_user_id ?? "").trim();
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function isAdmin(vkUserId) {
  return Boolean(ADMIN_VK_ID) && Number(vkUserId) === ADMIN_VK_ID;
}

function buildProfileUrl(vkUserId) {
  return vkUserId ? `https://vk.com/id${vkUserId}` : null;
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    vkUserId: row.vk_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
    phone: row.phone,
    dorm: row.dorm,
    room: row.room,
    status: row.status,
    photoPath: row.photo_path,
    vkAvatar: row.vk_avatar,
    blockReason: row.block_reason,
    declineReason: row.decline_reason,
    profileUrl: buildProfileUrl(row.vk_user_id),
  };
}

function mapListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    price: row.price,
    category: row.category || "Другое",
    status: row.status,
    createdAt: row.created_at,
    images: safeParseJson(row.images, []),
    seller: {
      id: row.user_id,
      vkUserId: row.seller_vk_user_id,
      name:
        row.seller_name ||
        [row.seller_first_name, row.seller_last_name].filter(Boolean).join(" ") ||
        "Пользователь",
      phone: row.seller_phone,
      dorm: row.seller_dorm,
      room: row.seller_room,
      profileUrl: buildProfileUrl(row.seller_vk_user_id),
      avatar: row.seller_vk_avatar,
    },
  };
}

async function requireKnownUser(req, res, next) {
  try {
    const vkUserId = getVkUserId(req);

    if (!vkUserId) {
      res.status(400).json({ error: "Missing vk_user_id" });
      return;
    }

    const user = await dbGet("SELECT * FROM users WHERE vk_user_id = ?", [vkUserId]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.status === "blocked") {
      res.status(403).json({
        error: "User blocked",
        blockReason: user.block_reason || "Администратор ограничил доступ.",
      });
      return;
    }

    req.appUser = user;
    next();
  } catch (error) {
    console.error("requireKnownUser error:", error);
    res.status(500).json({ error: "DB error" });
  }
}

async function requireAdmin(req, res, next) {
  const vkUserId = getVkUserId(req);

  if (!vkUserId) {
    res.status(400).json({ error: "Missing vk_user_id" });
    return;
  }

  if (!isAdmin(vkUserId)) {
    res.status(403).json({ error: "Not admin" });
    return;
  }

  next();
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vk_user_id INTEGER UNIQUE,
      first_name TEXT,
      last_name TEXT,
      full_name TEXT,
      phone TEXT,
      dorm TEXT,
      room TEXT,
      photo_path TEXT,
      vk_avatar TEXT,
      status TEXT DEFAULT 'pending',
      block_reason TEXT,
      decline_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      price TEXT,
      images TEXT DEFAULT '[]',
      category TEXT DEFAULT 'Другое',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  const userColumns = [
    "ALTER TABLE users ADD COLUMN vk_user_id INTEGER",
    "ALTER TABLE users ADD COLUMN first_name TEXT",
    "ALTER TABLE users ADD COLUMN last_name TEXT",
    "ALTER TABLE users ADD COLUMN full_name TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT",
    "ALTER TABLE users ADD COLUMN room TEXT",
    "ALTER TABLE users ADD COLUMN vk_avatar TEXT",
    "ALTER TABLE users ADD COLUMN created_at TEXT",
  ];

  const listingColumns = [
    "ALTER TABLE listings ADD COLUMN category TEXT DEFAULT 'Другое'",
    "ALTER TABLE listings ADD COLUMN created_at TEXT",
  ];

  [...userColumns, ...listingColumns].forEach((sql) => {
    db.run(sql, (error) => {
      if (error && !String(error.message).includes("duplicate column name")) {
        console.error("Schema migration error:", error.message);
      }
    });
  });

  db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_vk_user_id ON users(vk_user_id)");
  db.run("UPDATE users SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)");
  db.run("UPDATE listings SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)");
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    adminConfigured: Boolean(ADMIN_VK_ID),
  });
});

app.post("/api/register", upload.single("studentPassPhoto"), async (req, res) => {
  try {
    const vkUserId = getVkUserId(req);
    const firstName = normalizeString(req.body.first_name);
    const lastName = normalizeString(req.body.last_name);
    const fullName = normalizeString(req.body.full_name) || [firstName, lastName].filter(Boolean).join(" ");
    const phone = normalizeString(req.body.phone);
    const dorm = normalizeString(req.body.dorm);
    const room = normalizeString(req.body.room);
    const vkAvatar = normalizeString(req.body.vk_avatar);
    const photoPath = req.file ? `uploads/${path.basename(req.file.path)}` : null;

    if (!vkUserId) {
      res.status(400).json({ error: "Missing vk_user_id" });
      return;
    }

    const existingUser = await dbGet("SELECT * FROM users WHERE vk_user_id = ?", [vkUserId]);
    const nextStatus = isAdmin(vkUserId) ? "approved" : "pending";

    if (existingUser?.status === "blocked") {
      res.status(403).json({
        error: "User blocked",
        blockReason: existingUser.block_reason || "Администратор ограничил доступ.",
      });
      return;
    }

    if (!phone || !dorm || !photoPath) {
      if (existingUser) {
        res.json({
          message: "Профиль уже существует",
          ...mapUser(existingUser),
          isAdmin: isAdmin(vkUserId),
        });
        return;
      }

      res.status(400).json({
        error: "Missing fields",
        details: "Нужны телефон, общежитие и фото пропуска.",
      });
      return;
    }

    if (existingUser) {
      await dbRun(
        `
          UPDATE users
          SET first_name = ?,
              last_name = ?,
              full_name = ?,
              phone = ?,
              dorm = ?,
              room = ?,
              photo_path = ?,
              vk_avatar = ?,
              status = ?,
              decline_reason = NULL
          WHERE vk_user_id = ?
        `,
        [
          firstName || existingUser.first_name,
          lastName || existingUser.last_name,
          fullName || existingUser.full_name,
          phone,
          dorm,
          room,
          photoPath,
          vkAvatar || existingUser.vk_avatar,
          nextStatus,
          vkUserId,
        ]
      );

      const updatedUser = await dbGet("SELECT * FROM users WHERE vk_user_id = ?", [vkUserId]);
      res.json({
        message: existingUser.status === "declined" ? "Заявка отправлена повторно" : "Данные обновлены",
        ...mapUser(updatedUser),
        isAdmin: isAdmin(vkUserId),
      });
      return;
    }

    const result = await dbRun(
      `
        INSERT INTO users (
          vk_user_id,
          first_name,
          last_name,
          full_name,
          phone,
          dorm,
          room,
          photo_path,
          vk_avatar,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [vkUserId, firstName, lastName, fullName, phone, dorm, room, photoPath, vkAvatar, nextStatus]
    );

    const createdUser = await dbGet("SELECT * FROM users WHERE id = ?", [result.lastID]);
    res.json({
      message: nextStatus === "approved" ? "Профиль подтверждён автоматически" : "Заявка отправлена на модерацию",
      ...mapUser(createdUser),
      isAdmin: isAdmin(vkUserId),
    });
  } catch (error) {
    console.error("register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.get("/api/user_status", async (req, res) => {
  try {
    const vkUserId = getVkUserId(req);

    if (!vkUserId) {
      res.status(400).json({ error: "Missing vk_user_id" });
      return;
    }

    const user = await dbGet("SELECT * FROM users WHERE vk_user_id = ?", [vkUserId]);

    if (!user) {
      res.json({
        status: "not_registered",
        isAdmin: isAdmin(vkUserId),
      });
      return;
    }

    res.json({
      ...mapUser(user),
      isAdmin: isAdmin(vkUserId),
    });
  } catch (error) {
    console.error("user_status error:", error);
    res.status(500).json({ error: "DB error" });
  }
});

app.post("/api/listings", requireKnownUser, upload.array("photos", 4), async (req, res) => {
  try {
    if (req.appUser.status !== "approved") {
      res.status(403).json({ error: "Not approved" });
      return;
    }

    const title = normalizeString(req.body.title);
    const description = normalizeString(req.body.description);
    const type = normalizeString(req.body.type) || "Продать";
    const price = normalizeString(req.body.price);
    const category = normalizeString(req.body.category) || "Другое";
    const photos = req.files ? req.files.map((file) => `uploads/${path.basename(file.path)}`) : [];

    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required" });
      return;
    }

    const listingStatus = isAdmin(req.appUser.vk_user_id) ? "approved" : "pending";
    const result = await dbRun(
      `
        INSERT INTO listings (user_id, title, description, type, price, images, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [req.appUser.id, title, description, type, price, JSON.stringify(photos), category, listingStatus]
    );

    res.json({
      message:
        listingStatus === "approved"
          ? "Объявление опубликовано"
          : "Объявление отправлено на модерацию",
      listingId: result.lastID,
    });
  } catch (error) {
    console.error("create listing error:", error);
    res.status(500).json({ error: "Listing creation failed" });
  }
});

app.get("/api/listings", requireKnownUser, async (req, res) => {
  try {
    if (req.appUser.status !== "approved") {
      res.status(403).json({ error: "Only approved users can view listings" });
      return;
    }

    const filters = [];
    const params = [];
    const search = normalizeString(req.query.search);
    const type = normalizeString(req.query.type);
    const category = normalizeString(req.query.category);
    const onlyDorm = normalizeString(req.query.onlyDorm) === "1";

    if (search) {
      filters.push("(l.title LIKE ? OR l.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== "all") {
      filters.push("l.type = ?");
      params.push(type);
    }

    if (category && category !== "all") {
      filters.push("l.category = ?");
      params.push(category);
    }

    if (onlyDorm && req.appUser.dorm) {
      filters.push("u.dorm = ?");
      params.push(req.appUser.dorm);
    }

    const whereClause = filters.length ? ` AND ${filters.join(" AND ")}` : "";

    const rows = await dbAll(
      `
        SELECT
          l.id,
          l.user_id,
          l.title,
          l.description,
          l.type,
          l.price,
          l.images,
          l.category,
          l.status,
          l.created_at,
          u.vk_user_id AS seller_vk_user_id,
          u.first_name AS seller_first_name,
          u.last_name AS seller_last_name,
          u.full_name AS seller_name,
          u.phone AS seller_phone,
          u.dorm AS seller_dorm,
          u.room AS seller_room,
          u.vk_avatar AS seller_vk_avatar
        FROM listings l
        JOIN users u ON u.id = l.user_id
        WHERE l.status = 'approved'
          AND u.status = 'approved'
          ${whereClause}
        ORDER BY l.created_at DESC, l.id DESC
      `,
      params
    );

    res.json(rows.map(mapListing));
  } catch (error) {
    console.error("listings error:", error);
    res.status(500).json({ error: "Listing fetch failed" });
  }
});

app.delete("/api/listings/:id", requireKnownUser, async (req, res) => {
  try {
    const listing = await dbGet("SELECT * FROM listings WHERE id = ?", [req.params.id]);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const userOwnsListing = Number(listing.user_id) === Number(req.appUser.id);
    const userIsAdmin = isAdmin(req.appUser.vk_user_id);

    if (!userOwnsListing && !userIsAdmin) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await dbRun("DELETE FROM listings WHERE id = ?", [req.params.id]);
    res.json({ message: "Объявление удалено" });
  } catch (error) {
    console.error("delete listing error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

const adminRouter = express.Router();

adminRouter.use(requireAdmin);

adminRouter.get("/pending", async (_req, res) => {
  try {
    const rows = await dbAll(
      "SELECT * FROM users WHERE status = 'pending' ORDER BY created_at ASC, id ASC"
    );
    res.json(rows.map(mapUser));
  } catch (error) {
    console.error("pending users error:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

adminRouter.post("/approve/:id", async (req, res) => {
  try {
    await dbRun(
      "UPDATE users SET status = 'approved', decline_reason = NULL, block_reason = NULL WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Пользователь подтверждён" });
  } catch (error) {
    console.error("approve user error:", error);
    res.status(500).json({ error: "Approve failed" });
  }
});

adminRouter.post("/decline/:id", async (req, res) => {
  try {
    const reason = normalizeString(req.body.reason) || "Заявка отклонена администратором.";
    await dbRun("UPDATE users SET status = 'declined', decline_reason = ? WHERE id = ?", [
      reason,
      req.params.id,
    ]);
    res.json({ message: "Пользователь отклонён" });
  } catch (error) {
    console.error("decline user error:", error);
    res.status(500).json({ error: "Decline failed" });
  }
});

adminRouter.post("/block_user/:id", async (req, res) => {
  try {
    const reason = normalizeString(req.body.reason) || "Пользователь заблокирован администратором.";
    await dbRun("UPDATE users SET status = 'blocked', block_reason = ? WHERE id = ?", [
      reason,
      req.params.id,
    ]);
    res.json({ message: "Пользователь заблокирован" });
  } catch (error) {
    console.error("block user error:", error);
    res.status(500).json({ error: "Block failed" });
  }
});

adminRouter.post("/unblock_user/:id", async (req, res) => {
  try {
    await dbRun(
      "UPDATE users SET status = 'approved', block_reason = NULL, decline_reason = NULL WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Пользователь разблокирован" });
  } catch (error) {
    console.error("unblock user error:", error);
    res.status(500).json({ error: "Unblock failed" });
  }
});

adminRouter.get("/all_users", async (_req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM users ORDER BY created_at DESC, id DESC");
    res.json(rows.map(mapUser));
  } catch (error) {
    console.error("all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

adminRouter.get("/pending_listings", async (_req, res) => {
  try {
    const rows = await dbAll(
      `
        SELECT
          l.id,
          l.user_id,
          l.title,
          l.description,
          l.type,
          l.price,
          l.images,
          l.category,
          l.status,
          l.created_at,
          u.vk_user_id AS seller_vk_user_id,
          u.first_name AS seller_first_name,
          u.last_name AS seller_last_name,
          u.full_name AS seller_name,
          u.phone AS seller_phone,
          u.dorm AS seller_dorm,
          u.room AS seller_room,
          u.vk_avatar AS seller_vk_avatar
        FROM listings l
        JOIN users u ON u.id = l.user_id
        WHERE l.status = 'pending'
        ORDER BY l.created_at ASC, l.id ASC
      `
    );

    res.json(rows.map(mapListing));
  } catch (error) {
    console.error("pending listings error:", error);
    res.status(500).json({ error: "Failed to fetch pending listings" });
  }
});

adminRouter.post("/approve_listing/:id", async (req, res) => {
  try {
    await dbRun("UPDATE listings SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ message: "Объявление подтверждено" });
  } catch (error) {
    console.error("approve listing error:", error);
    res.status(500).json({ error: "Approve listing failed" });
  }
});

adminRouter.post("/delete_listing/:id", async (req, res) => {
  try {
    await dbRun("DELETE FROM listings WHERE id = ?", [req.params.id]);
    res.json({ message: "Объявление удалено" });
  } catch (error) {
    console.error("delete listing error:", error);
    res.status(500).json({ error: "Delete listing failed" });
  }
});

app.use("/api/admin", adminRouter);

if (fs.existsSync(frontendBuildDir)) {
  app.use(express.static(frontendBuildDir));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendBuildDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
