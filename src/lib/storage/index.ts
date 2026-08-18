import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Мінімальна абстракція об'єктного сховища. У MVP реалізовано лише
 * локальний драйвер (диск), достатній для локальної розробки й
 * демонстрації. S3-сумісний драйвер — заглушка з чіткою помилкою, щоб не
 * приховувати відсутність реалізації (задокументовано в
 * docs/KNOWN_LIMITATIONS.md).
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

class LocalStorageDriver implements StorageDriver {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private resolve(key: string): string {
    const safeKey = key.replace(/\.\./g, "");
    return path.join(this.baseDir, safeKey);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }
}

class UnimplementedS3Driver implements StorageDriver {
  async put(): Promise<void> {
    throw new Error(
      "S3-сумісний драйвер сховища ще не реалізований у цьому MVP. Встановіть STORAGE_DRIVER=local " +
        "або реалізуйте драйвер перед використанням у production."
    );
  }
  async get(): Promise<Buffer> {
    throw new Error("S3-сумісний драйвер сховища ще не реалізований у цьому MVP.");
  }
}

let driver: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (driver) return driver;
  const kind = process.env.STORAGE_DRIVER ?? "local";
  if (kind === "local") {
    driver = new LocalStorageDriver(process.env.STORAGE_LOCAL_DIR ?? "./.storage");
  } else {
    driver = new UnimplementedS3Driver();
  }
  return driver;
}
