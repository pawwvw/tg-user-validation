declare module "tg-user-validation" {
  interface initData {
    user: string;
  }
  export default function validate_user(initData: initData, BOT_TOKEN: string): object | boolean;
}
