// success: true => message, data
// success: false => errorMessage, error
import { ResponseInterface } from '../interfaces/response.interface';

export class ResponseError implements ResponseInterface {
  constructor(infoMessage: string, data?: any) {
    this.success = false;
    this.message = infoMessage;
    this.data = data;
    console.warn(
      new Date().toString() +
        ' - [Response]: ' +
        infoMessage +
        (data ? ' - ' + JSON.stringify(data) : ''),
    );
  }
  message: string;
  data: any[];
  error: any;
  success: boolean;
}

export class ResponseSuccess implements ResponseInterface {
  constructor(infoMessage: string, data?: any, notLog?: boolean) {
    this.success = true;
    this.message = infoMessage;
    this.data = data;
    if (!notLog) {
      try {
        const offuscateRequest = JSON.parse(JSON.stringify(data));
        if (offuscateRequest && offuscateRequest.token)
          offuscateRequest.token = '*******';
        console.log(
          new Date().toString() +
            ' - [Response]: ' +
            JSON.stringify(offuscateRequest),
        );
        // eslint-disable-next-line no-empty
      } catch {}
    }
  }
  message: string;
  data: any[];
  error: any;
  success: boolean;
}
