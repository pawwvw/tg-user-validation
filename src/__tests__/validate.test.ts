import { validate } from "../index";
import * as crypto from "crypto";

const createTestInitData = (
  data: Record<string, any>,
  botToken: string
): string => {
  const dataCheckArr: string[] = [];
  const params = new URLSearchParams();

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      let stringValue: string;
      if (
        ["user", "receiver", "chat"].includes(key) &&
        typeof value === "object"
      ) {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      params.set(key, stringValue);
      if (key !== "hash") {
        dataCheckArr.push(`${key}=${stringValue}`);
      }
    }
  }

  dataCheckArr.sort((a, b) => a.localeCompare(b));
  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  params.set("hash", hash);

  return params.toString();
};

describe("Telegram InitData Validation", () => {
  const BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
  const sampleUserData = {
    id: 987654321,
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    language_code: "en",
    is_premium: true,
  };
  const nowSeconds = Math.floor(Date.now() / 1000);

  it("should validate correct initData successfully", () => {
    const testData = {
      user: sampleUserData,
      auth_date: nowSeconds,
      query_id: "AAHdF611AAAAAHRXr_j1ldF7",
      start_param: "test",
    };
    const initDataString = createTestInitData(testData, BOT_TOKEN);

    const result = validate(initDataString, BOT_TOKEN);

    expect(result).toBeDefined();
    expect(result.auth_date).toEqual(testData.auth_date);
    expect(result.query_id).toEqual(testData.query_id);
    expect(result.start_param).toEqual(testData.start_param);
    expect(result.user).toEqual(sampleUserData);
    expect(result.hash).toBeDefined();
  });

  it("should throw error for invalid hash", () => {
    const testData = {
      user: sampleUserData,
      auth_date: nowSeconds,
    };
    const initDataString = createTestInitData(testData, BOT_TOKEN);
    const tamperedInitData = initDataString.replace(
      /hash=([a-f0-9]+)/,
      "hash=invalidhash123"
    );

    expect(() => {
      validate(tamperedInitData, BOT_TOKEN);
    }).toThrow(
      "Validation failed: Calculated hash does not match received hash."
    );
  });

  it("should throw error for tampered data (auth_date changed)", () => {
    const testData = {
      user: sampleUserData,
      auth_date: nowSeconds,
    };
    const initDataString = createTestInitData(testData, BOT_TOKEN);
    const params = new URLSearchParams(initDataString);
    params.set("auth_date", String(nowSeconds - 10000));
    const tamperedInitData = params.toString();

    expect(() => {
      validate(tamperedInitData, BOT_TOKEN);
    }).toThrow(
      "Validation failed: Calculated hash does not match received hash."
    );
  });

  it("should throw error if data expired (using expiresIn option)", () => {
    const expiredAuthDate = nowSeconds - 3700;
    const testData = {
      user: sampleUserData,
      auth_date: expiredAuthDate,
    };
    const initDataString = createTestInitData(testData, BOT_TOKEN);

    expect(() => {
      validate(initDataString, BOT_TOKEN, { expiresIn: 3600 });
    }).toThrow(/Validation failed: Data expired/);
  });

  it("should NOT throw error if data is fresh (using expiresIn option)", () => {
    const freshAuthDate = nowSeconds - 1800;
    const testData = {
      user: sampleUserData,
      auth_date: freshAuthDate,
    };
    const initDataString = createTestInitData(testData, BOT_TOKEN);

    expect(() => {
      validate(initDataString, BOT_TOKEN, { expiresIn: 3600 });
    }).not.toThrow();

    const result = validate(initDataString, BOT_TOKEN, { expiresIn: 3600 });
    expect(result.auth_date).toEqual(freshAuthDate);
  });

  it("should throw error if hash parameter is missing", () => {
    const testData = {
      user: sampleUserData,
      auth_date: nowSeconds,
    };
    let initDataString = createTestInitData(testData, BOT_TOKEN);
    initDataString = initDataString.replace(/&?hash=[a-f0-9]+/, "");

    expect(() => {
      validate(initDataString, BOT_TOKEN);
    }).toThrow('Invalid initData: "hash" parameter not found.');
  });

  it("should throw error for empty initData string", () => {
    expect(() => {
      validate("", BOT_TOKEN);
    }).toThrow("Invalid initData: must be a non-empty string.");
  });

  it("should throw error for empty botToken string", () => {
    const testData = { user: sampleUserData, auth_date: nowSeconds };
    const initDataString = createTestInitData(testData, BOT_TOKEN);
    expect(() => {
      validate(initDataString, "");
    }).toThrow("Invalid botToken: must be a non-empty string.");
  });

  it("should throw error if user field is not valid JSON", () => {
    const testData = {
      user: "{invalid_json",
      auth_date: nowSeconds,
    };
    const params = new URLSearchParams();
    params.set("user", testData.user);
    params.set("auth_date", String(testData.auth_date));

    const dataCheckArr = [
      `auth_date=${testData.auth_date}`,
      `user=${testData.user}`,
    ];
    dataCheckArr.sort((a, b) => a.localeCompare(b));
    const dataCheckString = dataCheckArr.join("\n");
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    params.set("hash", hash);

    const initDataString = params.toString();

    expect(() => {
      validate(initDataString, BOT_TOKEN);
    }).toThrow('Invalid initData: Failed to parse JSON for field "user"');
  });
});
