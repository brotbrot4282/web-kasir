declare module "@point-of-sale/receipt-printer-encoder" {
  export type PrinterLanguage = "esc-pos" | "star-prnt" | "star-line";
  export type Align = "left" | "center" | "right";

  export interface EncoderOptions {
    printerModel?: string;
    language?: PrinterLanguage;
    columns?: number;
    feedBeforeCut?: number;
    newline?: string;
    imageMode?: "raster" | "column";
    codepageMapping?: string | Record<string, number>;
    codepageCandidates?: string[];
    createCanvas?: (width: number, height: number) => unknown;
  }

  export interface TableColumn {
    width?: number;
    marginLeft?: number;
    marginRight?: number;
    align?: "left" | "right";
    verticalAlign?: "top" | "bottom";
  }

  export interface BarcodeOptions {
    height?: number;
    width?: number;
    text?: boolean;
  }

  export interface QrcodeOptions {
    model?: number;
    size?: number;
    errorlevel?: "l" | "m" | "q" | "h";
  }

  export interface Pdf417Options {
    width?: number;
    height?: number;
    columns?: number;
    rows?: number;
    errorlevel?: number;
    truncated?: boolean;
  }

  export interface RuleOptions {
    style?: "single" | "double";
    width?: number;
  }

  export interface BoxOptions {
    style?: "none" | "single" | "double";
    width?: number;
    marginLeft?: number;
    marginRight?: number;
    paddingLeft?: number;
    paddingRight?: number;
    align?: "left" | "right";
  }

  export type Dithering = "threshold" | "bayer" | "floydsteinberg" | "atkinson";
  export type ImageInput = ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | SVGImageElement | unknown;

  export class ReceiptPrinterEncoder {
    constructor(options?: EncoderOptions);

    static printerModels: Array<{ id: string; name: string }>;

    readonly columns: number;
    readonly language: string;
    readonly printerCapabilities: unknown;

    initialize(): this;
    codepage(codepage: string): this;
    text(value: string): this;
    newline(count?: number): this;
    line(value: string): this;
    underline(on?: boolean): this;
    bold(on?: boolean): this;
    italic(on?: boolean): this;
    invert(on?: boolean): this;
    align(align: Align): this;
    font(font: string): this;
    width(value: number): this;
    height(value: number): this;
    size(width: number, height?: number): this;
    table(
      columns: TableColumn[],
      rows: Array<Array<string | ((encoder: ReceiptPrinterEncoder) => void)>>
    ): this;
    box(options: BoxOptions, content: string | ((encoder: ReceiptPrinterEncoder) => void)): this;
    rule(options?: RuleOptions): this;
    barcode(value: string, symbology: string, options?: BarcodeOptions): this;
    qrcode(value: string, options?: QrcodeOptions): this;
    pdf417(value: string, options?: Pdf417Options): this;
    image(
      image: ImageInput,
      width: number,
      height: number,
      dithering?: Dithering,
      threshold?: number
    ): this;
    pulse(device?: number, onTime?: number, offTime?: number): this;
    cut(type?: "partial" | "full"): this;
    raw(data: number[] | Uint8Array): this;
    encode(): Uint8Array;
  }

  export default ReceiptPrinterEncoder;
}
