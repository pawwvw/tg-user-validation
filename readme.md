# Telegram InitData Validator (tg-user-validation)

[![npm version](https://badge.fury.io/js/tg-user-validation.svg)](https://badge.fury.io/js/tg-user-validation)

A lightweight TypeScript package to securely validate the `initData` string provided by Telegram Mini Apps (Web Apps). It verifies the data integrity using the bot token, checks for expiration (optional), and decodes the data into a structured object.

## Key Features

- **Cryptographic Validation:** Verifies the authenticity of `initData` using HMAC-SHA256 signature and your bot token.
- **Expiration Check:** Optionally ensures the data hasn't expired based on `auth_date` and a configurable timespan.
- **Data Decoding:** Parses URL-encoded `initData` string into a useful JavaScript object (`ParsedInitData`).
- **TypeScript Support:** Fully typed with exported interfaces for better developer experience and safety.
- **Clear Error Handling:** Throws descriptive errors upon validation failure (invalid signature, expired data, incorrect format).

## Installation

```bash
npm install tg-user-validation
# or
yarn add tg-user-validation
```

## ⚠️ Security Warning

**Never expose your `BOT_TOKEN` in client-side code (browser, Mini App)!**

The validation process relies on your secret bot token. Performing validation directly within the Mini App would expose your token, compromising your bot's security.

**Validation MUST be performed on your backend server.** The Mini App should send the `initData` string to your server, and the server should use this package (or similar logic) with the secure `BOT_TOKEN` to validate the data before trusting it.

## Usage (Backend Example)

```typescript
import {
  validate,
  ParsedInitData,
  ValidationOptions,
} from "tg-user-validation";

const initDataString =
  "query_id=AAHdF611AAAAAHRXr_j1ldF7&user=%7B%22id%22%3A987654321%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%2C%22is_premium%22%3Atrue%7D&auth_date=1678886400&hash=c819dc505a8f70b4f7476deda8631130d96c6a4a8cf498f14a7120b86475ab3b";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_SECURE_BOT_TOKEN";

try {
  const options: ValidationOptions = {
    expiresIn: 3600,
  };
  const validatedData: ParsedInitData = validate(
    initDataString,
    BOT_TOKEN,
    options
  );

  console.log("Validation successful! Data:", validatedData);
  console.log("User ID:", validatedData.user?.id);
  console.log("Auth Date:", new Date(validatedData.auth_date * 1000));
  if (validatedData.user?.is_premium) {
    console.log("User has Telegram Premium!");
  }
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

## API

### `validate(initDataString, botToken, options?)`

- **`initDataString: string`**: The raw `initData` string obtained from `window.Telegram.WebApp.initData`.
- **`botToken: string`**: Your secret Telegram bot token. **Keep this secure on your server!**
- **`options?: ValidationOptions`**: Optional configuration object.

  - **`expiresIn?: number`**: Optional. Maximum allowed age of the data in seconds. If the time elapsed since `auth_date` exceeds this value, validation fails. If not provided, expiration is not checked.

- **Returns**: `ParsedInitData` - A decoded object containing the validated data upon successful validation. See the `ParsedInitData` interface below.
- **Throws**: `Error` - If validation fails due to:
  - Incorrect signature (`hash` doesn't match).
  - Missing `hash` parameter in `initDataString`.
  - Data expiration (if `expiresIn` is set).
  - Invalid input (`initDataString` or `botToken` is empty).
  - Failure to parse required JSON fields (`user`, `receiver`, `chat`).
  - Invalid `auth_date` format.

### Exported Types

You can import these TypeScript interfaces for better type safety:

- **`ParsedInitData`**: Interface describing the structure of the returned object on successful validation. Includes fields like `query_id`, `user`, `receiver`, `chat`, `auth_date`, `hash`, etc.
- **`TelegramUser`**: Interface describing the structure of the `user` and `receiver` objects within `ParsedInitData`.
- **`ValidationOptions`**: Interface for the optional `options` parameter of the `validate` function.

```typescript
import {
  ParsedInitData,
  TelegramUser,
  ValidationOptions,
} from "tg-user-validation";
```

## How It Works Under the Hood

1.  Parses the input `initDataString` (which is URL-encoded) into key-value pairs.
2.  Extracts the `hash` value.
3.  Removes the `hash` pair from the collection.
4.  Sorts the remaining key-value pairs alphabetically by key.
5.  Joins the sorted pairs into a single string with the format `key=value`, separated by newline characters (`\n`). This is the `data-check-string`.
6.  Generates a secret key by performing HMAC-SHA256 hashing on the `botToken` using `"WebAppData"` as the key.
7.  Calculates the HMAC-SHA256 hash of the `data-check-string` using the generated secret key.
8.  Compares the calculated hash (in hexadecimal format) with the `hash` received in the `initDataString`. If they don't match, it throws an error.
9.  (Optional) If `options.expiresIn` is provided, it checks if `currentTime - auth_date` exceeds `expiresIn`. If it does, it throws an error.
10. Decodes specific fields known to be JSON (`user`, `receiver`, `chat`) and parses `auth_date` into a number. Handles potential parsing errors.
11. Returns the fully decoded and validated data as a `ParsedInitData` object.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
