import { MongoClient, ObjectId } from "mongodb";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  status: "unregistered" | "pending" | "approved" | "rejected";
  isAdmin?: boolean;
  groupIds: string[];
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  ytId: string;
  title: string;
  description?: string | null;
  thumbnail: string;
  ytPrivacyStatus?: string | null;
  publishedAt: Date;
  shootingDate?: Date | null;
  groupIds: string[];
  tags: string[];
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  disabled: boolean;
  usedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

// 延遲取得資料庫連線 (Lazy connection at runtime)，避免 Docker 建置期缺少環境變數報錯，且絕無寫死明碼
const getDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("❌ 缺少環境變數 MONGODB_URI，請確認 .env.local 已正確設定");
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }

  const client = await globalForMongo._mongoClientPromise;
  return client.db();
};

const mapId = <T>(doc: any): T | null => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id ? _id.toString() : doc.id,
    ...rest,
  } as T;
};

const parseWhere = (where: any = {}) => {
  const query: any = {};
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "id") {
      if (typeof val === "string" && ObjectId.isValid(val)) {
        query._id = new ObjectId(val);
      } else if (typeof val === "object" && val !== null && (val as any).in) {
        query._id = {
          $in: (val as any).in.map((id: string) =>
            ObjectId.isValid(id) ? new ObjectId(id) : id
          ),
        };
      } else {
        query.id = val;
      }
    } else if (key === "OR" && Array.isArray(val)) {
      query.$or = val.map((item) => parseWhere(item));
    } else if (typeof val === "object" && val !== null) {
      if ((val as any).has !== undefined) {
        query[key] = (val as any).has;
      } else if ((val as any).hasSome !== undefined) {
        query[key] = { $in: (val as any).hasSome };
      } else if ((val as any).in !== undefined) {
        query[key] = { $in: (val as any).in };
      } else if ((val as any).not !== undefined) {
        query[key] = { $ne: (val as any).not };
      } else {
        query[key] = val;
      }
    } else {
      query[key] = val;
    }
  }
  return query;
};

// 建立通用的 Collection 代理介面
const createModel = <T>(collectionName: string) => {
  return {
    async findUnique(args: { where: any }): Promise<T | null> {
      const db = await getDb();
      const query = parseWhere(args.where);
      const doc = await db.collection(collectionName).findOne(query);
      return mapId<T>(doc);
    },

    async findFirst(args?: { where?: any; orderBy?: any }): Promise<T | null> {
      const db = await getDb();
      const query = parseWhere(args?.where || {});
      let cursor = db.collection(collectionName).find(query);
      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor = cursor.sort(sort);
      }
      const doc = await cursor.limit(1).next();
      return mapId<T>(doc);
    },

    async findMany(args?: {
      where?: any;
      orderBy?: any;
      select?: any;
      skip?: number;
      take?: number;
    }): Promise<T[]> {
      const db = await getDb();
      const query = parseWhere(args?.where || {});
      let cursor = db.collection(collectionName).find(query);

      if (args?.orderBy) {
        const sort: any = {};
        for (const [k, v] of Object.entries(args.orderBy)) {
          sort[k] = v === "desc" ? -1 : 1;
        }
        cursor = cursor.sort(sort);
      }

      if (args?.skip) cursor = cursor.skip(args.skip);
      if (args?.take) cursor = cursor.limit(args.take);

      const docs = await cursor.toArray();
      return docs.map((d) => mapId<T>(d)!);
    },

    async create(args: { data: any }): Promise<T> {
      const db = await getDb();
      const now = new Date();
      const doc = {
        ...args.data,
        createdAt: args.data.createdAt || now,
        updatedAt: args.data.updatedAt || now,
      };
      const result = await db.collection(collectionName).insertOne(doc);
      return mapId<T>({ _id: result.insertedId, ...doc })!;
    },

    async update(args: { where: any; data?: any; $pull?: any }): Promise<T> {
      const db = await getDb();
      const query = parseWhere(args.where);
      const updateData = { ...(args.data || {}) };
      delete updateData.id;

      const $set: any = { updatedAt: new Date() };
      const $inc: any = {};
      const $push: any = {};

      for (const [k, v] of Object.entries(updateData)) {
        if (typeof v === "object" && v !== null && (v as any).increment !== undefined) {
          $inc[k] = (v as any).increment;
        } else if (typeof v === "object" && v !== null && (v as any).push !== undefined) {
          $push[k] = (v as any).push;
        } else {
          $set[k] = v;
        }
      }

      const updateOp: any = {};
      if (Object.keys($set).length > 0) updateOp.$set = $set;
      if (Object.keys($inc).length > 0) updateOp.$inc = $inc;
      if (Object.keys($push).length > 0) updateOp.$push = $push;
      if (args.$pull) updateOp.$pull = args.$pull;

      await db.collection(collectionName).updateOne(query, updateOp);
      const updated = await db.collection(collectionName).findOne(query);
      return mapId<T>(updated)!;
    },

    async updateMany(args: { where: any; data?: any; $pull?: any }): Promise<{ count: number }> {
      const db = await getDb();
      const query = parseWhere(args.where);
      const updateOp: any = {};

      if (args.data) {
        const updateData = { ...args.data };
        delete updateData.id;
        updateOp.$set = { ...updateData, updatedAt: new Date() };
      } else {
        updateOp.$set = { updatedAt: new Date() };
      }

      if (args.$pull) {
        updateOp.$pull = args.$pull;
      }

      const result = await db.collection(collectionName).updateMany(query, updateOp);
      return { count: result.modifiedCount };
    },

    async delete(args: { where: any }): Promise<T | null> {
      const db = await getDb();
      const query = parseWhere(args.where);
      const existing = await db.collection(collectionName).findOne(query);
      await db.collection(collectionName).deleteOne(query);
      return mapId<T>(existing);
    },

    async deleteMany(args: { where: any }): Promise<{ count: number }> {
      const db = await getDb();
      const query = parseWhere(args.where);
      const result = await db.collection(collectionName).deleteMany(query);
      return { count: result.deletedCount };
    },

    async count(args?: { where?: any }): Promise<number> {
      const db = await getDb();
      const query = parseWhere(args?.where || {});
      return await db.collection(collectionName).countDocuments(query);
    },
  };
};

export const prisma = {
  user: createModel<User>("User"),
  video: createModel<Video>("Video"),
  group: createModel<Group>("Group"),
  inviteCode: createModel<InviteCode>("InviteCode"),
  systemConfig: createModel<SystemConfig>("SystemConfig"),
};

export default prisma;
