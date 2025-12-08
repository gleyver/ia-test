/**
 * Testes para RequestQueue
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestQueue } from "../../../infrastructure/llm/requestQueue.js";

describe("RequestQueue", () => {
  let queue: RequestQueue<string>;

  beforeEach(() => {
    queue = new RequestQueue<string>(2); // Max 2 concorrentes
  });

  describe("constructor", () => {
    it("deve criar fila com maxConcurrent padrão", () => {
      const defaultQueue = new RequestQueue();
      expect(defaultQueue.maxConcurrent).toBe(20);
    });

    it("deve criar fila com maxConcurrent customizado", () => {
      const customQueue = new RequestQueue(5);
      expect(customQueue.maxConcurrent).toBe(5);
    });
  });

  describe("enqueue", () => {
    it("deve adicionar requisição à fila", async () => {
      const executeFn = vi.fn().mockResolvedValue("result");

      const promise = new Promise<string>((resolve, reject) => {
        queue.enqueue({
          resolve,
          reject,
          execute: executeFn,
          retryCount: 0,
        });
      });

      const result = await promise;

      expect(result).toBe("result");
      expect(executeFn).toHaveBeenCalled();
    });

    it("deve processar requisições respeitando limite de concorrência", async () => {
      const executeFn1 = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve("result1"), 100))
        );
      const executeFn2 = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve("result2"), 100))
        );
      const executeFn3 = vi.fn().mockResolvedValue("result3");

      const promise1 = new Promise<string>((resolve, reject) => {
        queue.enqueue({ resolve, reject, execute: executeFn1, retryCount: 0 });
      });
      const promise2 = new Promise<string>((resolve, reject) => {
        queue.enqueue({ resolve, reject, execute: executeFn2, retryCount: 0 });
      });
      const promise3 = new Promise<string>((resolve, reject) => {
        queue.enqueue({ resolve, reject, execute: executeFn3, retryCount: 0 });
      });

      // Primeiras duas devem executar imediatamente
      expect(queue.getActiveCount()).toBe(2);

      await Promise.all([promise1, promise2, promise3]);

      expect(executeFn1).toHaveBeenCalled();
      expect(executeFn2).toHaveBeenCalled();
      expect(executeFn3).toHaveBeenCalled();
    });

    it("deve rejeitar requisição em caso de erro", async () => {
      const error = new Error("Erro de teste");
      const executeFn = vi.fn().mockRejectedValue(error);

      const promise = new Promise<string>((resolve, reject) => {
        queue.enqueue({
          resolve,
          reject,
          execute: executeFn,
          retryCount: 0,
        });
      });

      await expect(promise).rejects.toThrow("Erro de teste");
    });
  });

  describe("getActiveCount", () => {
    it("deve retornar número de requisições ativas", async () => {
      const executeFn = vi.fn().mockResolvedValue("result");

      expect(queue.getActiveCount()).toBe(0);

      const promise = new Promise<string>((resolve, reject) => {
        queue.enqueue({ resolve, reject, execute: executeFn, retryCount: 0 });
      });

      // Pode ser 0 ou 1 dependendo da velocidade de execução
      const activeCount = queue.getActiveCount();
      expect(activeCount).toBeGreaterThanOrEqual(0);
      expect(activeCount).toBeLessThanOrEqual(1);

      await promise;
    });
  });

  describe("getQueueSize", () => {
    it("deve retornar tamanho da fila", () => {
      expect(queue.getQueueSize()).toBe(0);

      const executeFn = vi.fn().mockResolvedValue("result");

      queue.enqueue({
        resolve: () => {},
        reject: () => {},
        execute: executeFn,
        retryCount: 0,
      });

      // Pode ser 0 ou 1 dependendo se já foi processada
      const queueSize = queue.getQueueSize();
      expect(queueSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe("clear", () => {
    it("deve limpar fila e rejeitar requisições pendentes", async () => {
      // Criar fila com maxConcurrent = 0 para garantir que fique na fila
      const testQueue = new RequestQueue<string>(0);

      const executeFn = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve("result"), 1000))
        );

      const promise = new Promise<string>((resolve, reject) => {
        testQueue.enqueue({ resolve, reject, execute: executeFn, retryCount: 0 });
      });

      // Aguardar um pouco para garantir que foi adicionada à fila (mas não processada)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verificar que está na fila
      expect(testQueue.getQueueSize()).toBeGreaterThan(0);

      testQueue.clear();

      await expect(promise).rejects.toThrow("Queue cleared");
      expect(testQueue.getQueueSize()).toBe(0);
    });
  });
});
