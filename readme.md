# tg-user-validator

A lightweight Node.js package designed to simplify the validation of Telegram Mini Apps user data, ensuring its integrity and decoding it for seamless integration.

## Installation

```sh
npm install tg-user-validation
```

## Usage

```typescript
import validate_user from "tg-user-validation";

const initData = window.Telegram.WebApp.initData;
const BOT_TOKEN = 'your-telegram-bot-token';

const userData = validate_user(initData, BOT_TOKEN);

if (userData) {
    console.log('User data is valid:', userData);
} else {
    console.log('Invalid user data');
}
```

## How It Works

- Extracts the `hash` from `initData.user`.
- Reconstructs the `data_check_string` by sorting and joining the remaining parameters.
- Computes the HMAC-SHA-256 hash using the bot token.
- Compares the computed hash with the received hash.
- If they match, returns the decoded user object; otherwise, returns `false`.

## Function Signature

```typescript
validate_user(initData: initData, BOT_TOKEN: string): object | boolean;
```

### Parameters

- `initData`: An object containing the `user` data string from Telegram Mini App.
- `BOT_TOKEN`: Your Telegram bot's token used to verify the data integrity.

### Returns

- Returns a decoded user object if the validation is successful.
- Returns `false` if the validation fails.

## How It Works

- Extracts the `hash` from `initData.user`.
- Reconstructs the `data_check_string` by sorting and joining the remaining parameters.
- Computes the HMAC-SHA-256 hash using the bot token.
- Compares the computed hash with the received hash.
- If they match, returns the decoded user object; otherwise, returns `false`.

## License  
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.  
