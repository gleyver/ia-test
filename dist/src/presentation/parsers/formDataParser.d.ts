/**
 * Parser de Form-Data para requisições multipart e JSON
 * Isola lógica de parsing da camada de rota
 */
import { Context } from "hono";
import type { FileLike } from "../../shared/types/types.js";
export interface ParsedFormData {
  file?: FileLike;
  query?: string;
}
/**
 * Parser de form-data para diferentes Content-Types
 */
export declare class FormDataParser {
  /**
   * Parse form-data de uma requisição Hono
   */
  parse(c: Context): Promise<ParsedFormData>;
  /**
   * Verifica se é multipart/form-data
   */
  private isMultipart;
  /**
   * Verifica se é application/x-www-form-urlencoded
   */
  private isFormUrlEncoded;
  /**
   * Verifica se é application/json
   */
  private isJson;
  /**
   * Parse multipart/form-data usando Busboy
   */
  private parseMultipart;
  /**
   * Extrai headers em formato objeto simples
   */
  private extractHeaders;
  /**
   * Verifica se é Headers object (Web API)
   */
  private isHeadersObject;
  /**
   * Itera sobre Headers object
   */
  private forEachHeader;
  /**
   * Extrai headers de objeto simples
   */
  private extractFromObject;
  /**
   * Converte ReadableStream para Node.js Readable
   */
  private convertToNodeStream;
  /**
   * Processa stream do Busboy
   */
  private processBusboyStream;
  /**
   * Processa arquivo do stream
   */
  private handleFile;
  /**
   * Parse application/json
   */
  private parseJson;
}
//# sourceMappingURL=formDataParser.d.ts.map
