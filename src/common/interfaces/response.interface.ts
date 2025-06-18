// success: true => message, data
// success: false => message, error

export interface ResponseInterface {
  success: boolean;
  message: string;
  data: any[];
  error: any;
}
