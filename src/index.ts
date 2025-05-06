import * as crypto from "crypto";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface ParsedInitData {
  query_id?: string;
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: "sender" | "private" | "group" | "supergroup" | "channel";
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

interface ValidationOptions {
  expiresIn?: number;
}

const validate = (
  initDataString: string,
  botToken: string,
  options?: ValidationOptions
): ParsedInitData => {
  if (typeof initDataString !== "string" || initDataString.length === 0) {
    throw new Error("Invalid initData: must be a non-empty string.");
  }
  if (typeof botToken !== "string" || botToken.length === 0) {
    throw new Error("Invalid botToken: must be a non-empty string.");
  }

  const urlParams = new URLSearchParams(initDataString);
  const receivedHash = urlParams.get("hash");

  if (!receivedHash) {
    throw new Error('Invalid initData: "hash" parameter not found.');
  }

  urlParams.delete("hash");

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== receivedHash) {
    throw new Error(
      "Validation failed: Calculated hash does not match received hash."
    );
  }

  const parsedData: Record<string, any> = {};
  const jsonFields = ["user", "receiver", "chat"];

  urlParams.forEach((value, key) => {
    if (jsonFields.includes(key)) {
      try {
        parsedData[key] = JSON.parse(value);
      } catch (error) {
        throw new Error(
          `Invalid initData: Failed to parse JSON for field "${key}". Value: ${value}`
        );
      }
    } else if (key === "auth_date") {
      const timestamp = parseInt(value, 10);
      if (isNaN(timestamp)) {
        throw new Error(
          `Invalid initData: "auth_date" is not a valid number. Value: ${value}`
        );
      }
      parsedData[key] = timestamp;
    } else {
      parsedData[key] = value;
    }
  });

  parsedData.hash = receivedHash;

  if (options?.expiresIn !== undefined) {
    if (typeof parsedData.auth_date !== "number") {
      throw new Error(
        'Invalid initData: "auth_date" field is missing or not a number, cannot check expiration.'
      );
    }
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - parsedData.auth_date > options.expiresIn) {
      throw new Error(
        `Validation failed: Data expired. Received auth_date: ${parsedData.auth_date}, Current time: ${currentTimestamp}, expiresIn: ${options.expiresIn}s`
      );
    }
  }

  return parsedData as ParsedInitData;
};

export { validate, ParsedInitData, TelegramUser, ValidationOptions };
