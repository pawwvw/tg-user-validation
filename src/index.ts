import * as crypto from 'crypto';

interface initData{
  user: string
}

const validate_user = (initData: initData, BOT_TOKEN: string): object | boolean => {
    const urlParams = new URLSearchParams(initData.user);
    const receivedHash = urlParams.get('hash');
    
    urlParams.delete('hash');

    const decodedData: Record<string, any> = {};
    urlParams.forEach((value, key) => {
      const decodedValue = decodeURIComponent(value);
      try {
        decodedData[key] = JSON.parse(decodedValue);
      } catch {
        decodedData[key] = decodedValue;
      }
    });

    // Создаем data_check_string
    const dataCheckString = [...urlParams.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Вычисляем HMAC-SHA-256 хеш
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    
    if (calculatedHash === receivedHash){
      return decodedData
    } else {
      return false
    }
  }

export default validate_user