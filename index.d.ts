declare module "tg-user-validation" {
    interface InitData {
        user: string;
      }
    export default function validate_user(initData: initData, BOT_TOKEN: string): object | boolean;
  }
  