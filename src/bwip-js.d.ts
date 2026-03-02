declare module "bwip-js" {
  interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    [key: string]: any;
  }
  function toCanvas(canvas: HTMLCanvasElement, options: ToCanvasOptions): void;
  export default { toCanvas };
}
