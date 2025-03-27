import { Logger } from "./logger";

/**
 * 超时工具类
 */
export class Timeout {
  /**
   * 带超时的异步函数包装器
   * @param fn 要执行的异步函数
   * @param timeoutMs 超时时间（毫秒）
   * @param errorMessage 超时错误信息
   * @returns Promise<T> 执行结果
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    errorMessage: string = "Operation timed out"
  ): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) {
        Logger.error(error.message);
      }
      throw error;
    }
  }
} 